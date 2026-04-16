import { useState, useRef, useEffect } from 'react'
import {
  Wifi,
  WifiOff,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Check,
  Minus,
  Square,
  X,
  Settings,
  RefreshCw,
  Download,
  ArrowUpCircle,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import type { AppSettings, Theme, UpdaterStatus } from '../../types'
import { AWS_REGIONS } from '../../constants'
import { ALL_THEMES, THEME_DEFINITIONS } from '../../../../shared/themes'
import appIcon from '../../assets/icon.png'

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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [regionSearch, setRegionSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [settingsOpen])

  const selectedRegionLabel =
    AWS_REGIONS.find((r) => r.value === region)?.label ?? region

  const filteredRegions = AWS_REGIONS.filter(
    (r) =>
      r.value.toLowerCase().includes(regionSearch.toLowerCase()) ||
      r.label.toLowerCase().includes(regionSearch.toLowerCase())
  )

  useEffect(() => {
    if (regionOpen) {
      setRegionSearch('')
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [regionOpen])

  const handleConnect = async () => {
    if (!endpoint.trim()) {
      setError('Endpoint URL is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.connect(endpoint.trim(), region)
      if (result.success) {
        onConnected(endpoint.trim(), region)
      } else {
        setError(result.error ?? 'Connection failed')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-app">
      {/* Title bar */}
      <div className="drag-region h-11 flex items-center border-b border-theme bg-base px-3 gap-2 shrink-0">
        {/* macOS traffic lights */}
        {isMac && (
          <div className="no-drag flex gap-1.5 mr-2">
            <button onClick={() => window.electronAPI.close()}
              className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-500 transition-colors" />
            <button onClick={() => window.electronAPI.minimize()}
              className="w-3 h-3 rounded-full bg-amber-500/70 hover:bg-amber-500 transition-colors" />
            <button onClick={() => window.electronAPI.maximize()}
              className="w-3 h-3 rounded-full bg-emerald-500/70 hover:bg-emerald-500 transition-colors" />
          </div>
        )}

        {/* App icon + name */}
        <img src={appIcon} alt="StackView" style={{ width: 18, height: 18 }} draggable={false} className="shrink-0" />
        <span className="text-sm font-semibold text-1 tracking-tight">StackView</span>

        <div className="flex-1" />

        {/* Settings button */}
        <div ref={settingsRef} className="no-drag relative">
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className="btn-ghost !px-2 !py-2 rounded-lg"
            title="Settings"
          >
            <Settings size={15} />
          </button>

          {settingsOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-50 rounded-xl border border-theme shadow-xl overflow-hidden"
              style={{ backgroundColor: 'rgb(var(--bg-base))', width: 240 }}
            >
              {/* Theme */}
              <div className="px-3 pt-3 pb-2">
                <p className="text-[10px] font-semibold text-3 uppercase tracking-wider mb-2">Theme</p>
                <div className="grid grid-cols-3 gap-1">
                  {ALL_THEMES.map(themeKey => {
                    const def = THEME_DEFINITIONS[themeKey]
                    const isActive = theme === themeKey
                    return (
                      <button
                        key={themeKey}
                        title={def.label}
                        onClick={() => { onSetTheme(themeKey); setSettingsOpen(false) }}
                        className="rounded-md overflow-hidden transition-all hover:scale-[1.02]"
                        style={{
                          outline: isActive ? '2px solid #0ea5e9' : '1px solid transparent',
                          outlineOffset: 1,
                        }}
                      >
                        <div className="relative h-6 w-full" style={{ backgroundColor: def.preview.bg }}>
                          {isActive && (
                            <span className="absolute top-0.5 right-0.5">
                              <Check size={9} color="#ffffff" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div
                          className="h-6 w-full flex items-center px-1.5 gap-1"
                          style={{ backgroundColor: def.preview.surface }}
                        >
                          <span className="text-[8px] font-semibold flex-1 truncate leading-none" style={{ color: def.preview.text }}>
                            {def.label}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: def.preview.bg }} />
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: def.preview.text }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mx-3 border-t border-theme" />

              {/* Updates */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-3 uppercase tracking-wider">Updates</p>
                  {appVersion && (
                    <span className="font-mono text-[10px] text-3">v{appVersion}</span>
                  )}
                </div>

                {/* Auto-update toggle */}
                <button
                  onClick={onToggleAutoUpdate}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors hover:bg-raised mb-1"
                >
                  <span className="text-xs text-2">Auto-update</span>
                  <div
                    className="relative flex-shrink-0 transition-colors duration-200"
                    style={{
                      width: 28, height: 16, borderRadius: 8,
                      backgroundColor: autoUpdate ? '#0ea5e9' : 'rgb(var(--border))',
                    }}
                  >
                    <div
                      className="absolute top-0.5 transition-transform duration-200"
                      style={{
                        width: 12, height: 12, borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transform: autoUpdate ? 'translateX(14px)' : 'translateX(2px)',
                      }}
                    />
                  </div>
                </button>

                {/* Status */}
                {updaterStatus.status !== 'idle' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-1">
                    {updaterStatus.status === 'checking' && <RefreshCw size={11} className="text-3 animate-spin shrink-0" />}
                    {updaterStatus.status === 'available' && <ArrowUpCircle size={11} className="text-sky-500 shrink-0" />}
                    {updaterStatus.status === 'downloading' && <Download size={11} className="text-sky-500 shrink-0" />}
                    {updaterStatus.status === 'ready' && <CheckCircle size={11} className="text-emerald-500 shrink-0" />}
                    {updaterStatus.status === 'not-available' && <CheckCircle size={11} className="text-3 shrink-0" />}
                    {updaterStatus.status === 'error' && <AlertTriangle size={11} className="text-red-500/70 shrink-0" />}
                    <span className="text-[11px] text-3 truncate">
                      {updaterStatus.status === 'checking' && 'Checking for updates…'}
                      {updaterStatus.status === 'available' && `v${updaterStatus.version} available`}
                      {updaterStatus.status === 'downloading' && `Downloading… ${updaterStatus.percent ?? 0}%`}
                      {updaterStatus.status === 'ready' && `v${updaterStatus.version} ready`}
                      {updaterStatus.status === 'not-available' && 'Up to date'}
                      {updaterStatus.status === 'error' && (updaterStatus.message ?? 'Update error')}
                    </span>
                  </div>
                )}

                {/* Action button */}
                {updaterStatus.status === 'ready' ? (
                  <button
                    onClick={() => { onInstallUpdate(); setSettingsOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  >
                    <Download size={13} />
                    Install & Restart
                  </button>
                ) : (
                  <button
                    onClick={onCheckForUpdates}
                    disabled={updaterStatus.status === 'checking' || updaterStatus.status === 'downloading'}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-2 hover:bg-raised hover:text-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={13} className={updaterStatus.status === 'checking' ? 'animate-spin' : ''} />
                    Check for Updates
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Windows controls */}
        {isWindows && (
          <div className="no-drag flex items-stretch ml-1 -mr-3 h-full">
            <button
              onClick={() => window.electronAPI.minimize()}
              className="flex items-center justify-center w-11 h-full text-2 hover:bg-raised transition-colors"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => window.electronAPI.maximize()}
              className="flex items-center justify-center w-11 h-full text-2 hover:bg-raised transition-colors"
            >
              <Square size={12} />
            </button>
            <button
              onClick={() => window.electronAPI.close()}
              className="flex items-center justify-center w-12 h-full text-2 hover:bg-red-500 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/15 border border-brand-500/30 mb-4">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="25" width="32" height="9" rx="2.5" fill="rgba(14,165,233,0.12)" stroke="rgba(14,165,233,0.30)" strokeWidth="1.2"/>
                <rect x="3" y="15" width="32" height="9" rx="2.5" fill="rgba(14,165,233,0.22)" stroke="rgba(14,165,233,0.45)" strokeWidth="1.2"/>
                <rect x="3" y="5"  width="32" height="9" rx="2.5" fill="rgba(14,165,233,0.38)" stroke="rgba(14,165,233,0.75)" strokeWidth="1.2"/>
                <circle cx="10" cy="9.5" r="1.8" fill="rgba(14,165,233,1)"/>
                <circle cx="16" cy="9.5" r="1.8" fill="rgba(14,165,233,0.65)"/>
                <circle cx="22" cy="9.5" r="1.8" fill="rgba(14,165,233,0.40)"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-1 mb-1">StackView</h1>
            <p className="text-sm text-2">Connect to your LocalStack endpoint</p>
          </div>

          {/* Form card */}
          <div className="card p-6 space-y-5">
            {/* Endpoint */}
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5 uppercase tracking-wider">
                Endpoint URL
              </label>
              <div className="relative">
                <Wifi size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-3" />
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  placeholder="http://localhost:4566"
                  className="input-base pl-9"
                />
              </div>
              <p className="mt-1.5 text-xs text-4">
                Default endpoint is http://localhost:4566
              </p>
            </div>

            {/* Region */}
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5 uppercase tracking-wider">
                Region
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRegionOpen((o) => !o)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm
                    transition-colors border border-theme focus:outline-none focus:ring-2
                    focus:ring-brand-500/40 text-1"
                  style={{ backgroundColor: 'rgb(var(--bg-base))' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-3 shrink-0">{region}</span>
                    <span className="text-3">·</span>
                    <span className="truncate">{selectedRegionLabel}</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-3 shrink-0 ml-2 transition-transform ${regionOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {regionOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full rounded-xl shadow-xl overflow-hidden border border-theme"
                    style={{ backgroundColor: 'rgb(var(--bg-base))' }}
                  >
                    <div
                      className="px-3 py-2 border-b border-theme sticky top-0"
                      style={{ backgroundColor: 'rgb(var(--bg-base))' }}
                    >
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3" />
                        <input
                          ref={searchRef}
                          type="text"
                          value={regionSearch}
                          onChange={(e) => setRegionSearch(e.target.value)}
                          placeholder="Search regions..."
                          className="sidebar-search pl-8"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredRegions.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-3 text-center">No regions match</p>
                      ) : (
                        filteredRegions.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => {
                              setRegion(r.value)
                              setRegionOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2
                              ${region === r.value
                                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                                : 'text-2 hover:bg-raised'
                              }`}
                          >
                            <span className="font-mono text-xs text-3 w-28 shrink-0">{r.value}</span>
                            <span className="truncate">{r.label}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Connect button */}
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Connect
                </>
              )}
            </button>
          </div>

          {/* Tip */}
          <div
            className="mt-5 flex items-start gap-2 p-3 rounded-lg border border-theme"
            style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
          >
            <WifiOff size={13} className="text-4 shrink-0 mt-0.5" />
            <p className="text-xs text-3 leading-relaxed">
              Make sure LocalStack is running —{' '}
              <code className="text-brand-600 dark:text-brand-400 font-mono">localstack start</code>
              {' '}or Docker:{' '}
              <code className="text-brand-600 dark:text-brand-400 font-mono">docker run -p 4566:4566 localstack/localstack</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
