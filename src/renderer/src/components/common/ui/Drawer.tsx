import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  /** Tab labels along the drawer's top edge. */
  tabs?: string[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  /** Monospace summary at the right of the header — size, count, timestamp. */
  meta?: string
  /** Expanded height in px. Collapsed, only the 30px header shows. */
  height?: number
  children: ReactNode
}

/**
 * The bottom drawer: the raw form of whatever row is selected above it. Starts
 * open, collapses to its header so the table can take the full height.
 */
export default function Drawer({ tabs = [], activeTab, onTabChange, meta, height = 190, children }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <div
      className="shrink-0 flex flex-col surface-panel border-t border-theme"
      style={{ height: open ? height : 30 }}
    >
      <div className="h-[30px] shrink-0 flex items-center gap-3.5 px-5 border-b border-theme">
        {tabs.map(tab => {
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
              onClick={() => onTabChange?.(tab)}
              className="text-[11.5px] transition-colors"
              style={{
                color: isActive ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {tab}
            </button>
          )
        })}
        <div className="flex-1" />
        {meta && <span className="ui-mono text-[10.5px]">{meta}</span>}
        <button
          onClick={() => setOpen(o => !o)}
          className="text-4 hover:text-1 transition-colors"
          title={open ? 'Collapse' : 'Expand'}
        >
          {open ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {open && <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2.5 pb-3">{children}</div>}
    </div>
  )
}

/**
 * A key/value line inside the drawer, numbered like a source listing so long
 * payloads stay scannable.
 */
export function DrawerLine({
  index,
  label,
  value,
  labelColor,
  valueColor,
}: {
  index?: number
  label: string
  value?: string
  labelColor?: string
  valueColor?: string
}) {
  return (
    <div
      className="flex gap-3 items-center h-[19px]"
      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11.5px' }}
    >
      {index != null && (
        <span className="w-4 shrink-0 text-right" style={{ color: 'rgb(var(--border))' }}>
          {index}
        </span>
      )}
      <span className="whitespace-pre shrink-0" style={{ color: labelColor ?? 'rgb(var(--text-3))' }}>
        {label}
      </span>
      {value != null && (
        <span className="min-w-0 truncate" style={{ color: valueColor ?? 'rgb(var(--text-1))' }} title={value}>
          {value}
        </span>
      )}
    </div>
  )
}
