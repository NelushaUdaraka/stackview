import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Settings, Search as SearchIcon } from 'lucide-react'
import type { Service, IconMode, AppSettings } from '../../types'
import { SERVICE_CONFIG } from '../../services/serviceConfig'
import { AWS_REGIONS } from '../../constants'
import { AwsServiceIcon } from './AwsServiceIcons'

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
  const [regionSearch, setRegionSearch] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const cogBtnRef = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!settingsOpen) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (popoverRef.current?.contains(t)) return
      if (cogBtnRef.current?.contains(t)) return
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

  const filteredRegions = AWS_REGIONS.filter(r =>
    r.value.toLowerCase().includes(regionSearch.toLowerCase()) ||
    r.label.toLowerCase().includes(regionSearch.toLowerCase())
  )

  const isOverride = effectiveRegion !== settings.region

  return (
    <div
      className="shrink-0 flex items-center gap-3 px-4 relative"
      style={{
        height: 48,
        backgroundColor: 'rgb(var(--bg-app))',
        borderBottom: '1px solid rgb(var(--border))',
      }}
    >
      {/* Icon tile */}
      <div className="shrink-0">
        {iconMode === 'aws' ? (
          <AwsServiceIcon service={service} size={28} />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              backgroundColor: hexToRgba(meta.hex, 0.15),
              color: meta.hex,
              border: `1px solid ${hexToRgba(meta.hex, 0.25)}`,
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* Name + label + region */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-1 truncate">{meta.name}</span>

        <span
          className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{
            color: meta.hex,
            backgroundColor: hexToRgba(meta.hex, 0.12),
          }}
        >
          {meta.label}
        </span>

        <span className="shrink-0 text-3 select-none" aria-hidden>|</span>

        <span
          className="shrink-0 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
          style={{
            color: meta.hex,
            backgroundColor: hexToRgba(meta.hex, 0.1),
            border: `1px solid ${hexToRgba(meta.hex, 0.25)}`,
          }}
          title={isOverride
            ? `Service region override (global is ${settings.region})`
            : 'Active region'}
        >
          {isOverride && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: meta.hex }}
              title="Override active"
            />
          )}
          {effectiveRegion}
        </span>
      </div>

      <div className="flex-1" />

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="shrink-0 flex items-center gap-1.5 text-xs text-3 hover:text-1 transition-colors disabled:opacity-60"
        title="Refresh"
      >
        <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
        <span>Refresh</span>
      </button>

      {/* Settings cog */}
      <button
        ref={cogBtnRef}
        onClick={() => setSettingsOpen(o => !o)}
        className={`shrink-0 flex items-center justify-center w-6 h-6 rounded transition-colors ${
          settingsOpen ? 'text-1 bg-raised' : 'text-3 hover:text-1 hover:bg-raised'
        }`}
        title="Service settings"
      >
        <Settings size={13} />
      </button>

      {/* Settings popover */}
      {settingsOpen && (
        <div
          ref={popoverRef}
          className="absolute right-3 top-full mt-1 z-50 w-72 rounded-xl shadow-2xl border border-theme overflow-hidden"
          style={{ backgroundColor: 'rgb(var(--bg-base))' }}
        >
          <div className="px-3 py-2.5 border-b border-theme">
            <p className="text-[10px] font-semibold text-3 uppercase tracking-wider">
              {meta.label} Settings
            </p>
          </div>

          <div className="px-3 pt-3 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-3 uppercase tracking-wider">Region</p>
              {isOverride && (
                <button
                  onClick={() => {
                    onChangeRegion(settings.region)
                    setSettingsOpen(false)
                  }}
                  className="text-[10px] text-3 hover:text-1 underline-offset-2 hover:underline"
                  title={`Reset to global region (${settings.region})`}
                >
                  Reset to global
                </button>
              )}
            </div>
            <p className="text-[10px] text-3 mb-1.5 leading-snug">
              Changes the region for {meta.label} only. Other services keep their current region.
            </p>
            <div className="relative mb-1.5">
              <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3" />
              <input
                type="text"
                value={regionSearch}
                onChange={e => setRegionSearch(e.target.value)}
                placeholder="Search regions..."
                className="sidebar-search pl-7 text-xs w-full"
                autoFocus
              />
            </div>
            <div
              className="max-h-48 overflow-y-auto rounded-lg border border-theme"
              style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
            >
              {filteredRegions.length === 0 ? (
                <div className="px-2.5 py-3 text-xs text-3 text-center">No regions match</div>
              ) : (
                filteredRegions.map(r => {
                  const isActive = effectiveRegion === r.value
                  return (
                    <button
                      key={r.value}
                      onClick={() => {
                        onChangeRegion(r.value)
                        setSettingsOpen(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors flex items-center justify-between gap-2 ${
                        isActive
                          ? 'font-semibold'
                          : 'text-2 hover:bg-overlay'
                      }`}
                      style={isActive ? {
                        backgroundColor: hexToRgba(meta.hex, 0.12),
                        color: meta.hex,
                      } : undefined}
                    >
                      <span className="truncate">{r.label}</span>
                      <span className="font-mono text-[10px] text-3 shrink-0">{r.value}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
