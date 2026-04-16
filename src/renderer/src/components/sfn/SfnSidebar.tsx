import { useState } from 'react'
import { Search, Plus, Share2, Loader2 } from 'lucide-react'
import type { SfnStateMachine } from '../../types'

interface Props {
  stateMachines: SfnStateMachine[]
  selectedMachine: SfnStateMachine | null
  onSelectMachine: (m: SfnStateMachine) => void
  onCreateMachine: () => void
  loading?: boolean
}

function typeBadge(type: 'STANDARD' | 'EXPRESS') {
  return type === 'EXPRESS' ? (
    <span className="text-[8px] font-bold uppercase tracking-widest text-lime-500">EXPRESS</span>
  ) : (
    <span className="text-[8px] font-bold uppercase tracking-widest text-3">STANDARD</span>
  )
}

export default function SfnSidebar({
  stateMachines,
  selectedMachine,
  onSelectMachine,
  onCreateMachine,
  loading,
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = stateMachines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      className="flex flex-col h-full w-full border-r border-theme"
      style={{ backgroundColor: 'rgb(var(--bg-base))' }}
    >
      {/* Header */}
      <div
        className="px-3 pt-3 pb-2 border-b border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            State Machines {!loading && stateMachines.length > 0 && `(${stateMachines.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search machines…"
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
            ) : stateMachines.length === 0 ? (
              <>
                <Share2 size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No state machines</p>
                <p className="text-[10px] text-4 mt-1">Create one to get started</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((m) => {
            const isSelected = selectedMachine?.stateMachineArn === m.stateMachineArn
            return (
              <button
                key={m.stateMachineArn}
                onClick={() => onSelectMachine(m)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2
                  ${isSelected
                    ? 'bg-lime-500/10 border-l-lime-500'
                    : 'hover:bg-raised border-l-transparent'
                  }`}
              >
                <Share2 size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-lime-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${isSelected ? 'text-1' : 'text-2'}`}>
                    {m.name}
                  </p>
                  <div className="flex items-center gap-1.5 justify-between">
                    <p className="text-[9px] text-4 truncate font-mono">
                      {m.creationDate ? new Date(m.creationDate).toLocaleDateString() : '—'}
                    </p>
                    {typeBadge(m.type)}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div
        className="p-2 border-t border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}
      >
        <button
          onClick={onCreateMachine}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-lime-600 hover:bg-lime-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          Create State Machine
        </button>
      </div>
    </div>
  )
}
