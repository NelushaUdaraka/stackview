import { useState } from 'react'
import { Search, Plus, SlidersHorizontal, Loader2, Lock, List } from 'lucide-react'
import type { SsmParameter } from '../../types'

interface Props {
  parameters: SsmParameter[]
  selectedParam: SsmParameter | null
  onSelectParam: (p: SsmParameter) => void
  onCreateParam: () => void
  loading: boolean
}

const TYPE_COLORS: Record<string, string> = {
  String: 'text-teal-500 bg-teal-500/10',
  StringList: 'text-blue-500 bg-blue-500/10',
  SecureString: 'text-amber-500 bg-amber-500/10',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  String: <SlidersHorizontal size={12} />,
  StringList: <List size={12} />,
  SecureString: <Lock size={12} />,
}

function shortName(fullName: string): string {
  const parts = fullName.split('/')
  return parts[parts.length - 1] || fullName
}

function pathPrefix(fullName: string): string {
  const idx = fullName.lastIndexOf('/')
  if (idx <= 0) return ''
  return fullName.slice(0, idx + 1)
}

export default function ParameterStoreSidebar({
  parameters, selectedParam, onSelectParam, onCreateParam, loading
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = parameters.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Parameters {!loading && parameters.length > 0 && `(${parameters.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search parameters..."
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
            ) : parameters.length === 0 ? (
              <>
                <SlidersHorizontal size={22} className="text-4 mb-2" />
                <p className="text-xs text-3">No parameters yet</p>
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
          filtered.map((param) => {
            const isSelected = selectedParam?.name === param.name
            const prefix = pathPrefix(param.name)
            const short = shortName(param.name)
            return (
              <button
                key={param.name}
                onClick={() => onSelectParam(param)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-teal-500/10 border-l-teal-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <SlidersHorizontal size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-teal-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  {prefix && (
                    <p className="text-[9px] text-4 font-mono truncate leading-none mb-0.5">{prefix}</p>
                  )}
                  <p className={`text-xs font-medium truncate leading-snug ${isSelected ? 'text-1' : 'text-2'}`}>
                    {short}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[param.type] ?? 'text-3 bg-raised'}`}>
                      {TYPE_ICONS[param.type]}
                      {param.type}
                    </span>
                    {param.version !== undefined && (
                      <span className="text-[9px] text-4">v{param.version}</span>
                    )}
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
          onClick={onCreateParam}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
        >
          <Plus size={13} />
          New Parameter
        </button>
      </div>
    </div>
  )
}
