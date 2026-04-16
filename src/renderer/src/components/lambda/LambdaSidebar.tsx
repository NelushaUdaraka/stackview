import { useState } from 'react'
import { Search, Plus, TerminalSquare, Loader2 } from 'lucide-react'
import type { LambdaFunction } from '../../types'

interface Props {
  functions: LambdaFunction[]
  selectedFunctionName: string | null
  onSelectFunction: (name: string) => void
  onCreateFunction: () => void
  loading?: boolean
}

export default function LambdaSidebar({ functions, selectedFunctionName, onSelectFunction, onCreateFunction, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = functions.filter(f =>
    f.FunctionName.toLowerCase().includes(search.toLowerCase()) ||
    f.Runtime.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Functions {!loading && functions.length > 0 && `(${functions.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search functions..."
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
            ) : functions.length === 0 ? (
              <>
                <TerminalSquare size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No functions found</p>
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
          filtered.map((func) => {
            const isSelected = selectedFunctionName === func.FunctionName
            const status = func.State || 'Active'
            return (
              <button
                key={func.FunctionName}
                onClick={() => onSelectFunction(func.FunctionName)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-violet-500/10 border-l-violet-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <TerminalSquare size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-violet-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 overflow-hidden w-full">
                    <p className={`text-xs font-medium break-all leading-snug ${isSelected ? 'text-1' : 'text-2'}`}>
                      {func.FunctionName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-violet-500' : 'text-4'}`}>
                      {status}
                    </p>
                    <span className="text-[9px] text-4">•</span>
                    <p className="text-[9px] text-3 capitalize">{func.Runtime}</p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateFunction}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          Create Function
        </button>
      </div>
    </div>
  )
}
