import { useState } from 'react'
import { Network, Plus, Trash2, Key, Loader2, ArrowRight } from 'lucide-react'
import type { ApigwRestApi } from '../../types'

interface Props {
  apis: ApigwRestApi[]
  loading: boolean
  onCreateClick: () => void
  onDelete: (id: string) => void
  onSelect: (api: ApigwRestApi) => void
}

export default function ApigwApisList({ apis, loading, onCreateClick, onDelete, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const filtered = apis.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
        <div>
          <h2 className="text-lg font-bold text-1 flex items-center gap-2">
            REST APIs <span className="bg-violet-500/10 text-violet-500 text-xs px-2 py-0.5 rounded-md border border-violet-500/20">{apis.length}</span>
          </h2>
          <p className="text-xs text-3 mt-1">APIs that allow communication with backend resources.</p>
        </div>
        <button onClick={onCreateClick} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors shadow-sm">
          <Plus size={14} /> Create API
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="w-full">
          <input
            type="text"
            placeholder="Search APIs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base w-full max-w-sm mb-4 text-sm"
          />

          <div className="rounded-xl border border-theme bg-base overflow-x-auto relative min-h-[200px]">
            {loading && (
              <div className="absolute inset-0 z-10 bg-base/50 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 size={24} className="animate-spin text-violet-500 mb-2" />
                <p className="text-sm font-semibold text-2">Fetching APIs...</p>
              </div>
            )}
            
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-theme bg-raised/50 text-xs text-3 font-semibold">
                  <th className="py-2.5 px-4">API name</th>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4 w-1/4">Creation time</th>
                  <th className="py-2.5 px-4 w-[100px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-theme/50">
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-3">
                      <div className="flex flex-col items-center justify-center">
                        <Network size={32} className="opacity-20 mb-3" />
                        <p className="font-semibold text-2">No APIs found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(api => (
                    <tr key={api.id} className="hover:bg-raised transition-colors group cursor-pointer" onClick={() => onSelect(api)}>
                      <td className="py-2.5 px-4 font-bold text-1">
                        <div className="flex items-center gap-2">
                          <Network size={14} className="text-violet-500 shrink-0" />
                          <span>{api.name}</span>
                        </div>
                        {api.description && <div className="text-[10px] text-4 font-normal mt-0.5 max-w-[300px] truncate">{api.description}</div>}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-3">
                        {api.id}
                      </td>
                      <td className="py-2.5 px-4 text-3 text-xs">
                        {api.createdDate ? new Date(api.createdDate).toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); onDelete(api.id) }} className="p-1.5 text-3 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete API">
                            <Trash2 size={14} />
                          </button>
                          <button className="p-1.5 text-violet-500 hover:bg-violet-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold px-2">
                             Details <ArrowRight size={12} />
                          </button>
                        </div>
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
