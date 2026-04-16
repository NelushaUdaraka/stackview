import { useState } from 'react'
import { LayoutTemplate, Plus, Search, Filter } from 'lucide-react'

const STATUS_OPTIONS = [
  'CREATE_COMPLETE', 'CREATE_IN_PROGRESS', 'CREATE_FAILED',
  'UPDATE_COMPLETE', 'UPDATE_IN_PROGRESS', 'UPDATE_FAILED',
  'DELETE_IN_PROGRESS', 'DELETE_FAILED', 'ROLLBACK_COMPLETE',
  'ROLLBACK_IN_PROGRESS', 'ROLLBACK_FAILED',
]

const STATUS_COLORS: Record<string, string> = {
  CREATE_COMPLETE: 'text-emerald-500 bg-emerald-500/10',
  UPDATE_COMPLETE: 'text-emerald-500 bg-emerald-500/10',
  ROLLBACK_COMPLETE: 'text-amber-500 bg-amber-500/10',
  CREATE_IN_PROGRESS: 'text-blue-500 bg-blue-500/10',
  UPDATE_IN_PROGRESS: 'text-blue-500 bg-blue-500/10',
  DELETE_IN_PROGRESS: 'text-red-400 bg-red-400/10',
  CREATE_FAILED: 'text-red-500 bg-red-500/10',
  UPDATE_FAILED: 'text-red-500 bg-red-500/10',
  DELETE_FAILED: 'text-red-500 bg-red-500/10',
  ROLLBACK_IN_PROGRESS: 'text-amber-500 bg-amber-500/10',
  ROLLBACK_FAILED: 'text-red-500 bg-red-500/10',
}

export function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? 'text-gray-500 bg-gray-500/10'
}

interface Props {
  stacks: any[]
  selectedStack: string | null
  onSelectStack: (name: string) => void
  onCreateStack: () => void
  onFilterChange: (filter: string[]) => void
  statusFilter: string[]
  loading: boolean
}

export default function CloudFormationSidebar({
  stacks, selectedStack, onSelectStack, onCreateStack, onFilterChange, statusFilter, loading
}: Props) {
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const filtered = stacks.filter(s =>
    s.StackName?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleStatus = (s: string) => {
    const next = statusFilter.includes(s) ? statusFilter.filter(x => x !== s) : [...statusFilter, s]
    onFilterChange(next)
  }

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      <div className="p-3 border-b border-theme">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">Stacks ({stacks.length})</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilter(f => !f)}
              className={`p-1.5 rounded-lg transition-colors ${showFilter ? 'text-orange-500 bg-orange-500/10' : 'btn-ghost'}`}
              title="Filter by status"
            >
              <Filter size={13} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stacks..."
            className="sidebar-search pl-7"
          />
        </div>

        {showFilter && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {STATUS_OPTIONS.map(s => (
              <label key={s} className="flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-raised rounded text-xs text-2">
                <input
                  type="checkbox"
                  checked={statusFilter.includes(s)}
                  onChange={() => toggleStatus(s)}
                  className="rounded border-theme bg-base text-orange-500 focus:ring-orange-500"
                />
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getStatusColor(s)}`}>{s}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-3">
            <LayoutTemplate size={24} className="text-4 mb-2 opacity-40" />
            <p className="text-xs text-3">No stacks found</p>
          </div>
        ) : (
          filtered.map(stack => (
            <button
              key={stack.StackId ?? stack.StackName}
              onClick={() => onSelectStack(stack.StackName)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
                selectedStack === stack.StackName
                  ? 'bg-orange-500/10 border border-orange-500/30'
                  : 'hover:bg-raised border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <LayoutTemplate size={13} className={selectedStack === stack.StackName ? 'text-orange-500 shrink-0' : 'text-3 shrink-0'} />
                <span className="text-xs font-medium text-1 truncate">{stack.StackName}</span>
              </div>
              <div className="mt-1 ml-5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getStatusColor(stack.StackStatus ?? '')}`}>
                  {stack.StackStatus ?? 'UNKNOWN'}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateStack}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          New Stack
        </button>
      </div>
    </div>
  )
}
