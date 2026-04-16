import { useState, useEffect } from 'react'
import { Plus, User, Trash2, Loader2, Copy, Check, Users, X } from 'lucide-react'
import type { IamUser, IamGroup } from '../../types'

function CopyBtn({ txt }: { txt: string }) {
  const [c, setC] = useState(false)
  return (
    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(txt); setC(true); setTimeout(() => setC(false), 2000) }} className="hover:text-1 transition-colors text-3">
      {c ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  )
}

function ManageUserGroupsModal({ userName, allGroups, onClose, showToast }: any) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userGroups, setUserGroups] = useState<Set<string>>(new Set())
  const [initialGroups, setInitialGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    window.electronAPI.iamListGroupsForUser(userName).then(res => {
      if (res.success && res.data) {
        const names = new Set(res.data.map((g: any) => g.groupName))
        setUserGroups(names)
        setInitialGroups(new Set(names))
      }
      setLoading(false)
    })
  }, [userName])

  const handleSave = async () => {
    setSaving(true)
    const toAdd = [...userGroups].filter(g => !initialGroups.has(g))
    const toRemove = [...initialGroups].filter(g => !userGroups.has(g))

    try {
      for (const g of toAdd) await window.electronAPI.iamAddUserToGroup(g, userName)
      for (const g of toRemove) await window.electronAPI.iamRemoveUserFromGroup(g, userName)
      showToast('success', `Updated groups for user ${userName}`)
      onClose()
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update groups')
      setSaving(false)
    }
  }

  const toggleGroup = (groupName: string) => {
    const next = new Set(userGroups)
    if (next.has(groupName)) next.delete(groupName)
    else next.add(groupName)
    setUserGroups(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-theme shadow-2xl bg-base flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/15">
               <Users size={16} className="text-rose-500" />
             </div>
             <div>
               <h2 className="text-sm font-bold text-1">Manage User Groups</h2>
               <p className="text-[10px] text-3">User: <span className="font-mono">{userName}</span></p>
             </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        
        <div className="flex-1 overflow-auto p-5">
           {loading ? (
              <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-3" /></div>
           ) : allGroups.length === 0 ? (
              <div className="text-center p-8 text-3 text-sm">No groups exist in the account yet.</div>
           ) : (
              <div className="space-y-1">
                 {allGroups.map((g: IamGroup) => {
                   const isSelected = userGroups.has(g.groupName)
                   return (
                     <label key={g.groupName} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'border-rose-500/30 bg-rose-500/5' : 'border-theme hover:bg-raised/50'}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleGroup(g.groupName)} className="w-4 h-4 rounded border-theme text-rose-500 focus:ring-rose-500" />
                        <div className="flex items-center gap-2">
                           <Users size={14} className={isSelected ? 'text-rose-500' : 'text-4'} />
                           <span className={`text-sm font-semibold ${isSelected ? 'text-1' : 'text-2'}`}>{g.groupName}</span>
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
  users: IamUser[]
  loading: boolean
  allGroups: IamGroup[]
  showToast: (type: 'success' | 'error', text: string) => void
  onCreateClick: () => void
  onDelete: (userName: string) => void
}

export default function IamUsersList({ users, loading, allGroups, showToast, onCreateClick, onDelete }: Props) {
  const [search, setSearch] = useState('')
  const [manageUser, setManageUser] = useState<string | null>(null)
  const filtered = users.filter(u => u.userName.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-1 flex items-center gap-2">
            Users <span className="bg-rose-500/10 text-rose-500 text-xs px-2 py-0.5 rounded-md border border-rose-500/20">{users.length}</span>
          </h2>
          <p className="text-xs text-3 mt-1">An IAM user is an entity that you create in AWS to represent the person or application that uses it to interact with AWS.</p>
        </div>
        <button onClick={onCreateClick} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow-sm whitespace-nowrap">
          <Plus size={14} /> Create User
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="w-full">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base w-full max-w-sm mb-4 text-sm"
          />

          <div className="rounded-xl border border-theme bg-base overflow-x-auto relative min-h-[200px]">
            {loading && (
              <div className="absolute inset-0 z-10 bg-base/50 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 size={24} className="animate-spin text-rose-500 mb-2" />
                <p className="text-sm font-semibold text-2">Loading users...</p>
              </div>
            )}
            
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-theme bg-raised/50 text-xs text-3 font-semibold">
                  <th className="py-2.5 px-4 w-1/4">User name</th>
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
                        <User size={32} className="opacity-20 mb-3" />
                        <p className="font-semibold text-2">No users found</p>
                        <p className="text-xs max-w-sm mt-1">Users are identities with credentials that are used to make programmatic or console requests.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => (
                    <tr key={u.userId} className="hover:bg-raised transition-colors group">
                      <td className="py-2.5 px-4 font-bold text-1 flex items-center gap-2">
                        <User size={14} className="text-rose-500 shrink-0" />
                        <span className="truncate">{u.userName}</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-3">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px] xl:max-w-[300px]">{u.arn}</span>
                          <CopyBtn txt={u.arn} />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-3 text-xs">
                        {u.createDate ? new Date(u.createDate).toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button
                             onClick={() => setManageUser(u.userName)}
                             className="p-1.5 rounded-lg text-theme hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                             title="Manage Groups"
                           >
                             <Users size={14} />
                           </button>
                           <button
                             onClick={() => { if(confirm(`Delete user ${u.userName}?`)) onDelete(u.userName) }}
                             className="p-1.5 rounded-lg text-4 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                             title="Delete user"
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

      {manageUser && (
        <ManageUserGroupsModal userName={manageUser} allGroups={allGroups} showToast={showToast} onClose={() => setManageUser(null)} />
      )}
    </div>
  )
}
