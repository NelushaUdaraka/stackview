import { useState } from 'react'
import { Search, Plus, FileText, Loader2 } from 'lucide-react'
import type { CloudWatchLogGroup } from '../../types'

interface Props {
  logGroups: CloudWatchLogGroup[]
  selectedLogGroup: CloudWatchLogGroup | null
  onSelectLogGroup: (group: CloudWatchLogGroup) => void
  onCreateLogGroup: () => void
  loading?: boolean
}

export default function CloudWatchSidebar({
  logGroups,
  selectedLogGroup,
  onSelectLogGroup,
  onCreateLogGroup,
  loading
}: Props) {
  const [search, setSearch] = useState('')

  const filteredLogGroups = logGroups.filter(g =>
    g.logGroupName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full bg-base">
      {/* Resource List Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme bg-raised/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Log Groups
          </span>
          <button
            onClick={onCreateLogGroup}
            className="p-1 rounded-lg hover:bg-raised text-4 hover:text-cyan-500 transition-all"
            title="Create Log Group"
          >
            <Plus size={14} />
          </button>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredLogGroups.length === 0 ? (
          <div className="p-10 text-center opacity-50">
            <FileText size={24} className="mx-auto mb-2 text-4" />
            <p className="text-xs">No groups found</p>
          </div>
        ) : (
          filteredLogGroups.map(group => (
            <button
              key={group.logGroupName}
              onClick={() => onSelectLogGroup(group)}
              className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                ${selectedLogGroup?.logGroupName === group.logGroupName ? 'bg-cyan-500/10 border-l-cyan-500' : 'hover:bg-raised border-l-transparent'}`}
            >
              <FileText size={13} className={`mt-0.5 shrink-0 ${selectedLogGroup?.logGroupName === group.logGroupName ? 'text-cyan-500' : 'text-4'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium break-all leading-snug ${selectedLogGroup?.logGroupName === group.logGroupName ? 'text-1' : 'text-2'}`}>
                  {group.logGroupName}
                </p>
                <p className="text-[9px] text-4 font-mono truncate mt-0.5 opacity-60">
                  {group.arn?.split(':').pop()}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-theme shrink-0 bg-base">
        <button
          onClick={onCreateLogGroup}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold
            bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all shadow-lg shadow-cyan-900/20 active:scale-[0.98]"
        >
          <Plus size={14} />
          Create Log Group
        </button>
      </div>
    </div>
  )
}
