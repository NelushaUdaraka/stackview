import { useState } from 'react'
import { Search, Plus, Boxes, Tag, Loader2 } from 'lucide-react'
import type { RgGroup } from '../../types'

type SidebarMode = 'groups' | 'tagexplorer'

interface Props {
  groups: RgGroup[]
  selectedGroup: RgGroup | null
  mode: SidebarMode
  onSelectGroup: (g: RgGroup) => void
  onModeChange: (m: SidebarMode) => void
  onCreateGroup: () => void
  loading?: boolean
}

export default function ResourceGroupsSidebar({
  groups, selectedGroup, mode, onSelectGroup, onModeChange, onCreateGroup, loading,
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Mode toggle */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex rounded-lg border border-theme overflow-hidden mb-2" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
          <button
            onClick={() => { onModeChange('groups'); setSearch('') }}
            className={`flex-1 py-1 text-[10px] font-bold transition-colors
              ${mode === 'groups' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' : 'text-3 hover:text-2'}`}
          >
            Groups
          </button>
          <button
            onClick={() => { onModeChange('tagexplorer'); setSearch('') }}
            className={`flex-1 py-1 text-[10px] font-bold transition-colors
              ${mode === 'tagexplorer' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' : 'text-3 hover:text-2'}`}
          >
            Tag Explorer
          </button>
        </div>

        {mode === 'groups' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
                Groups {!loading && groups.length > 0 && `(${groups.length})`}
              </span>
              {loading && <Loader2 size={11} className="animate-spin text-3" />}
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search groups…"
                className="sidebar-search pl-7"
              />
            </div>
          </>
        )}

        {mode === 'tagexplorer' && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-4 uppercase tracking-wider">Tag Explorer</span>
            {loading && <Loader2 size={11} className="animate-spin text-3" />}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'groups' && (
          filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
              {loading ? (
                <Loader2 size={22} className="animate-spin text-4 mb-2" />
              ) : groups.length === 0 ? (
                <>
                  <Boxes size={22} className="text-4 mb-2 opacity-20" />
                  <p className="text-xs text-3 font-medium">No groups</p>
                  <p className="text-[10px] text-4 mt-1">Create a group to get started</p>
                </>
              ) : (
                <>
                  <Search size={18} className="text-4 mb-2" />
                  <p className="text-xs text-3 font-medium">No matches</p>
                </>
              )}
            </div>
          ) : (
            filtered.map((g) => {
              const isSelected = selectedGroup?.groupArn === g.groupArn
              return (
                <button
                  key={g.groupArn}
                  onClick={() => onSelectGroup(g)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2
                    ${isSelected ? 'bg-orange-500/10 border-l-orange-500' : 'hover:bg-raised border-l-transparent'}`}
                >
                  <Boxes size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-orange-500' : 'text-4'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${isSelected ? 'text-1' : 'text-2'}`}>
                      {g.name}
                    </p>
                    {g.description && (
                      <p className="text-[9px] text-4 truncate">{g.description}</p>
                    )}
                  </div>
                </button>
              )
            })
          )
        )}

        {mode === 'tagexplorer' && (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            <Tag size={22} className="text-4 mb-2 opacity-20" />
            <p className="text-xs text-3 font-medium">Tag Explorer</p>
            <p className="text-[10px] text-4 mt-1">Browse resources in the main panel</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {mode === 'groups' && (
        <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
          <button
            onClick={onCreateGroup}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
              bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} /> Create Group
          </button>
        </div>
      )}
    </div>
  )
}
