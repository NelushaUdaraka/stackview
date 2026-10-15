import { useState, useRef, useEffect } from 'react'
import {
  Server,
  ChevronDown,
  Loader2,
  AlertCircle,
  ArrowRight,
  Minus,
  Square,
  X,
  Settings,
  Terminal,
} from 'lucide-react'
import type { AppSettings, Theme, UpdaterStatus } from '../../types'
import { AWS_REGIONS } from '../../constants'
import { RegionList, ThemePicker, UpdateControls } from './SettingsControls'
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
  const settingsRef = useRef<HTMLDivElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)

  // Saved settings load asynchronously after first render — pick them up when they arrive.
  useEffect(() => {
    setEndpoint(initialSettings.endpoint)
    setRegion(initialSettings.region)
  }, [initialSettings.endpoint, initialSettings.region])

  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSettingsOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

  useEffect(() => {
    if (!regionOpen) return
    const handler = (e: MouseEvent) => {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) {
        setRegionOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRegionOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [regionOpen])

  const selectedRegionLabel =
    AWS_REGIONS.find((r) => r.value === region)?.label ?? region

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
      <div className="drag-region h-11 flex items-center border-b border-theme bg-app px-3 gap-2.5 shrink-0">
        {/* macOS traffic lights */}
        {isMac && (
          <div className="no-drag flex gap-1.5 mr-2">
            <button onClick={() => window.electronAPI.close()} aria-label="Close"
              className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-500 transition-colors" />
            <button onClick={() => window.electronAPI.minimize()} aria-label="Minimize"
              className="w-3 h-3 rounded-full bg-amber-500/70 hover:bg-amber-500 transition-colors" />
            <button onClick={() => window.electronAPI.maximize()} aria-label="Maximize"
              className="w-3 h-3 rounded-full bg-emerald-500/70 hover:bg-emerald-500 transition-colors" />
          </div>
        )}

        {/* App icon + name */}
        <img src={appIcon} alt="" className="w-[18px] h-[18px] shrink-0" draggable={false} />
        <span className="text-[13px] font-semibold text-1 tracking-tight">StackView</span>

        <div className="flex-1" />

        {/* Settings button */}
        <div ref={settingsRef} className="no-drag relative">
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className={`icon-btn w-8 h-8 ${settingsOpen ? '!text-1 bg-raised' : ''}`}
            title="Settings"
            aria-label="Settings"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
          >
            <Settings size={15} />
          </button>

          {settingsOpen && (
            <div
              role="dialog"
              aria-label="Settings"
              className="popover absolute right-0 top-full mt-1.5 z-50 w-72 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="px-4 pt-3.5 pb-3">
                <ThemePicker theme={theme} onSelect={onSetTheme} />
              </div>
              <div className="border-t border-theme" />
              <div className="px-2 pt-3 pb-2">
                <div className="px-2">
                  <UpdateControls
                    appVersion={appVersion}
                    autoUpdate={autoUpdate}
                    onToggleAutoUpdate={onToggleAutoUpdate}
                    updaterStatus={updaterStatus}
                    onCheckForUpdates={onCheckForUpdates}
                    onInstallUpdate={() => { onInstallUpdate(); setSettingsOpen(false) }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Windows controls */}
        {isWindows && (
          <div className="no-drag flex items-stretch ml-1 -mr-3 h-full">
            <button
              onClick={() => window.electronAPI.minimize()}
              aria-label="Minimize"
              title="Minimize"
              className="flex items-center justify-center w-11 h-full text-3 hover:text-1 hover:bg-raised transition-colors"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => window.electronAPI.maximize()}
              aria-label="Maximize"
              title="Maximize"
              className="flex items-center justify-center w-11 h-full text-3 hover:text-1 hover:bg-raised transition-colors"
            >
              <Square size={12} />
            </button>
            <button
              onClick={() => window.electronAPI.close()}
              aria-label="Close"
              title="Close"
              className="flex items-center justify-center w-12 h-full text-3 hover:bg-red-600 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex items-center justify-center p-8 overflow-auto">
        {/* Backdrop: faint grid fading out from a soft accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--text-1) / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--text-1) / 0.035) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 60% 55% at 50% 40%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 40%, black 20%, transparent 75%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 w-[560px] h-[320px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--accent) / 0.14), transparent)' }}
        />

        <div className="relative w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 border border-brand-500/30 shadow-lg"
              style={{ background: 'linear-gradient(180deg, rgb(14 165 233 / 0.20), rgb(14 165 233 / 0.06))' }}
            >
              <svg width="34" height="34" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="3" y="25" width="32" height="9" rx="2.5" fill="rgba(14,165,233,0.12)" stroke="rgba(14,165,233,0.30)" strokeWidth="1.2"/>
                <rect x="3" y="15" width="32" height="9" rx="2.5" fill="rgba(14,165,233,0.22)" stroke="rgba(14,165,233,0.45)" strokeWidth="1.2"/>
                <rect x="3" y="5"  width="32" height="9" rx="2.5" fill="rgba(14,165,233,0.38)" stroke="rgba(14,165,233,0.75)" strokeWidth="1.2"/>
                <circle cx="10" cy="9.5" r="1.8" fill="rgba(14,165,233,1)"/>
                <circle cx="16" cy="9.5" r="1.8" fill="rgba(14,165,233,0.65)"/>
                <circle cx="22" cy="9.5" r="1.8" fill="rgba(14,165,233,0.40)"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-1 mb-1.5">Welcome to StackView</h1>
            <p className="text-sm text-3 text-balance">Connect to LocalStack to browse and manage your AWS services.</p>
          </div>

          {/* Form card */}
          <form
            className="card p-6 space-y-5 shadow-xl"
            onSubmit={(e) => { e.preventDefault(); if (!loading) handleConnect() }}
          >
            {/* Endpoint */}
            <div>
              <label htmlFor="endpoint" className="block text-xs font-medium text-2 mb-1.5">
                Endpoint URL
              </label>
              <div className="relative">
                <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
                <input
                  id="endpoint"
                  type="text"
                  value={endpoint}
                  onChange={(e) => { setEndpoint(e.target.value); setError(null) }}
                  placeholder="http://localhost:4566"
                  className="input-base pl-9 font-mono text-[13px]"
                  spellCheck={false}
                  autoComplete="url"
                  aria-describedby="endpoint-help"
                  aria-invalid={!!error}
                />
              </div>
              <p id="endpoint-help" className="mt-1.5 text-xs text-3">
                LocalStack listens on <span className="font-mono">http://localhost:4566</span> by default.
              </p>
            </div>

            {/* Region */}
            <div>
              <label id="region-label" className="block text-xs font-medium text-2 mb-1.5">
                Default region
              </label>
              <div ref={regionRef} className="relative">
                <button
                  type="button"
                  onClick={() => setRegionOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={regionOpen}
                  aria-labelledby="region-label"
                  className="input-base flex items-center justify-between gap-2 text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{selectedRegionLabel}</span>
                    <span className="font-mono text-[11px] text-3 shrink-0">{region}</span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-3 shrink-0 transition-transform ${regionOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {regionOpen && (
                  <div className="popover absolute z-50 mt-1.5 w-full p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <RegionList
                      value={region}
                      autoFocus
                      onSelect={(r) => { setRegion(r); setRegionOpen(false) }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Couldn’t connect</p>
                  <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5 break-words">{error}</p>
                </div>
              </div>
            )}

            {/* Connect button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center h-10"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  Connect
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Tip */}
          <div className="mt-4 p-3.5 rounded-xl border border-theme bg-[rgb(var(--bg-base)/0.6)]">
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={13} className="text-3" />
              <p className="text-xs font-medium text-2">Not running yet? Start LocalStack with</p>
            </div>
            <div className="space-y-1.5">
              <code className="block font-mono text-[11px] text-1 px-2.5 py-1.5 rounded-md bg-raised border border-theme select-all">
                localstack start
              </code>
              <code className="block font-mono text-[11px] text-1 px-2.5 py-1.5 rounded-md bg-raised border border-theme select-all">
                docker run -p 4566:4566 localstack/localstack
              </code>
            </div>
          </div>

          {appVersion && (
            <p className="mt-6 text-center text-[11px] text-4 font-mono">v{appVersion}</p>
          )}
        </div>
      </div>
    </div>
  )
}
