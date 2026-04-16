import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import { AlertTriangle, X, CalendarClock, Plus, Loader2 } from 'lucide-react'
import type { AppSettings, EbScheduleGroup } from '../../types'
import SchedulerSidebar from './SchedulerSidebar'
import SchedulerGroupDetail from './SchedulerGroupDetail'
import CreateScheduleModal from './CreateScheduleModal'

interface Props {
  settings: AppSettings
}

// ── Create Group Modal ────────────────────────────────────────────────────────

interface CreateGroupModalProps {
  onClose: () => void
  onCreated: (group: EbScheduleGroup) => void
}

function CreateGroupModal({ onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) return
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.schedulerCreateGroup(name.trim())
    setSubmitting(false)
    if (res.success) {
      onCreated({ name: name.trim(), arn: res.data || '', state: 'ACTIVE' })
    } else {
      setError(res.error || 'Failed to create group')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/15">
              <CalendarClock size={16} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">New Schedule Group</h2>
              <p className="text-[10px] text-3">EventBridge Scheduler</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Group Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="my-schedule-group"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>
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
            disabled={!name.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Create Group
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function SchedulerLayout({ settings }: Props) {
  const [groups, setGroups] = useState<EbScheduleGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<EbScheduleGroup | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [detailKey, setDetailKey] = useState(0)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadGroups = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.schedulerListGroups()
    if (res.success && res.data) {
      const groupList = res.data as EbScheduleGroup[]
      setGroups(groupList)
      // Auto-select default group or first
      if (!selectedGroup) {
        const def = groupList.find(g => g.name === 'default') || groupList[0]
        if (def) setSelectedGroup(def)
      } else {
        const refreshed = groupList.find(g => g.name === selectedGroup.name)
        setSelectedGroup(refreshed || groupList[0] || null)
      }
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load schedule groups')
    }
    setLoading(false)
  }, [selectedGroup, showToast])

  useEffect(() => { loadGroups() }, [])

  const handleGroupCreated = (group: EbScheduleGroup) => {
    showToast('success', `Group "${group.name}" created`)
    setShowCreateGroup(false)
    loadGroups()
    setSelectedGroup(group)
  }

  const handleScheduleCreated = () => {
    setShowCreateSchedule(false)
    setDetailKey(k => k + 1)
    loadGroups()
  }

  const handleGroupDeleted = () => {
    showToast('success', `Group deleted`)
    setSelectedGroup(null)
    loadGroups()
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <SchedulerSidebar
            groups={groups}
            selectedGroup={selectedGroup}
            onSelectGroup={setSelectedGroup}
            onCreateGroup={() => setShowCreateGroup(true)}
            loading={loading}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-app">
          {selectedGroup ? (
            <SchedulerGroupDetail
              key={`${selectedGroup.name}-${detailKey}`}
              group={selectedGroup}
              onRefresh={loadGroups}
              onDeleted={handleGroupDeleted}
              onCreateSchedule={() => setShowCreateSchedule(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <CalendarClock size={40} className="text-amber-500 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No group selected</p>
                <p className="text-xs text-3">{loading ? 'Loading groups...' : groups.length === 0 ? 'Create a schedule group to get started' : 'Select a schedule group from the sidebar'}</p>
              </div>
              {!loading && groups.length === 0 && (
                <button onClick={() => setShowCreateGroup(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors">
                  <Plus size={14} /> Create Group
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={handleGroupCreated}
        />
      )}
      {showCreateSchedule && (
        <CreateScheduleModal
          groups={groups}
          defaultGroup={selectedGroup}
          onClose={() => setShowCreateSchedule(false)}
          onCreated={handleScheduleCreated}
        />
      )}
    </div>
  )
}
