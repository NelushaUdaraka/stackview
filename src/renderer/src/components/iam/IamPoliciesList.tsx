import { useState } from 'react'
import { FileText, Loader2, Copy, Check, Filter, Plus } from 'lucide-react'
import type { IamPolicy } from '../../types'

function CopyBtn({ txt }: { txt: string }) {
  const [c, setC] = useState(false)
  return (
    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(txt); setC(true); setTimeout(() => setC(false), 2000) }} className="hover:text-1 transition-colors text-3">
      {c ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  )
}

interface Props {
  policies: IamPolicy[]
  loading: boolean
  scope: 'AWS' | 'Local' | 'All'
  setScope: (scope: 'AWS' | 'Local' | 'All') => void
  onCreateClick: () => void
}

export default function IamPoliciesList({ policies, loading, scope, setScope, onCreateClick }: Props) {
  const [search, setSearch] = useState('')
  const filtered = policies.filter(p => p.policyName.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
        <div>
          <h2 className="text-lg font-bold text-1 flex items-center gap-2">
            Policies <span className="bg-rose-500/10 text-rose-500 text-xs px-2 py-0.5 rounded-md border border-rose-500/20">{policies.length}</span>
          </h2>
          <p className="text-xs text-3 mt-1">Policies are objects in AWS that define permissions.</p>
        </div>
        <div className="flex bg-raised rounded-lg p-0.5 border border-theme w-fit">
          {(['AWS', 'Local', 'All'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${scope === s ? 'bg-base shadow-sm text-rose-500' : 'text-3 hover:text-2'}`}
            >
              <Filter size={10} className="inline mr-1 opacity-50" />
              {s === 'AWS' ? 'AWS managed' : s === 'Local' ? 'Customer managed' : 'All'}
            </button>
          ))}
        </div>
        <button onClick={onCreateClick} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow-sm whitespace-nowrap">
          <Plus size={14} /> Create Policy
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="w-full">
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base w-full max-w-sm mb-4 text-sm"
          />

          <div className="rounded-xl border border-theme bg-base overflow-x-auto relative min-h-[200px]">
            {loading && (
              <div className="absolute inset-0 z-10 bg-base/50 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 size={24} className="animate-spin text-rose-500 mb-2" />
                <p className="text-sm font-semibold text-2">Fetching policies...</p>
              </div>
            )}
            
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-theme bg-raised/50 text-xs text-3 font-semibold">
                  <th className="py-2.5 px-4 min-w-[200px]">Policy name</th>
                  <th className="py-2.5 px-4 w-[40%]">ARN</th>
                  <th className="py-2.5 px-4 w-1/4">Creation time</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-theme/50">
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-3">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={32} className="opacity-20 mb-3" />
                        <p className="font-semibold text-2">No policies found for scope '{scope}'</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p.policyId || p.arn} className="hover:bg-raised transition-colors">
                      <td className="py-2.5 px-4 font-bold text-1">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-rose-500 shrink-0" />
                            <span className="truncate" title={p.policyName}>{p.policyName}</span>
                          </div>
                          {p.description && <span className="text-[10px] text-4 font-normal truncate max-w-[300px]" title={p.description}>{p.description}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-3">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px] xl:max-w-[400px]">{p.arn}</span>
                          <CopyBtn txt={p.arn} />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-3 text-xs">
                        {p.createDate ? new Date(p.createDate).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
