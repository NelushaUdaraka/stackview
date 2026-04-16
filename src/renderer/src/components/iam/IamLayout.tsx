import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import { AlertTriangle, X, Plus, Loader2, User, Users, Shield, FileText } from 'lucide-react'
import type { AppSettings, IamUser, IamRole, IamGroup, IamPolicy } from '../../types'
import IamSidebar from './IamSidebar'
import IamUsersList from './IamUsersList'
import IamRolesList from './IamRolesList'
import IamGroupsList from './IamGroupsList'
import IamPoliciesList from './IamPoliciesList'

const MODAL_OVERLAY = { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }

// ── Modals ────────────────────────────────────────────────────────────────────

function CreateUserModal({ onClose, onCreated, allGroups }: any) {
  const { showToast } = useToastContext()
  const [userName, setUserName] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!userName.trim()) return
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.iamCreateUser(userName.trim())

    if (res.success) {
      try {
        const addUserPromises = Array.from(selectedGroups).map(g => window.electronAPI.iamAddUserToGroup(g, userName.trim()))
        await Promise.all(addUserPromises)
        showToast('success', `User created and added to groups`)
        onCreated()
      } catch (err: any) {
        showToast('error', 'User created, but failed to assign to some groups')
        onCreated()
      }
    } else {
      setError(res.error || 'Failed to create user')
      setSubmitting(false)
    }
  }

  const toggleGroup = (groupName: string) => {
    const next = new Set(selectedGroups)
    if (next.has(groupName)) next.delete(groupName)
    else next.add(groupName)
    setSelectedGroups(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={MODAL_OVERLAY}>
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden bg-base">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/15">
              <User size={16} className="text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create User</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">User name</label>
            <input
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="e.g. JohnDoe"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>

          {allGroups && allGroups.length > 0 && (
             <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Add to Groups (Optional)</label>
                <div className="border border-theme rounded-xl p-2 bg-raised/30 max-h-[200px] overflow-y-auto space-y-1">
                   {allGroups.map((g: IamGroup) => {
                      const isSelected = selectedGroups.has(g.groupName)
                      return (
                         <label key={g.groupName} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-rose-500/10' : 'hover:bg-raised'}`}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleGroup(g.groupName)} className="w-3.5 h-3.5 rounded border-theme text-rose-500 focus:ring-rose-500" />
                            <Users size={12} className={isSelected ? 'text-rose-500' : 'text-4'} />
                            <span className={`text-xs ${isSelected ? 'font-semibold text-1' : 'text-3'} truncate`}>{g.groupName}</span>
                         </label>
                      )
                   })}
                </div>
             </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!userName.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Create User
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateGroupModal({ onClose, onCreated, allUsers }: any) {
  const { showToast } = useToastContext()
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!groupName.trim()) return
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.iamCreateGroup(groupName.trim())

    if (res.success) {
      try {
        const addUserPromises = Array.from(selectedUsers).map(u => window.electronAPI.iamAddUserToGroup(groupName.trim(), u))
        await Promise.all(addUserPromises)
        showToast('success', `Group created and users added`)
        onCreated()
      } catch (err: any) {
        showToast('error', 'Group created, but failed to add some users')
        onCreated()
      }
    } else {
      setError(res.error || 'Failed to create group')
      setSubmitting(false)
    }
  }

  const toggleUser = (userName: string) => {
    const next = new Set(selectedUsers)
    if (next.has(userName)) next.delete(userName)
    else next.add(userName)
    setSelectedUsers(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={MODAL_OVERLAY}>
      <div className="w-full max-w-sm flex flex-col max-h-[90vh] rounded-2xl border border-theme shadow-2xl overflow-hidden bg-base">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/15">
              <Users size={16} className="text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create User Group</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Group name</label>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="e.g. Administrators"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>

          {allUsers && allUsers.length > 0 && (
             <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Add Users (Optional)</label>
                <div className="border border-theme rounded-xl p-2 bg-raised/30 max-h-[200px] overflow-y-auto space-y-1">
                   {allUsers.map((u: IamUser) => {
                      const isSelected = selectedUsers.has(u.userName)
                      return (
                         <label key={u.userName} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-rose-500/10' : 'hover:bg-raised'}`}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleUser(u.userName)} className="w-3.5 h-3.5 rounded border-theme text-rose-500 focus:ring-rose-500" />
                            <User size={12} className={isSelected ? 'text-rose-500' : 'text-4'} />
                            <span className={`text-xs ${isSelected ? 'font-semibold text-1' : 'text-3'} truncate`}>{u.userName}</span>
                         </label>
                      )
                   })}
                </div>
             </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Create Group
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateRoleModal({ onClose, onCreated }: any) {
  const { showToast } = useToastContext()
  const [roleName, setRoleName] = useState('')
  const [doc, setDoc] = useState('{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Principal": {\n        "Service": "ec2.amazonaws.com"\n      },\n      "Action": "sts:AssumeRole"\n    }\n  ]\n}')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!roleName.trim() || !doc.trim()) return
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.iamCreateRole(roleName.trim(), doc.trim())
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Role created successfully`)
      onCreated()
    } else {
      setError(res.error || 'Failed to create role')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={MODAL_OVERLAY}>
      <div className="w-full max-w-2xl rounded-2xl border border-theme shadow-2xl flex flex-col max-h-[90vh] bg-base">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/15">
              <Shield size={16} className="text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Role</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Role name</label>
            <input
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              placeholder="e.g. MyServiceExecutionRole"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Trust Relationships (AssumeRolePolicyDocument)</label>
            <textarea
              value={doc}
              onChange={e => setDoc(e.target.value)}
              className="input-base w-full text-xs font-mono min-h-[250px] resize-y"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!roleName.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Create Role
          </button>
        </div>
      </div>
    </div>
  )
}

function CreatePolicyModal({ onClose, onCreated }: any) {
  const { showToast } = useToastContext()
  const [policyName, setPolicyName] = useState('')
  const [description, setDescription] = useState('')
  const [doc, setDoc] = useState('{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "*",\n      "Resource": "*"\n    }\n  ]\n}')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!policyName.trim() || !doc.trim()) return
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.iamCreatePolicy(policyName.trim(), doc.trim(), description.trim() || undefined)
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Policy created successfully`)
      onCreated()
    } else {
      setError(res.error || 'Failed to create policy')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={MODAL_OVERLAY}>
      <div className="w-full max-w-2xl rounded-2xl border border-theme shadow-2xl flex flex-col max-h-[90vh] bg-base">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/15">
              <FileText size={16} className="text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Policy</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Policy name</label>
            <input
              value={policyName}
              onChange={e => setPolicyName(e.target.value)}
              placeholder="e.g. MyCustomPolicy"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Description (Optional)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Allows full access to all resources"
              className="input-base w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Policy Document (JSON)</label>
            <textarea
              value={doc}
              onChange={e => setDoc(e.target.value)}
              className="input-base w-full text-xs font-mono min-h-[250px] resize-y"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!policyName.trim() || !doc.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Create Policy
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

interface Props {
  settings: AppSettings
}

export default function IamLayout({ settings }: Props) {
  const [activeTab, setActiveTab] = useState<'Users' | 'Groups' | 'Roles' | 'Policies'>('Users')

  // Data
  const [users, setUsers] = useState<IamUser[]>([])
  const [groups, setGroups] = useState<IamGroup[]>([])
  const [roles, setRoles] = useState<IamRole[]>([])
  const [policies, setPolicies] = useState<IamPolicy[]>([])
  const [policyScope, setPolicyScope] = useState<'AWS' | 'Local' | 'All'>('Local')
  const [loading, setLoading] = useState(false)

  // Modals
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [showCreatePolicy, setShowCreatePolicy] = useState(false)

  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  // Fetches
  const loadUsers = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.iamListUsers()
    if (res.success && res.data) setUsers(res.data)
    else if (!res.success) showToast('error', res.error || 'Failed to load users')
    setLoading(false)
  }, [showToast])

  const loadGroups = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.iamListGroups()
    if (res.success && res.data) setGroups(res.data)
    else if (!res.success) showToast('error', res.error || 'Failed to load groups')
    setLoading(false)
  }, [showToast])

  const loadRoles = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.iamListRoles()
    if (res.success && res.data) setRoles(res.data)
    else if (!res.success) showToast('error', res.error || 'Failed to load roles')
    setLoading(false)
  }, [showToast])

  const loadPolicies = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.iamListPolicies(policyScope)
    if (res.success && res.data) setPolicies(res.data)
    else if (!res.success) showToast('error', res.error || 'Failed to load policies')
    setLoading(false)
  }, [policyScope, showToast])

  const loadAll = useCallback(() => {
    loadUsers(); loadGroups(); loadRoles(); loadPolicies()
  }, [loadUsers, loadGroups, loadRoles, loadPolicies])

  useEffect(() => {
    if (activeTab === 'Users') loadUsers()
    else if (activeTab === 'Groups') loadGroups()
    else if (activeTab === 'Roles') loadRoles()
    else if (activeTab === 'Policies') loadPolicies()
  }, [activeTab, policyScope])

  useEffect(() => { loadAll() }, [])

  // Deleters
  const handleUserDelete = async (name: string) => {
    const res = await window.electronAPI.iamDeleteUser(name)
    if (res.success) { showToast('success', 'User deleted'); loadUsers() }
    else showToast('error', res.error || 'Failed to delete user')
  }

  const handleGroupDelete = async (name: string) => {
    const res = await window.electronAPI.iamDeleteGroup(name)
    if (res.success) { showToast('success', 'Group deleted'); loadGroups() }
    else showToast('error', res.error || 'Failed to delete group')
  }

  const handleRoleDelete = async (name: string) => {
    const res = await window.electronAPI.iamDeleteRole(name)
    if (res.success) { showToast('success', 'Role deleted'); loadRoles() }
    else showToast('error', res.error || 'Failed to delete role')
  }

  return (
    <div className="flex flex-col h-full bg-app text-1">
      <div className="flex flex-1 overflow-hidden relative">
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10 transition-[width]">
          <IamSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            counts={{ users: users.length, groups: groups.length, roles: roles.length, policies: policies.length }}
          />
        </div>

        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20 transition-colors"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        <main className="flex-1 overflow-hidden">
          {activeTab === 'Users' && <IamUsersList users={users} loading={loading} allGroups={groups} showToast={showToast} onCreateClick={() => setShowCreateUser(true)} onDelete={handleUserDelete} />}
          {activeTab === 'Groups' && <IamGroupsList groups={groups} loading={loading} allUsers={users} showToast={showToast} onCreateClick={() => setShowCreateGroup(true)} onDelete={handleGroupDelete} />}
          {activeTab === 'Roles' && <IamRolesList roles={roles} loading={loading} onCreateClick={() => setShowCreateRole(true)} onDelete={handleRoleDelete} />}
          {activeTab === 'Policies' && <IamPoliciesList policies={policies} loading={loading} scope={policyScope} setScope={setPolicyScope} onCreateClick={() => setShowCreatePolicy(true)} />}
        </main>
      </div>

      {showCreateUser && <CreateUserModal onClose={() => setShowCreateUser(false)} onCreated={() => { setShowCreateUser(false); loadUsers() }} showToast={showToast} allGroups={groups} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreated={() => { setShowCreateGroup(false); loadGroups() }} showToast={showToast} allUsers={users} />}
      {showCreateRole && <CreateRoleModal onClose={() => setShowCreateRole(false)} onCreated={() => { setShowCreateRole(false); loadRoles() }} showToast={showToast} />}
      {showCreatePolicy && <CreatePolicyModal onClose={() => setShowCreatePolicy(false)} onCreated={() => { setShowCreatePolicy(false); loadPolicies() }} showToast={showToast} />}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
