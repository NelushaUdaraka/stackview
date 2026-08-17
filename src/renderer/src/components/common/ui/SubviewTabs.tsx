import type { LucideIcon } from 'lucide-react'

export interface Subview<T extends string = string> {
  id: T
  label: string
  icon?: LucideIcon
  /** Small count shown after the label — messages, rules, versions. */
  count?: number
}

interface Props<T extends string> {
  views: readonly Subview<T>[]
  active: T
  onChange: (id: T) => void
}

/**
 * The underline tab strip under a detail header. Sits on the header's bottom
 * rule — the active tab's 2px accent underline replaces that rule locally.
 */
export default function SubviewTabs<T extends string>({ views, active, onChange }: Props<T>) {
  return (
    <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
      {views.map(v => {
        const Icon = v.icon
        const isActive = v.id === active
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={`subview-tab ${isActive ? 'subview-tab-active' : ''}`}
          >
            {Icon && <Icon size={12} className="shrink-0" />}
            {v.label}
            {v.count != null && (
              <span className="ui-mono text-[10px]" style={{ color: 'inherit', opacity: 0.7 }}>
                {v.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
