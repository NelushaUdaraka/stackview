import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Crumb {
  label: string
  icon?: LucideIcon
  onClick?: () => void
}

interface Props {
  /** Path within the resource — bucket prefixes, log streams, API stages. */
  crumbs?: Crumb[]
  /** Right-aligned chips: bulk actions, operation switches, filters. */
  children?: ReactNode
}

/**
 * The strip between the subview tabs and the table. Location on the left,
 * operations on the right.
 */
export default function Toolbar({ crumbs = [], children }: Props) {
  return (
    <div
      className="shrink-0 flex items-center gap-2 px-5 border-b border-theme"
      style={{ paddingTop: 9, paddingBottom: 9, backgroundColor: 'rgb(var(--bg-raised) / 0.35)' }}
    >
      {crumbs.map((crumb, i) => {
        const Icon = crumb.icon
        const isLast = i === crumbs.length - 1
        return (
          <div key={`${crumb.label}-${i}`} className="flex items-center gap-2 min-w-0">
            {i > 0 && <ChevronRight size={11} className="text-4 shrink-0" />}
            <button
              onClick={crumb.onClick}
              disabled={!crumb.onClick}
              className="flex items-center gap-1.5 min-w-0 disabled:cursor-default"
            >
              {Icon && <Icon size={11} className="text-4 shrink-0" />}
              <span
                className="ui-mono text-[11.5px] truncate"
                style={{ color: isLast ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))' }}
              >
                {crumb.label}
              </span>
            </button>
          </div>
        )
      })}

      <div className="flex-1 min-w-0" />

      {children}
    </div>
  )
}
