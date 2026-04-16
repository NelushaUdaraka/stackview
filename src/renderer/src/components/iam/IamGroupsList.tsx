import { useState, useEffect } from 'react'
import { Plus, Users, Trash2, Loader2, Copy, Check, UserPlus, X, User } from 'lucide-react'
import type { IamGroup, IamUser } from '../../types'

function CopyBtn({ txt }: { txt: string }) {
  const [c, setC] = useState(false)
  return (
    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(txt); setC(true); setTimeout(() => setC(false), 2000) }} className="hover:text-1 transition-colors text-3">
      {c ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  )
}

function ManageGroupUsersModal({ groupName, allUsers, onClose, showToast }: any) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [groupUsers, setGroupUsers] = useState<Set<string>>(new Set())
  const [initialUsers, setInitialUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    window.electronAPI.iamGetGroupUsers(groupName).then(res => {
      if (res.success && res.data) {
        const names = new Set(res.data.map((u: any) => u.userName))
        setGroupUsers(names)
        setInitialUsers(new Set(names))
      }
      setLoading(false)
    })
  }, [groupName])

  const handleSave = async () => {
    setSaving(true)
    const toAdd = [...groupUsers].filter(u => !initialUsers.has(u))
    const toRemove = [...initialUsers].filter(u => !groupUsers.has(u))

    try {
      for (const u of toAdd) await window.electronAPI.iamAddUserToGroup(groupName, u)
      for (const u of toRemove) await window.electronAPI.iamRemoveUserFromGroup(groupName, u)
      showToast('success', `Updated users for group ${groupName}`)
      onClose()
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update users')
      setSaving(false)
    }
  }

  const toggleUser = (userName: string) => {
    const next = new Set(groupUsers)
    if (next.has(userName)) next.delete(userName)
    else next.add(userName)
    setGroupUsers(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-theme shadow-2xl bg-base flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/15">
               <UserPlus size={16} className="text-rose-500" />
             </div>
             <div>
               <h2 className="text-sm font-bold text-1">Manage Group Users</h2>
               <p className="text-[10px] text-3">Group: <span className="font-mono">{groupName}</span></p>
             </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        
        <div className="flex-1 overflow-auto p-5">
           {loading ? (
              <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-3" /></div>
           ) : allUsers.length === 0 ? (
              <div className="text-center p-8 text-3 text-sm">No users exist in the account yet.</div>
           ) : (
              <div className="space-y-1">
                 {allUsers.map((u: IamUser) => {
                   const isSelected = groupUsers.has(u.userName)
                   return (
                     <label key={u.userName} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'border-rose-500/30 bg-rose-500/5' : 'border-theme hover:bg-raised/50'}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleUser(u.userName)} className="w-4 h-4 rounded border-theme text-rose-500 focus:ring-rose-500" />
                        <div className="flex items-center gap-2">
                           <User size={14} className={isSelected ? 'text-rose-500' : 'text-4'} />
                           <span className={`text-sm font-semibold ${isSelected ? 'text-1' : 'text-2'}`}>{u.userName}</span>
                        </div>
                     </label>
                   )
                 })}
              </div>
           )}
        </div>

        <div className="px-5 py-4 border-t border-theme bg-raised/30 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
           <button onClick={handleSave} disabled={loading || saving} className="btn-primary px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Changes
           </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  groups: IamGroup[]
  loading: boolean
  allUsers: IamUser[]
  showToast: (type: 'success' | 'error', text: string) => void
  onCreateClick: () => void
  onDelete: (groupName: string) => void
}

export default function IamGroupsList({ groups, loading, allUsers, showToast, onCreateClick, onDelete }: Props) {
  const [search, setSearch] = useState('')
  const [manageGroup, setManageGroup] = useState<string | null>(null)
  const filtered = groups.filter(g => g.groupName.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-1 flex items-center gap-2">
            User groups <span className="bg-rose-500/10 text-rose-500 text-xs px-2 py-0.5 rounded-md border border-rose-500/20">{groups.length}</span>
          </h2>
          <p className="text-xs text-3 mt-1">A user group is a collection of IAM users. Groups let you specify permissions for multiple users.</p>
        </div>
        <button onClick={onCreateClick} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow-sm whitespace-nowrap">
          <Plus size={14} /> Create Group
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="w-full">
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base w-full max-w-sm mb-4 text-sm"
          />

          <div className="rounded-xl border border-theme bg-base overflow-x-auto relative min-h-[200px]">
            {loading && (
              <div className="absolute inset-0 z-10 bg-base/50 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 size={24} className="animate-spin text-rose-500 mb-2" />
                <p className="text-sm font-semibold text-2">Loading groups...</p>
              </div>
            )}
            
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-theme bg-raised/50 text-xs text-3 font-semibold">
                  <th className="py-2.5 px-4 w-1/4">Group name</th>
                  <th className="py-2.5 px-4 w-[40%]">ARN</th>
                  <th className="py-2.5 px-4 w-1/4">Creation time</th>
                  <th className="py-2.5 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-theme/50">
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-3">
                      <div className="flex flex-col items-center justify-center">
                        <Users size={32} className="opacity-20 mb-3" />
                        <p className="font-semibold text-2">No groups found</p>
                        <p className="text-xs max-w-sm mt-1">Create a group to attach policies centrally for sets of users.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(g => (
                    <tr key={g.groupId} className="hover:bg-raised transition-colors group">
                      <td className="py-2.5 px-4 font-bold text-1 flex items-center gap-2">
                        <Users size={14} className="text-rose-500 shrink-0" />
                        <span className="truncate">{g.groupName}</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-3">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px] xl:max-w-[300px]">{g.arn}</span>
                          <CopyBtn txt={g.arn} />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-3 text-xs">
                        {g.createDate ? new Date(g.createDate).toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button
                             onClick={() => setManageGroup(g.groupName)}
                             className="p-1.5 rounded-lg text-theme hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                             title="Manage Users"
                           >
                             <UserPlus size={14} />
                           </button>
                           <button
                             onClick={() => { if(confirm(`Delete group ${g.groupName}?`)) onDelete(g.groupName) }}
                             className="p-1.5 rounded-lg text-4 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                             title="Delete group"
                           >
                             <Trash2 size={13} />
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

      {manageGroup && (
        <ManageGroupUsersModal groupName={manageGroup} allUsers={allUsers} showToast={showToast} onClose={() => setManageGroup(null)} />
      )}
    </div>
  )
}
