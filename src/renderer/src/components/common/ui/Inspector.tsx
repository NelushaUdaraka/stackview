import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface InspectorRow {
  key: string
  value: string
  color?: string
}

interface Props {
  /** Monospace kind shown at the right of the header — "queue", "bucket". */
  kind?: string
  icon?: LucideIcon
  iconColor?: string
  title: string
  subtitle?: string
  /** The headline key/value block. */
  sectionTitle?: string
  rows?: InspectorRow[]
  /** Extra sections — actions, presigned URLs, charts. */
  children?: ReactNode
}

/**
 * The right-hand pane: what the selected thing *is*, condensed into a fixed
 * column beside the working surface. Read-only by default; services add their
 * own actions through `children`.
 */
export default function Inspector({
  kind,
  icon: Icon,
  iconColor,
  title,
  subtitle,
  sectionTitle = 'CONFIGURATION',
  rows = [],
  children,
}: Props) {
  return (
    <div
      className="shrink-0 h-full flex flex-col min-h-0 surface-panel border-l border-theme"
      style={{ width: 'var(--inspector-w)' }}
    >
      <div className="h-8 shrink-0 flex items-center justify-between px-3.5 border-b border-theme">
        <span className="ui-label-dim">INSPECTOR</span>
        {kind && <span className="ui-mono text-[10px] text-3">{kind}</span>}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3.5">
        <div className="flex items-center gap-2.5 mb-4">
          {Icon && (
            <div className="w-[30px] h-[30px] rounded-lg bg-raised flex items-center justify-center shrink-0">
              <Icon size={15} style={{ color: iconColor ?? 'rgb(var(--accent))' }} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold text-1 truncate" title={title}>
              {title}
            </div>
            {subtitle && (
              <div className="text-[11.5px] text-3 truncate" title={subtitle}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {rows.length > 0 && (
          <>
            <div className="ui-label-dim mb-2">{sectionTitle}</div>
            {rows.map(row => (
              <div key={row.key} className="flex items-center justify-between gap-2.5 h-[26px] text-xs">
                <span className="text-3 shrink-0">{row.key}</span>
                <span
                  className="truncate min-w-0 text-right"
                  title={row.value}
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: row.color ?? 'rgb(var(--text-1))' }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </>
        )}

        {children}
      </div>
    </div>
  )
}

/** A titled block below the configuration list, separated by a hairline. */
export function InspectorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <div className="h-px my-3.5" style={{ backgroundColor: 'rgb(var(--border))' }} />
      <div className="ui-label-dim mb-2.5">{title}</div>
      {children}
    </>
  )
}

/**
 * The 20-bar activity strip. The trailing bars carry the accent so the eye
 * lands on "now" rather than reading the whole strip evenly.
 */
export function Sparkline({
  values,
  leftLabel = '-60s',
  rightLabel = 'now',
}: {
  values: number[]
  leftLabel?: string
  rightLabel?: string
}) {
  const max = Math.max(1, ...values)
  const liveFrom = Math.max(0, values.length - 4)
  return (
    <>
      <div className="flex items-end gap-[3px] h-11 mb-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className="flex-1 rounded-[1px]"
            style={{
              height: `${Math.max(5, (v / max) * 40)}px`,
              backgroundColor: i >= liveFrom ? 'rgb(var(--accent))' : 'rgb(var(--border))',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between ui-mono text-[10.5px] mb-4">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </>
  )
}

/** A labelled proportion bar — "busiest queues", "largest buckets". */
export function MeterRow({
  label,
  value,
  fraction,
  onClick,
}: {
  label: string
  value: string
  /** 0–1. Clamped, so a stale max can't overflow the track. */
  fraction: number
  onClick?: () => void
}) {
  return (
    <div className={`mb-2.5 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="flex justify-between gap-2.5 text-[11.5px] mb-1">
        <span className="min-w-0 truncate text-2" title={label}>
          {label}
        </span>
        <span className="ui-mono text-3 shrink-0">{value}</span>
      </div>
      <div className="h-1 rounded-sm overflow-hidden bg-raised">
        <div
          className="h-1"
          style={{
            width: `${Math.min(100, Math.max(0, fraction * 100))}%`,
            backgroundColor: 'rgb(var(--accent))',
          }}
        />
      </div>
    </div>
  )
}
