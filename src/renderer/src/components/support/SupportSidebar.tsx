import { useState } from 'react'
import { Search, Plus, LifeBuoy, ShieldCheck, Loader2 } from 'lucide-react'
import type { SupportCase } from '../../types'

type SidebarMode = 'cases' | 'advisor'

interface Props {
  cases: SupportCase[]
  selectedCase: SupportCase | null
  mode: SidebarMode
  includeResolved: boolean
  onSelectCase: (c: SupportCase) => void
  onModeChange: (m: SidebarMode) => void
  onToggleResolved: () => void
  onCreateCase: () => void
  loading?: boolean
}

function statusColor(status?: string) {
  if (!status) return 'text-3'
  const s = status.toLowerCase()
  if (s === 'opened' || s === 'reopened') return 'text-sky-500'
  if (s === 'resolved' || s === 'closed') return 'text-emerald-500'
  if (s === 'pending-customer-action') return 'text-amber-500'
  return 'text-3'
}

export default function SupportSidebar({
  cases,
  selectedCase,
  mode,
  includeResolved,
  onSelectCase,
  onModeChange,
  onToggleResolved,
  onCreateCase,
  loading,
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = cases.filter((c) =>
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    (c.caseId ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      className="flex flex-col h-full w-full border-r border-theme"
      style={{ backgroundColor: 'rgb(var(--bg-base))' }}
    >
      {/* Mode toggle */}
      <div
        className="px-3 pt-3 pb-2 border-b border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
      >
        <div
          className="flex rounded-lg border border-theme overflow-hidden mb-2"
          style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
        >
          <button
            onClick={() => { onModeChange('cases'); setSearch('') }}
            className={`flex-1 py-1 text-[10px] font-bold transition-colors
              ${mode === 'cases' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'text-3 hover:text-2'}`}
          >
            Cases
          </button>
          <button
            onClick={() => { onModeChange('advisor'); setSearch('') }}
            className={`flex-1 py-1 text-[10px] font-bold transition-colors
              ${mode === 'advisor' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'text-3 hover:text-2'}`}
          >
            Trusted Advisor
          </button>
        </div>

        {mode === 'cases' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
                Cases {!loading && cases.length > 0 && `(${cases.length})`}
              </span>
              <div className="flex items-center gap-1.5">
                {loading && <Loader2 size={11} className="animate-spin text-3" />}
                <button
                  onClick={onToggleResolved}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors
                    ${includeResolved ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'text-4 hover:text-2'}`}
                >
                  {includeResolved ? 'All' : 'Open'}
                </button>
              </div>
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases…"
                className="sidebar-search pl-7"
              />
            </div>
          </>
        )}

        {mode === 'advisor' && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-4 uppercase tracking-wider">Checks</span>
            {loading && <Loader2 size={11} className="animate-spin text-3" />}
          </div>
        )}
      </div>

      {/* List (cases mode only; advisor has no sidebar list) */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'cases' && (
          filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
              {loading ? (
                <Loader2 size={22} className="animate-spin text-4 mb-2" />
              ) : cases.length === 0 ? (
                <>
                  <LifeBuoy size={22} className="text-4 mb-2 opacity-20" />
                  <p className="text-xs text-3 font-medium">No cases</p>
                  <p className="text-[10px] text-4 mt-1">Create a case to get started</p>
                </>
              ) : (
                <>
                  <Search size={18} className="text-4 mb-2" />
                  <p className="text-xs text-3 font-medium">No matches</p>
                </>
              )}
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = selectedCase?.caseId === c.caseId
              return (
                <button
                  key={c.caseId}
                  onClick={() => onSelectCase(c)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2
                    ${isSelected
                      ? 'bg-sky-500/10 border-l-sky-500'
                      : 'hover:bg-raised border-l-transparent'
                    }`}
                >
                  <LifeBuoy size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-sky-500' : 'text-4'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${isSelected ? 'text-1' : 'text-2'}`}>
                      {c.subject}
                    </p>
                    <div className="flex items-center gap-1.5 justify-between">
                      <p className="text-[9px] text-4 truncate font-mono">{c.displayId || c.caseId}</p>
                      <span className={`text-[8px] font-bold uppercase ${statusColor(c.status)}`}>
                        {c.status || '—'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })
          )
        )}

        {mode === 'advisor' && (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            <ShieldCheck size={22} className="text-4 mb-2 opacity-20" />
            <p className="text-xs text-3 font-medium">Trusted Advisor</p>
            <p className="text-[10px] text-4 mt-1">View checks in the main panel</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {mode === 'cases' && (
        <div
          className="p-2 border-t border-theme shrink-0"
          style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}
        >
          <button
            onClick={onCreateCase}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
              bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} /> Create Case
          </button>
        </div>
      )}
    </div>
  )
}
