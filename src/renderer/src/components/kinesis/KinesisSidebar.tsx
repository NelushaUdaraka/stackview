import { useState } from 'react'
import { Search, Activity, Plus, Database } from 'lucide-react'

interface Props {
  streams: string[]
  selectedStream: string | null
  onSelectStream: (name: string) => void
  onCreateStream: () => void
  refreshing: boolean
  sidebarWidth: number
}

export default function KinesisSidebar({
  streams, selectedStream, onSelectStream, onCreateStream, refreshing, sidebarWidth
}: Props) {
  const [search, setSearch] = useState('')

  const filteredStreams = streams.filter(s => 
    s.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div 
      className="flex flex-col h-full shrink-0"
      style={{ width: sidebarWidth, backgroundColor: 'rgb(var(--bg-base))' }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Streams {!refreshing && streams.length > 0 && `(${streams.length})`}
          </span>
          {refreshing && <Activity size={12} className="text-amber-500 animate-pulse shrink-0" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search streams..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {filteredStreams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {refreshing && streams.length === 0 ? (
              <Activity size={22} className="animate-spin text-4 mb-2" />
            ) : streams.length === 0 ? (
              <>
                <Database size={32} className="mx-auto text-4 opacity-20 mb-3" />
                <p className="text-xs text-3 font-medium">No streams found</p>
                <p className="text-[10px] text-4 mt-1">Create a data stream to get started</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filteredStreams.map(name => {
            const isSelected = selectedStream === name
            return (
              <button
                key={name}
                onClick={() => onSelectStream(name)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-amber-500/10 border-l-amber-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <Activity size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-amber-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug ${isSelected ? 'text-1 font-semibold' : 'text-2'}`}>
                    {name}
                  </p>
                  <p className="text-[9px] font-bold text-4 uppercase tracking-widest mt-0.5">
                    Kinesis Data Stream
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
          onClick={onCreateStream}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-sm active:scale-[0.98]"
        >
          <Plus size={13} />
          Create Data Stream
        </button>
      </div>
    </div>
  )
}
