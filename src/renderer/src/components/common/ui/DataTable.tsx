import { useMemo, useState, type ReactNode } from 'react'
import { Check, Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import EmptyState from './EmptyState'

export interface Column<R> {
  key: string
  label: string
  /** Fixed width, e.g. `'220px'`. Omit to let the column take the slack. */
  width?: string
  align?: 'left' | 'right'
  /** Render values in JetBrains Mono — ids, sizes, timestamps, ARNs. */
  mono?: boolean
  fontSize?: string
  weight?: number
  /** Plain cell text. Also what sorting compares. */
  value?: (row: R) => string
  /** Full control over the cell — wins over `value`. */
  render?: (row: R) => ReactNode
  color?: (row: R) => string
  icon?: (row: R) => { icon: LucideIcon; color?: string } | null
  sortable?: boolean
}

interface Props<R> {
  columns: Column<R>[]
  rows: R[]
  rowId: (row: R) => string
  onSelect?: (row: R) => void
  selectedId?: string | null
  /** Adds the leading checkbox column and the select-all box in the header. */
  checkedIds?: string[]
  onToggleCheck?: (id: string) => void
  onToggleAll?: (ids: string[]) => void
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyHint?: string
  /** Rendered above the header — breadcrumbs, bulk actions. */
  toolbar?: ReactNode
}

/**
 * The design's table: a 28px header of letterspaced keys over 34px rows, with
 * the selected row marked by an inset accent bar rather than a heavy fill.
 *
 * Sorting is internal — a column opts in with `sortable` and is compared by its
 * `value`, so callers never wire up sort state.
 */
export default function DataTable<R>({
  columns,
  rows,
  rowId,
  onSelect,
  selectedId,
  checkedIds,
  onToggleCheck,
  onToggleAll,
  emptyIcon = Inbox,
  emptyTitle = 'Nothing here yet',
  emptyHint,
  toolbar,
}: Props<R>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)

  const selectable = checkedIds != null && onToggleCheck != null

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find(c => c.key === sort.key)
    if (!col?.value) return rows
    // Copy first — sorting the caller's array in place would mutate their state.
    return [...rows].sort((a, b) => col.value!(a).localeCompare(col.value!(b), undefined, { numeric: true }) * sort.dir)
  }, [rows, sort, columns])

  const allIds = rows.map(rowId)
  const allChecked = selectable && allIds.length > 0 && allIds.every(id => checkedIds!.includes(id))

  const cellStyle = (col: Column<R>) => ({
    width: col.width,
    flex: col.width ? '0 0 auto' : '1 1 0',
    justifyContent: col.align === 'right' ? ('flex-end' as const) : ('flex-start' as const),
  })

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {toolbar}

      <div className="data-head px-5">
        {selectable && (
          <span className="w-6 shrink-0 flex items-center">
            <button
              onClick={() => onToggleAll?.(allChecked ? [] : allIds)}
              className="w-[11px] h-[11px] rounded-[3px] flex items-center justify-center transition-colors"
              style={{
                border: `1px solid ${allChecked ? 'rgb(var(--accent))' : 'rgb(var(--hair))'}`,
                backgroundColor: allChecked ? 'rgb(var(--accent))' : 'transparent',
              }}
              title={allChecked ? 'Clear selection' : 'Select all'}
            >
              {allChecked && <Check size={8} style={{ color: 'rgb(var(--accent-contrast))' }} />}
            </button>
          </span>
        )}
        {columns.map(col => {
          const isSorted = sort?.key === col.key
          return (
            <span
              key={col.key}
              onClick={() => {
                if (!col.sortable) return
                setSort(s =>
                  s?.key === col.key ? { key: col.key, dir: s.dir === 1 ? -1 : 1 } : { key: col.key, dir: 1 }
                )
              }}
              className="data-head-cell"
              style={{
                ...cellStyle(col),
                textAlign: col.align === 'right' ? 'right' : 'left',
                cursor: col.sortable ? 'pointer' : 'default',
                color: isSorted ? 'rgb(var(--accent))' : undefined,
              }}
            >
              {col.label}
              {isSorted && (sort!.dir === 1 ? ' ↑' : ' ↓')}
            </span>
          )
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {sorted.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} hint={emptyHint} />
        ) : (
          sorted.map(row => {
            const id = rowId(row)
            const isSelected = id === selectedId
            const isChecked = selectable && checkedIds!.includes(id)
            return (
              <div
                key={id}
                // Exposed so ancestors can resolve a context-menu or drop target
                // back to a row without the table owning either concern.
                data-row-id={id}
                onClick={onSelect ? () => onSelect(row) : undefined}
                className={`data-row px-5 ${isSelected ? 'data-row-selected' : ''}`}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
              >
                {selectable && (
                  <span className="w-6 shrink-0 flex items-center">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onToggleCheck!(id)
                      }}
                      className="w-[11px] h-[11px] rounded-[3px] flex items-center justify-center transition-colors"
                      style={{
                        border: `1px solid ${isChecked ? 'rgb(var(--accent))' : 'rgb(var(--hair))'}`,
                        backgroundColor: isChecked ? 'rgb(var(--accent))' : 'transparent',
                      }}
                    >
                      {isChecked && <Check size={8} style={{ color: 'rgb(var(--accent-contrast))' }} />}
                    </button>
                  </span>
                )}
                {columns.map(col => {
                  const iconSpec = col.icon?.(row)
                  const CellIcon = iconSpec?.icon
                  return (
                    <span key={col.key} className="data-cell" style={cellStyle(col)}>
                      {CellIcon && (
                        <CellIcon
                          size={13}
                          className="shrink-0"
                          style={{ color: iconSpec?.color ?? 'rgb(var(--text-4))' }}
                        />
                      )}
                      {col.render ? (
                        col.render(row)
                      ) : (
                        <span
                          title={col.value?.(row)}
                          style={{
                            fontFamily: col.mono ? "'JetBrains Mono', monospace" : undefined,
                            fontSize: col.fontSize ?? (col.mono ? '11.5px' : '12px'),
                            fontWeight: col.weight ?? 400,
                            color: col.color?.(row) ?? 'rgb(var(--text-2))',
                          }}
                        >
                          {col.value?.(row)}
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
