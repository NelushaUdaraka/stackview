import { useState } from 'react'
import { Search, Plus, Workflow, Loader2 } from 'lucide-react'
import type { EbBus } from '../../types'

interface Props {
  buses: EbBus[]
  selectedBus: EbBus | null
  onSelectBus: (bus: EbBus) => void
  onCreateBus: () => void
  loading?: boolean
}

export default function EbSidebar({
  buses, selectedBus, onSelectBus, onCreateBus, loading
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = buses.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.arn.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Event Buses {!loading && buses.length > 0 && `(${buses.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search buses..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : buses.length === 0 ? (
              <>
                <Workflow size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No buses found</p>
                <p className="text-[10px] text-4 mt-1">Create one below</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((bus) => {
            const isSelected = selectedBus?.name === bus.name
            const isDefault = bus.name === 'default'
            return (
              <button
                key={bus.name}
                onClick={() => onSelectBus(bus)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-fuchsia-500/10 border-l-fuchsia-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <Workflow size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-fuchsia-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 overflow-hidden w-full">
                    <p className={`text-xs font-medium truncate leading-snug ${isSelected ? 'text-1' : 'text-2'}`}>
                      {bus.name}
                    </p>
                    {isDefault && !isSelected && (
                      <span className="text-[8px] px-1 rounded bg-fuchsia-500/10 text-fuchsia-600 border border-fuchsia-500/10 shrink-0">DEFAULT</span>
                    )}
                  </div>
                  <p className="text-[9px] text-4 font-mono truncate leading-none mt-1">
                    {bus.arn.split(':').slice(-1)[0]}
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
          onClick={onCreateBus}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          New Event Bus
        </button>
      </div>
    </div>
  )
}
