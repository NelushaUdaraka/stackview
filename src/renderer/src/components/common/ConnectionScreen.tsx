import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Wifi, ChevronDown, Loader2, AlertCircle, Search, Check, Minus, Square, X,
  Palette, RefreshCw, ArrowUpCircle, CheckCircle2, ArrowRight,
} from 'lucide-react'
import type { AppSettings, Theme, UpdaterStatus } from '../../types'
import { AWS_REGIONS } from '../../constants'
import { ALL_THEMES, THEME_DEFINITIONS } from '../../../../shared/themes'
import { Toggle } from './ui'

interface Props {
  initialSettings: AppSettings
  onConnected: (endpoint: string, region: string) => void
  theme: Theme
  onSetTheme: (theme: Theme) => void
  appVersion: string
  autoUpdate: boolean
  onToggleAutoUpdate: () => void
  updaterStatus: UpdaterStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
}

const isWindows = window.electronAPI.platform === 'win32'
const isMac = window.electronAPI.platform === 'darwin'

/**
 * Pre-connection screen. Same chrome and palette as the main window, with a
 * single centred card — endpoint, region, connect.
 */
export default function ConnectionScreen({
  initialSettings,
  onConnected,
  theme,
  onSetTheme,
  appVersion,
  autoUpdate,
  onToggleAutoUpdate,
  updaterStatus,
  onCheckForUpdates,
  onInstallUpdate,
}: Props) {
  const [endpoint, setEndpoint] = useState(initialSettings.endpoint)
  const [region, setRegion] = useState(initialSettings.region)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionSearch, setRegionSearch] = useState('')
  const [themesOpen, setThemesOpen] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const themesRef = useRef<HTMLDivElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!themesOpen && !regionOpen) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (themesOpen && !themesRef.current?.contains(t)) setThemesOpen(false)
      if (regionOpen && !regionRef.current?.contains(t)) setRegionOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setThemesOpen(false)
      setRegionOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [themesOpen, regionOpen])

  useEffect(() => {
    if (!regionOpen) return
    setRegionSearch('')
    const id = setTimeout(() => searchRef.current?.focus(), 40)
    return () => clearTimeout(id)
  }, [regionOpen])

  const regions = useMemo(() => {
    const q = regionSearch.trim().toLowerCase()
    if (!q) return AWS_REGIONS
    return AWS_REGIONS.filter(r => r.value.toLowerCase().includes(q) || r.label.toLowerCase().includes(q))
  }, [regionSearch])

  const selectedRegionLabel = AWS_REGIONS.find(r => r.value === region)?.label ?? region

  const handleConnect = async () => {
    if (!endpoint.trim()) {
      setError('Endpoint URL is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.connect(endpoint.trim(), region)
      if (result.success) onConnected(endpoint.trim(), region)
      else setError(result.error ?? 'Connection failed')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-app">
      {/* Chrome — the same 36px bar the main window uses */}
      <div
        className="drag-region shrink-0 flex items-stretch surface-panel border-b border-theme"
        style={{ height: 'var(--titlebar-h)' }}
      >
        {isMac && (
          <div className="no-drag flex items-center gap-1.5 px-3">
            <button
              onClick={() => window.electronAPI.close()}
              className="w-3 h-3 rounded-full transition-opacity hover:opacity-100 opacity-80"
              style={{ backgroundColor: 'rgb(var(--danger))' }}
            />
            <button
              onClick={() => window.electronAPI.minimize()}
              className="w-3 h-3 rounded-full transition-opacity hover:opacity-100 opacity-80"
              style={{ backgroundColor: 'rgb(var(--accent))' }}
            />
            <button
              onClick={() => window.electronAPI.maximize()}
              className="w-3 h-3 rounded-full transition-opacity hover:opacity-100 opacity-80"
              style={{ backgroundColor: 'rgb(var(--ok))' }}
            />
          </div>
        )}

        <div className="flex items-center gap-2.5 px-3.5">
          <span className="w-[15px] h-[15px] rounded shrink-0" style={{ backgroundColor: 'rgb(var(--accent))' }} />
          <span className="text-[12.5px] font-bold text-1">StackView</span>
        </div>

        <div className="flex-1" />

        <div ref={themesRef} className="no-drag relative flex items-stretch">
          <button
            onClick={() => setThemesOpen(o => !o)}
            className="px-3 flex items-center gap-2 text-3 hover:text-1 hover:bg-raised transition-colors"
            title="Theme"
          >
            <Palette size={13} />
          </button>

          {themesOpen && (
            <div className="popover absolute right-0 top-full mt-1 z-50 w-[300px]">
              <div className="px-1.5 pt-1 pb-2">
                <div className="ui-label mb-2">THEME</div>
                <div className="grid grid-cols-3 gap-1.5 max-h-[260px] overflow-y-auto">
                  {ALL_THEMES.map(key => {
                    const def = THEME_DEFINITIONS[key]
                    const isActive = key === theme
                    return (
                      <button
                        key={key}
                        onClick={() => onSetTheme(key)}
                        className="rounded-[5px] overflow-hidden"
                        style={{
                          outline: isActive ? '2px solid rgb(var(--accent))' : '1px solid rgb(var(--border))',
                          outlineOffset: 1,
                        }}
                        title={def.label}
                      >
                        <div
                          className="h-[22px] flex items-start justify-end p-0.5"
                          style={{ backgroundColor: def.preview.bg }}
                        >
                          {isActive && <Check size={9} color="#ffffff" />}
                        </div>
                        <div
                          className="h-[22px] flex items-center gap-1 px-1.5"
                          style={{ backgroundColor: def.preview.surface }}
                        >
                          <span
                            className="flex-1 min-w-0 truncate text-left"
                            style={{ fontSize: 8, fontWeight: 700, color: def.preview.text }}
                          >
                            {def.label}
                          </span>
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: def.preview.accent }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {isWindows && (
          <div className="no-drag flex items-stretch shrink-0">
            <button
              onClick={() => window.electronAPI.minimize()}
              className="w-11 flex items-center justify-center border-l border-theme text-2 hover:bg-raised hover:text-1 transition-colors"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => window.electronAPI.maximize()}
              className="w-11 flex items-center justify-center border-l border-theme text-2 hover:bg-raised hover:text-1 transition-colors"
            >
              <Square size={12} />
            </button>
            <button
              onClick={() => window.electronAPI.close()}
              className="w-12 flex items-center justify-center border-l border-theme text-2 transition-colors"
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgb(var(--danger))'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = ''
                e.currentTarget.style.color = ''
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Card */}
      <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-8">
        <div className="w-full" style={{ maxWidth: 380 }}>
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className="w-[54px] h-[54px] rounded-[14px] flex items-center justify-center mb-4 bg-raised border border-theme"
            >
              <span className="w-5 h-5 rounded-[5px]" style={{ backgroundColor: 'rgb(var(--accent))' }} />
            </div>
            <h1 className="text-[17px] font-extrabold text-1 mb-1">Connect to LocalStack</h1>
            <p className="text-[13px] text-3">Point StackView at a running LocalStack endpoint.</p>
          </div>

          <div className="card p-4">
            <div className="ui-label mb-2">ENDPOINT URL</div>
            <div
              className="h-8 rounded-[7px] flex items-center gap-2.5 px-2.5 border transition-colors"
              style={{ backgroundColor: 'rgb(var(--bg-app))', borderColor: 'rgb(var(--border))' }}
            >
              <Wifi size={13} className="text-3 shrink-0" />
              <input
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="http://localhost:4566"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent border-none text-1"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              />
            </div>
            <div className="text-[11px] text-4 mt-1.5">Default endpoint is http://localhost:4566</div>

            <div ref={regionRef} className="relative mt-4">
              <div className="ui-label mb-2">REGION</div>
              <button
                onClick={() => setRegionOpen(o => !o)}
                className="w-full h-8 rounded-[7px] flex items-center gap-2 px-2.5 border transition-colors"
                style={{
                  backgroundColor: 'rgb(var(--bg-app))',
                  borderColor: regionOpen ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                }}
              >
                <span className="shrink-0 text-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>
                  {region}
                </span>
                <span className="text-4">·</span>
                <span className="flex-1 min-w-0 text-[12.5px] text-1 truncate text-left">{selectedRegionLabel}</span>
                <ChevronDown size={13} className="shrink-0 text-3" />
              </button>

              {regionOpen && (
                <div
                  className="absolute left-0 right-0 mt-1.5 z-30 rounded-[9px] border border-theme overflow-hidden"
                  style={{ backgroundColor: 'rgb(var(--bg-app))', boxShadow: '0 18px 44px rgba(0,0,0,.45)' }}
                >
                  <div className="p-2.5 border-b border-theme">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4 pointer-events-none" />
                      <input
                        ref={searchRef}
                        value={regionSearch}
                        onChange={e => setRegionSearch(e.target.value)}
                        placeholder="Search regions..."
                        className="sidebar-search pl-8 h-[26px]"
                      />
                    </div>
                  </div>
                  <div className="max-h-[180px] overflow-y-auto">
                    {regions.length === 0 ? (
                      <div className="py-3.5 text-center text-xs text-3">No regions match</div>
                    ) : (
                      regions.map(r => {
                        const isActive = r.value === region
                        return (
                          <button
                            key={r.value}
                            onClick={() => {
                              setRegion(r.value)
                              setRegionOpen(false)
                            }}
                            className="w-full flex items-center gap-2.5 h-[29px] px-2.5 transition-colors hover:bg-raised"
                            style={{ backgroundColor: isActive ? 'rgb(var(--accent) / 0.10)' : undefined }}
                          >
                            <span
                              className="w-[104px] shrink-0 text-left"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                color: isActive ? 'rgb(var(--accent))' : 'rgb(var(--text-3))',
                              }}
                            >
                              {r.value}
                            </span>
                            <span
                              className="flex-1 min-w-0 text-xs truncate text-left"
                              style={{ color: isActive ? 'rgb(var(--accent))' : 'rgb(var(--text-2))' }}
                            >
                              {r.label}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div
                className="mt-4 flex items-start gap-2 rounded-[7px] px-2.5 py-2"
                style={{ backgroundColor: 'rgb(var(--danger) / 0.10)', border: '1px solid rgb(var(--danger) / 0.35)' }}
              >
                <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: 'rgb(var(--danger))' }} />
                <span className="text-[11.5px] leading-snug" style={{ color: 'rgb(var(--danger))' }}>
                  {error}
                </span>
              </div>
            )}

            <button onClick={handleConnect} disabled={loading} className="btn-primary w-full mt-4">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
              {loading ? 'Connecting…' : 'Connect'}
            </button>
          </div>

          {/* Updates + version */}
          <div className="mt-4 px-1">
            <Toggle checked={autoUpdate} onChange={onToggleAutoUpdate} label="Download updates automatically" />

            <div className="flex items-center justify-between gap-2 px-2.5 mt-1">
              <span className="ui-mono text-[10.5px]">{appVersion ? `v${appVersion}` : ''}</span>
              <div className="flex items-center gap-2">
                {updaterStatus.status === 'ready' ? (
                  <button onClick={onInstallUpdate} className="chip chip-active">
                    <ArrowUpCircle size={11} />
                    Install v{updaterStatus.version ?? ''}
                  </button>
                ) : (
                  <button
                    onClick={onCheckForUpdates}
                    disabled={updaterStatus.status === 'checking' || updaterStatus.status === 'downloading'}
                    className="chip"
                  >
                    {updaterStatus.status === 'checking' ? (
                      <RefreshCw size={11} className="animate-spin" />
                    ) : updaterStatus.status === 'not-available' ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <RefreshCw size={11} />
                    )}
                    {updaterStatus.status === 'checking'
                      ? 'Checking…'
                      : updaterStatus.status === 'downloading'
                        ? `Downloading ${updaterStatus.percent ?? 0}%`
                        : updaterStatus.status === 'not-available'
                          ? 'Up to date'
                          : 'Check for updates'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
