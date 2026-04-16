import { useState } from 'react'
import { Search, Plus, Globe } from 'lucide-react'

interface Props {
  domains: string[]
  selectedDomain: string | null
  onSelectDomain: (name: string) => void
  onCreateDomain: () => void
  refreshing: boolean
  sidebarWidth: number
}

export default function OpenSearchSidebar({
  domains, selectedDomain, onSelectDomain, onCreateDomain, refreshing, sidebarWidth
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = domains.filter(d => d.toLowerCase().includes(search.toLowerCase()))

  return (
    <div
      className="flex flex-col h-full shrink-0"
      style={{ width: sidebarWidth, backgroundColor: 'rgb(var(--bg-base))' }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Domains {!refreshing && domains.length > 0 && `(${domains.length})`}
          </span>
          {refreshing && <Search size={12} className="text-purple-400 animate-pulse shrink-0" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search domains..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {refreshing && domains.length === 0 ? (
              <Search size={22} className="animate-spin text-4 mb-2" />
            ) : domains.length === 0 ? (
              <>
                <Globe size={32} className="mx-auto text-4 opacity-20 mb-3" />
                <p className="text-xs text-3 font-medium">No domains found</p>
                <p className="text-[10px] text-4 mt-1">Create a domain to get started</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map(name => {
            const isSelected = selectedDomain === name
            return (
              <button
                key={name}
                onClick={() => onSelectDomain(name)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-purple-500/10 border-l-purple-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <Globe size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-purple-400' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug ${isSelected ? 'text-1 font-semibold' : 'text-2'}`}>
                    {name}
                  </p>
                  <p className="text-[9px] font-bold text-4 uppercase tracking-widest mt-0.5">
                    OpenSearch Domain
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateDomain}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors shadow-sm active:scale-[0.98]"
        >
          <Plus size={13} />
          Create Domain
        </button>
      </div>
    </div>
  )
}
