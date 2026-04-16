import { useState } from 'react'
import { Search, Plus, Database, Loader2 } from 'lucide-react'

interface Props {
  tables: string[]
  selectedTable: string | null
  onSelectTable: (table: string) => void
  onCreateTable: () => void
  loading: boolean
}

export default function DynamoDbSidebar({
  tables,
  selectedTable,
  onSelectTable,
  onCreateTable,
  loading
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = tables.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      <div
        className="px-3 pt-3 pb-2 border-b border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Tables {!loading && tables.length > 0 && `(${tables.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tables..."
            className="sidebar-search pl-7 focus:ring-violet-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : tables.length === 0 ? (
              <>
                <Database size={22} className="text-4 mb-2" />
                <p className="text-xs text-3">No tables yet</p>
                <p className="text-[10px] text-4 mt-1">Create one below</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((table) => {
            const isSelected = selectedTable === table
            return (
              <button
                key={table}
                onClick={() => onSelectTable(table)}
                title={table}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-left
                  border-b border-theme transition-colors
                  border-l-2 group
                  ${isSelected
                    ? 'bg-violet-500/10 border-l-violet-500'
                    : 'hover:bg-raised border-l-transparent'
                  }`}
              >
                <Database
                  size={14}
                  className={`shrink-0 ${isSelected ? 'text-violet-500' : 'text-4 group-hover:text-3'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold break-all leading-snug ${isSelected ? 'text-1' : 'text-2 group-hover:text-1'}`}>
                    {table}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateTable}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          New Table
        </button>
      </div>
    </div>
  )
}
