import { useEffect, useRef, useState, useMemo } from 'react'
import { RefreshCw, Search as SearchIcon, Globe, RotateCcw } from 'lucide-react'
import type { Service, IconMode, AppSettings } from '../../types'
import { SERVICE_CONFIG } from '../../services/serviceConfig'
import { AWS_REGIONS } from '../../constants'
import { AwsServiceIcon } from './AwsServiceIcons'
import { hexAlpha } from './ui'

interface Props {
  service: Service
  settings: AppSettings
  /** Region currently active for this service — may differ from `settings.region`. */
  effectiveRegion: string
  iconMode: IconMode
  onRefresh: () => void
  refreshing: boolean
  /** Change the region for this service only. */
  onChangeRegion: (region: string) => void
}

/**
 * A 32px identity strip above the split: which service you're in, which region
 * it's pointed at, and a refresh.
 *
 * The mock doesn't draw this — it has no per-service region override — but the
 * feature ships, and the region belongs next to the resource list it governs
 * rather than buried in global settings.
 */
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

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (popoverRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const regions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return AWS_REGIONS
    return AWS_REGIONS.filter(r => r.value.toLowerCase().includes(q) || r.label.toLowerCase().includes(q))
  }, [search])

  const isOverride = effectiveRegion !== settings.region

  return (
    <div className="shrink-0 h-8 flex items-center gap-2.5 px-3.5 relative surface-panel border-b border-theme">
      {iconMode === 'aws' ? (
        <AwsServiceIcon service={service} size={16} />
      ) : (
        <Icon size={14} className="shrink-0" style={{ color: meta.hex }} />
      )}

      <span className="text-[12.5px] font-bold text-1 truncate">{meta.name}</span>

      <span
        className="badge shrink-0"
        style={{ backgroundColor: hexAlpha(meta.hex, 0.14), color: meta.hex }}
      >
        {meta.label}
      </span>

      <div className="flex-1 min-w-0" />

      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="shrink-0 flex items-center gap-1.5 h-[22px] px-2 rounded-md transition-colors hover:bg-raised"
        style={{
          backgroundColor: isOverride ? 'rgb(var(--accent-soft))' : 'rgb(var(--bg-raised))',
          color: isOverride ? 'rgb(var(--accent))' : 'rgb(var(--text-3))',
        }}
        title={isOverride ? `Region override — global is ${settings.region}` : 'Active region'}
      >
        <Globe size={11} className="shrink-0" />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{effectiveRegion}</span>
      </button>

      <button onClick={onRefresh} disabled={refreshing} className="btn-icon shrink-0" title="Refresh">
        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
      </button>

      {open && (
        <div ref={popoverRef} className="popover absolute right-3 top-full mt-1 z-50 w-72 p-0 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-theme flex items-center justify-between">
            <span className="ui-label">{meta.label} REGION</span>
            {isOverride && (
              <button
                onClick={() => {
                  onChangeRegion(settings.region)
                  setOpen(false)
                }}
                className="flex items-center gap-1 text-[10px] text-3 hover:text-1 transition-colors"
                title={`Reset to the global region (${settings.region})`}
              >
                <RotateCcw size={10} />
                Reset
              </button>
            )}
          </div>

          <div className="px-3 pt-2.5 pb-2">
            <p className="text-[11px] text-3 leading-snug mb-2">
              Changes the region for {meta.label} only. Other services keep theirs.
            </p>
            <div className="relative">
              <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search regions..."
                className="sidebar-search pl-8"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto border-t border-theme">
            {regions.length === 0 ? (
              <div className="px-2.5 py-3.5 text-xs text-3 text-center">No regions match</div>
            ) : (
              regions.map(r => {
                const isActive = effectiveRegion === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => {
                      onChangeRegion(r.value)
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2.5 h-[29px] px-3 transition-colors hover:bg-raised"
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
  )
}
