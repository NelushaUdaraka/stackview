import { useState } from 'react'
import { Plus, Shield, Trash2, Loader2, Copy, Check, FileText } from 'lucide-react'
import type { IamRole } from '../../types'

function CopyBtn({ txt }: { txt: string }) {
  const [c, setC] = useState(false)
  return (
    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(txt); setC(true); setTimeout(() => setC(false), 2000) }} className="hover:text-1 transition-colors text-3">
      {c ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  )
}

interface Props {
  roles: IamRole[]
  loading: boolean
  onCreateClick: () => void
  onDelete: (roleName: string) => void
}

export default function IamRolesList({ roles, loading, onCreateClick, onDelete }: Props) {
  const [search, setSearch] = useState('')
  const filtered = roles.filter(r => r.roleName.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-1 flex items-center gap-2">
            Roles <span className="bg-rose-500/10 text-rose-500 text-xs px-2 py-0.5 rounded-md border border-rose-500/20">{roles.length}</span>
          </h2>
          <p className="text-xs text-3 mt-1">An IAM role is an identity with permission policies that determine what the identity can and cannot do in AWS.</p>
        </div>
        <button onClick={onCreateClick} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow-sm whitespace-nowrap">
          <Plus size={14} /> Create Role
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="w-full">
          <input
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base w-full max-w-sm mb-4 text-sm"
          />

          <div className="rounded-xl border border-theme bg-base overflow-x-auto relative min-h-[200px]">
            {loading && (
              <div className="absolute inset-0 z-10 bg-base/50 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 size={24} className="animate-spin text-rose-500 mb-2" />
                <p className="text-sm font-semibold text-2">Loading roles...</p>
              </div>
            )}
            
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-theme bg-raised/50 text-xs text-3 font-semibold">
                  <th className="py-2.5 px-4 w-1/4">Role name</th>
                  <th className="py-2.5 px-4 w-[40%]">ARN</th>
                  <th className="py-2.5 px-4 w-1/4">Creation time</th>
                  <th className="py-2.5 px-4 w-16 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-theme/50">
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-3">
                      <div className="flex flex-col items-center justify-center">
                        <Shield size={32} className="opacity-20 mb-3" />
                        <p className="font-semibold text-2">No roles found</p>
                        <p className="text-xs max-w-sm mt-1">Roles allow AWS services or users to assume identities and grant temporary permissions.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.roleId} className="hover:bg-raised transition-colors group">
                      <td className="py-2.5 px-4 font-bold text-1 flex items-center gap-2">
                        <Shield size={14} className="text-rose-500 shrink-0" />
                        <span className="truncate">{r.roleName}</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[200px] xl:max-w-[300px]">{r.arn}</span>
                            <CopyBtn txt={r.arn} />
                          </div>
                          {r.assumeRolePolicyDocument && (
                            <span className="text-[10px] text-4 flex items-center gap-1 cursor-help truncate" title={r.assumeRolePolicyDocument}>
                              <FileText size={10} /> Has Trust Policy
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-3 text-xs">
                        {r.createDate ? new Date(r.createDate).toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => { if(confirm(`Delete role ${r.roleName}?`)) onDelete(r.roleName) }}
                          className="p-1.5 rounded-lg text-4 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete role"
                        >
                          <Trash2 size={13} />
                        </button>
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
