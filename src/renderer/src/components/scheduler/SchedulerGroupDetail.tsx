import { useState, useCallback, useEffect } from 'react'
import {
  Plus, Trash2, CalendarClock, ChevronRight, Search, Loader2,
  Clock, ToggleLeft, ToggleRight, Copy, Check, AlarmClock, Target as TargetIcon,
  FolderClock, AlertTriangle
} from 'lucide-react'
import type { EbScheduleGroup, EbSchedule } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  group: EbScheduleGroup
  onRefresh: () => void
  onDeleted: () => void
  onCreateSchedule: () => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

export default function SchedulerGroupDetail({ group, onRefresh, onDeleted, onCreateSchedule }: Props) {
  const { showToast } = useToastContext()
  const [schedules, setSchedules] = useState<EbSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<string | null>(null)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [fullSchedules, setFullSchedules] = useState<Record<string, EbSchedule>>({})
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.schedulerListSchedules(group.name === 'default' ? undefined : group.name)
    if (res.success && res.data) {
      setSchedules(res.data)
    }
    setLoading(false)
  }, [group.name])

  useEffect(() => { loadSchedules() }, [loadSchedules])

  const loadFullSchedule = async (name: string) => {
    if (fullSchedules[name]) return
    setLoadingDetail(name)
    const res = await window.electronAPI.schedulerGetSchedule(name, group.name === 'default' ? undefined : group.name)
    if (res.success && res.data) {
      setFullSchedules(prev => ({ ...prev, [name]: res.data! }))
    }
    setLoadingDetail(null)
  }

  const handleToggleExpand = async (name: string) => {
    if (expandedSchedule === name) {
      setExpandedSchedule(null)
    } else {
      setExpandedSchedule(name)
      await loadFullSchedule(name)
    }
  }

  const handleToggleState = async (schedule: EbSchedule) => {
    const newState = schedule.state === 'ENABLED' ? 'DISABLED' : 'ENABLED'
    const full = fullSchedules[schedule.name]
    if (!full) return

    const res = await window.electronAPI.schedulerUpdateSchedule({
      name: schedule.name,
      groupName: group.name === 'default' ? undefined : group.name,
      scheduleExpression: full.scheduleExpression || '',
      scheduleExpressionTimezone: full.scheduleExpressionTimezone,
      description: full.description,
      state: newState,
      targetArn: full.targetArn || '',
      targetRoleArn: full.targetRoleArn || '',
      targetInput: full.targetInput
    })

    if (res.success) {
      setSchedules(prev => prev.map(s => s.name === schedule.name ? { ...s, state: newState } : s))
      setFullSchedules(prev => ({ ...prev, [schedule.name]: { ...prev[schedule.name], state: newState } }))
      showToast('success', `Schedule ${newState === 'ENABLED' ? 'enabled' : 'disabled'}`)
    } else {
      showToast('error', res.error || 'Failed to toggle schedule')
    }
  }

  const handleDeleteSchedule = async (name: string) => {
    setDeletingSchedule(name)
    const res = await window.electronAPI.schedulerDeleteSchedule(name, group.name === 'default' ? undefined : group.name)
    if (res.success) {
      setSchedules(prev => prev.filter(s => s.name !== name))
      if (expandedSchedule === name) setExpandedSchedule(null)
      showToast('success', `Schedule "${name}" deleted`)
    } else {
      showToast('error', res.error || 'Failed to delete schedule')
    }
    setDeletingSchedule(null)
  }

  const handleDeleteGroup = async () => {
    if (!confirm(`Delete group "${group.name}" and all its schedules?`)) return
    setDeletingGroup(true)
    const res = await window.electronAPI.schedulerDeleteGroup(group.name)
    if (res.success) {
      onDeleted()
    } else {
      showToast('error', res.error || 'Failed to delete group')
      setDeletingGroup(false)
    }
  }

  const filtered = schedules.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.state || '').toLowerCase().includes(search.toLowerCase())
  )

  const isDefault = group.name === 'default'

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-theme bg-base shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <FolderClock size={20} className="text-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-1 truncate">{group.name}</h2>
                {isDefault && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">DEFAULT</span>}
                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${group.state === 'ACTIVE' || !group.state ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {group.state || 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-3 font-mono truncate">{group.arn}</span>
                <CopyButton text={group.arn} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onCreateSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors shadow-sm"
            >
              <Plus size={13} /> New Schedule
            </button>
            {!isDefault && (
              <button
                onClick={handleDeleteGroup}
                disabled={deletingGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold btn-danger rounded-xl transition-colors"
              >
                {deletingGroup ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Delete Group
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* List Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-theme bg-raised/30 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-[11px] font-bold text-2 uppercase tracking-wider">
            <AlarmClock size={14} className="text-amber-500" />
            Schedules
            {!loading && schedules.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-base border border-theme text-3 font-mono font-normal text-[10px]">
                {schedules.length}
              </span>
            )}
          </div>
          <div className="relative w-52">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search schedules..."
              className="sidebar-search pl-7 w-full !h-7 !text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 size={24} className="animate-spin text-3" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <AlarmClock size={36} className="text-4 opacity-10 mb-3" />
              <p className="text-sm font-semibold text-3 mb-1">
                {search ? 'No matches' : 'No Schedules'}
              </p>
              <p className="text-xs text-4 mb-6">
                {search ? `No schedules matching "${search}"` : 'Create a schedule to get started.'}
              </p>
              {!search && (
                <button onClick={onCreateSchedule} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors">
                  <Plus size={13} /> Create Schedule
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 text-[10px] uppercase tracking-wider bg-raised/50 backdrop-blur-sm border-b border-theme">
                <tr>
                  <th className="px-5 py-2.5 w-8 text-4"></th>
                  <th className="px-5 py-2.5 text-3 font-bold">Name</th>
                  <th className="px-5 py-2.5 text-3 font-bold">Expression</th>
                  <th className="px-5 py-2.5 text-3 font-bold">State</th>
                  <th className="px-5 py-2.5 text-right text-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(schedule => {
                  const isExpanded = expandedSchedule === schedule.name
                  const isEnabled = schedule.state === 'ENABLED' || !schedule.state
                  const isDeleting = deletingSchedule === schedule.name
                  const full = fullSchedules[schedule.name]

                  return (
                    <>
                      <tr key={schedule.name} className={`hover:bg-raised/30 transition-colors group border-b border-theme/50 last:border-0 ${isExpanded ? 'bg-raised/10' : ''}`}>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleToggleExpand(schedule.name)}
                            className="p-1 rounded hover:bg-raised transition-colors flex items-center justify-center group"
                          >
                            <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-amber-500' : 'text-3 group-hover:text-amber-500'}`} />
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-1 break-all group-hover:text-amber-500 transition-colors">{schedule.name}</span>
                            <span className="text-[10px] text-4 font-mono break-all mt-0.5">{schedule.groupName || group.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Clock size={11} className="text-amber-500 shrink-0" />
                            <span className="text-[11px] font-mono text-2 truncate max-w-[220px]">
                              {schedule.scheduleExpression || <span className="text-4 italic">—</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={async () => { await loadFullSchedule(schedule.name); await handleToggleState(schedule) }}
                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border transition-all
                              ${isEnabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'}`}
                          >
                            {isEnabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteSchedule(schedule.name)}
                            disabled={isDeleting}
                            className="btn-ghost !p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${schedule.name}-expanded`}>
                          <td colSpan={5} className="px-6 py-5 bg-raised/20 border-b border-theme">
                            {loadingDetail === schedule.name ? (
                              <div className="flex items-center gap-2 text-3 text-xs"><Loader2 size={14} className="animate-spin" /> Loading details...</div>
                            ) : full ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-1 duration-200">
                                {/* Schedule Definition */}
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} className="text-amber-500" /> Schedule Definition
                                  </h4>
                                  <div className="bg-base rounded-xl border border-theme p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-[9px] text-4 font-bold uppercase tracking-widest mb-1">Expression</p>
                                        <p className="text-xs font-mono text-amber-500 font-bold">{full.scheduleExpression || '—'}</p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] text-4 font-bold uppercase tracking-widest mb-1">Timezone</p>
                                        <p className="text-xs font-mono text-2">{full.scheduleExpressionTimezone || 'UTC'}</p>
                                      </div>
                                    </div>
                                    {full.description && (
                                      <div>
                                        <p className="text-[9px] text-4 font-bold uppercase tracking-widest mb-1">Description</p>
                                        <p className="text-xs text-2">{full.description}</p>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                      {full.startDate && (
                                        <div>
                                          <p className="text-[9px] text-4 font-bold uppercase tracking-widest mb-1">Start Date</p>
                                          <p className="text-xs text-2">{new Date(full.startDate).toLocaleString()}</p>
                                        </div>
                                      )}
                                      {full.endDate && (
                                        <div>
                                          <p className="text-[9px] text-4 font-bold uppercase tracking-widest mb-1">End Date</p>
                                          <p className="text-xs text-2">{new Date(full.endDate).toLocaleString()}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Target */}
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
                                    <TargetIcon size={12} className="text-amber-500" /> Target
                                  </h4>
                                  <div className="bg-base rounded-xl border border-theme p-4 space-y-3">
                                    <div>
                                      <p className="text-[9px] text-4 font-bold uppercase tracking-widest mb-1">Target ARN</p>
                                      <div className="flex items-center gap-1.5 bg-raised/50 rounded-lg px-2.5 py-1.5 border border-theme/50">
                                        <p className="text-[10px] font-mono text-2 truncate flex-1">{full.targetArn || '—'}</p>
                                        {full.targetArn && <CopyButton text={full.targetArn} />}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[9px] text-4 font-bold uppercase tracking-widest mb-1">Role ARN</p>
                                      <div className="flex items-center gap-1.5 bg-raised/50 rounded-lg px-2.5 py-1.5 border border-theme/50">
                                        <p className="text-[10px] font-mono text-2 truncate flex-1">{full.targetRoleArn || '—'}</p>
                                        {full.targetRoleArn && <CopyButton text={full.targetRoleArn} />}
                                      </div>
                                    </div>
                                    {full.targetInput && (
                                      <div>
                                        <p className="text-[9px] text-4 font-bold uppercase tracking-widest mb-1">Input Payload</p>
                                        <pre className="text-[10px] font-mono text-2 p-3 bg-raised/50 rounded-lg border border-theme overflow-x-auto leading-relaxed">
                                          {(() => { try { return JSON.stringify(JSON.parse(full.targetInput), null, 2) } catch { return full.targetInput } })()}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-3 text-xs"><AlertTriangle size={14} className="text-amber-500" /> Failed to load details.</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
