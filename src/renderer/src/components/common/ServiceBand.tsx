import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Settings, Globe, ChevronDown, RotateCcw } from 'lucide-react'
import type { Service, IconMode, AppSettings } from '../../types'
import { SERVICE_CONFIG } from '../../services/serviceConfig'
import { AwsServiceIcon } from './AwsServiceIcons'
import { RegionList } from './SettingsControls'

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

interface Props {
  service: Service
  settings: AppSettings
  /** Region currently active for this service (may differ from settings.region) */
  effectiveRegion: string
  iconMode: IconMode
  onRefresh: () => void
  refreshing: boolean
  /** Change the region for this service only */
  onChangeRegion: (region: string) => void
}

export default function ServiceBand({
  service,
  settings,
  effectiveRegion,
  iconMode,
  onRefresh,
  refreshing,
  onChangeRegion,
}: Props) {
  const meta = SERVICE_CONFIG[service]
  const Icon = meta.icon

  const [settingsOpen, setSettingsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const cogBtnRef = useRef<HTMLButtonElement>(null)
  const regionBtnRef = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!settingsOpen) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (popoverRef.current?.contains(t)) return
      if (cogBtnRef.current?.contains(t)) return
      if (regionBtnRef.current?.contains(t)) return
      setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [settingsOpen])

  // Close on Escape
  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [settingsOpen])

  const isOverride = effectiveRegion !== settings.region

  return (
    <div className="shrink-0 h-12 flex items-center gap-3 px-4 relative bg-app border-b border-theme">
      {/* Icon tile */}
      <div className="shrink-0">
        {iconMode === 'aws' ? (
          <AwsServiceIcon service={service} size={28} />
        ) : (
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              backgroundColor: hexToRgba(meta.hex, 0.14),
              color: meta.hex,
              boxShadow: `inset 0 0 0 1px ${hexToRgba(meta.hex, 0.28)}`,
            }}
          >
            <Icon size={15} />
          </div>
        )}
      </div>

      {/* Name + label + region */}
      <div className="flex items-center gap-2.5 min-w-0">
        <h1 className="text-sm font-semibold text-1 truncate">{meta.name}</h1>

        <span
          className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
          style={{ color: meta.hex, backgroundColor: hexToRgba(meta.hex, 0.12) }}
        >
          {meta.label}
        </span>

        <span className="shrink-0 w-px h-4 bg-[rgb(var(--border))]" aria-hidden />

        <button
          ref={regionBtnRef}
          onClick={() => setSettingsOpen(o => !o)}
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          className="shrink-0 flex items-center gap-1.5 h-6 pl-2 pr-1.5 rounded-md text-xs text-2 hover:text-1 hover:bg-raised transition-colors"
          title={isOverride
            ? `Region override for ${meta.label} (global is ${settings.region})`
            : `Region for ${meta.label}`}
        >
          <Globe size={12} className="text-3" />
          <span className="font-mono text-[11px]">{effectiveRegion}</span>
          {isOverride && (
            <span
              className="text-[10px] font-medium px-1 rounded"
              style={{ color: meta.hex, backgroundColor: hexToRgba(meta.hex, 0.12) }}
            >
              override
            </span>
          )}
          <ChevronDown size={12} className={`text-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="flex-1" />

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="shrink-0 flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-2 hover:text-1 hover:bg-raised transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        title="Refresh"
      >
        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
      </button>

      {/* Settings cog */}
      <button
        ref={cogBtnRef}
        onClick={() => setSettingsOpen(o => !o)}
        className={`icon-btn ${settingsOpen ? '!text-1 bg-raised' : ''}`}
        title="Service settings"
        aria-label={`${meta.label} settings`}
        aria-haspopup="dialog"
        aria-expanded={settingsOpen}
      >
        <Settings size={14} />
      </button>

      {/* Settings popover */}
      {settingsOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`${meta.label} settings`}
          className="popover absolute right-3 top-full mt-1.5 z-50 w-80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-4 py-3 border-b border-theme flex items-center gap-2.5">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
              style={{ backgroundColor: hexToRgba(meta.hex, 0.14), color: meta.hex }}
            >
              <Icon size={13} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-1">{meta.label} settings</p>
              <p className="text-[11px] text-3 leading-snug">Region applies to {meta.label} only</p>
            </div>
          </div>

          <div className="px-3 pt-3 pb-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="section-label">Region</p>
              {isOverride && (
                <button
                  onClick={() => {
                    onChangeRegion(settings.region)
                    setSettingsOpen(false)
                  }}
                  className="flex items-center gap-1 text-[11px] text-3 hover:text-1 transition-colors"
                  title={`Reset to global region (${settings.region})`}
                >
                  <RotateCcw size={11} />
                  Reset to {settings.region}
                </button>
              )}
            </div>
            <RegionList
              value={effectiveRegion}
              accentHex={meta.hex}
              autoFocus
              onSelect={region => {
                onChangeRegion(region)
                setSettingsOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
