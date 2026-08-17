import { useMemo, useState, type ReactNode } from 'react'
import { Plus, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { STATE_COLOR, type ResourceState } from './tokens'

export interface RailItem {
  /** Stable identity — also what `selectedId` is matched against. */
  id: string
  name: string
  /** Row icon. Falls back to the rail's `icon`. */
  icon?: LucideIcon
  /** Signal state — tints the row icon and the uppercase sub-label. */
  state?: ResourceState
  /** Short uppercase qualifier under the name: a status, type or count. */
  sub?: string
  /** Monospace detail alongside `sub`: an ARN fragment, size or timestamp. */
  meta?: string
  /** Extra text matched by the search box beyond `name`. */
  keywords?: string
}

interface Props {
  /** Uppercase heading — the plural resource noun ("QUEUES", "BUCKETS"). */
  title: string
  items: RailItem[]
  selectedId?: string | null
  onSelect: (item: RailItem) => void
  /** Default icon for rows that don't carry their own. */
  icon?: LucideIcon
  searchPlaceholder?: string
  /** Renders the footer create button when supplied. */
  onCreate?: () => void
  createLabel?: string
  /** Small action rendered in the header, right of the title. Defaults to a
   *  create affordance when `onCreate` is set. */
  headerAction?: ReactNode
  loading?: boolean
  emptyLabel?: string
  /** Extra rows pinned above the list — filters, group switchers. */
  children?: ReactNode
}

/**
 * The design's left rail: a titled, searchable resource list where the selected
 * row carries a 2px accent bar and a 10% accent wash.
 *
 * Search is local state — the rail owns filtering so no service layout has to
 * reimplement it.
 */
export default function ResourceRail({
  title,
  items,
  selectedId,
  onSelect,
  icon: DefaultIcon,
  searchPlaceholder,
  onCreate,
  createLabel = 'Create',
  headerAction,
  loading = false,
  emptyLabel = 'No matches',
  children,
}: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.sub?.toLowerCase().includes(q) ||
        i.meta?.toLowerCase().includes(q) ||
        i.keywords?.toLowerCase().includes(q)
    )
  }, [items, query])

  return (
    <div className="h-full w-full flex flex-col min-h-0 surface-panel border-r border-theme">
      <div className="shrink-0 px-3 pt-3 pb-2.5 border-b border-theme surface-wash">
        <div className="flex items-center justify-between mb-2">
          <span className="ui-label text-3">{title}</span>
          {headerAction ??
            (onCreate && (
              <button onClick={onCreate} className="text-3 hover:text-1 transition-colors" title={createLabel}>
                <Plus size={13} />
              </button>
            ))}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}...`}
            className="sidebar-search pl-8"
          />
        </div>
      </div>

      {children}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-10 text-center">
            <div
              className="inline-block w-5 h-5 rounded-full animate-spin mb-2.5"
              style={{
                border: '2px solid rgb(var(--border))',
                borderTopColor: 'rgb(var(--accent))',
              }}
            />
            <p className="text-xs text-3">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3.5 py-9 text-center">
            <Search size={18} className="mx-auto text-4" />
            <div className="text-xs text-3 mt-2">{query ? 'No matches' : emptyLabel}</div>
          </div>
        ) : (
          filtered.map(item => {
            const isSelected = item.id === selectedId
            const Icon = item.icon ?? DefaultIcon
            const stateColor = item.state ? STATE_COLOR[item.state] : undefined
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                title={item.name}
                className={`rail-row ${isSelected ? 'rail-row-selected' : ''}`}
              >
                {Icon && (
                  <Icon
                    size={13}
                    className="shrink-0 mt-0.5"
                    style={{
                      color: isSelected
                        ? 'rgb(var(--accent))'
                        : stateColor ?? 'rgb(var(--text-4))',
                    }}
                  />
                )}
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-xs truncate leading-snug"
                    style={{
                      color: isSelected ? 'rgb(var(--text-1))' : 'rgb(var(--text-2))',
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {item.name}
                  </span>
                  {(item.sub || item.meta) && (
                    <span className="flex items-center gap-1.5 mt-0.5">
                      {item.sub && (
                        <span
                          className="ui-key"
                          style={{ color: stateColor ?? 'rgb(var(--text-4))' }}
                        >
                          {item.sub}
                        </span>
                      )}
                      {item.meta && <span className="ui-mono text-[9.5px]">{item.meta}</span>}
                    </span>
                  )}
                </span>
              </button>
            )
          })
        )}
      </div>

      {onCreate && (
        <div className="shrink-0 p-2 border-t border-theme surface-wash">
          <button onClick={onCreate} className="btn-secondary w-full">
            <Plus size={13} />
            {createLabel}
          </button>
        </div>
      )}
    </div>
  )
}
