import { useState, useCallback, useEffect } from 'react'
import {
  Share2,
  RefreshCw,
  Trash2,
  Loader2,
  Plus,
  Play,
  Square,
  List,
  Copy,
  Check,
  Tag,
  Save,
  X,
} from 'lucide-react'
import type { SfnStateMachine, SfnStateMachineDetail as SfnDetail, SfnExecution } from '../../types'
import StartExecutionModal from './StartExecutionModal'
import ExecutionHistoryModal from './ExecutionHistoryModal'
import { useToastContext } from '../../contexts/ToastContext'

type Tab = 'overview' | 'executions' | 'definition'

interface Props {
  machine: SfnStateMachine
  onDeleted: () => void
}

function InfoRow({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const display = value || '—'
  const isEmpty = !value
  return (
    <div>
      <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className={`text-sm ${isEmpty ? 'text-4' : 'text-2'} ${mono ? 'font-mono text-xs' : 'font-semibold'} truncate`}>
          {display}
        </p>
        {value && (
          <button
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            className="p-0.5 rounded hover:bg-raised text-3 hover:text-1 transition-colors shrink-0"
          >
            {copied ? <Check size={11} className="text-lime-500" /> : <Copy size={11} />}
          </button>
        )}
      </div>
    </div>
  )
}

function ExecStatusBadge({ status }: { status: SfnExecution['status'] }) {
  const map: Record<SfnExecution['status'], string> = {
    RUNNING: 'text-lime-500',
    SUCCEEDED: 'text-emerald-500',
    FAILED: 'text-red-500',
    TIMED_OUT: 'text-orange-500',
    ABORTED: 'text-amber-500',
    PENDING_REDRIVE: 'text-sky-500',
  }
  return <span className={`text-[8px] font-bold uppercase ${map[status] ?? 'text-3'}`}>{status}</span>
}

export default function StateMachineDetail({ machine, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [detail, setDetail] = useState<SfnDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [executions, setExecutions] = useState<SfnExecution[]>([])
  const [loadingExecs, setLoadingExecs] = useState(false)
  const [execStatusFilter, setExecStatusFilter] = useState<SfnExecution['status'] | 'ALL'>('ALL')
  const [tags, setTags] = useState<Record<string, string>>({})
  const [loadingTags, setLoadingTags] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stoppingId, setStoppingId] = useState<string | null>(null)
  const [historyTarget, setHistoryTarget] = useState<SfnExecution | null>(null)
  const [showStartExecution, setShowStartExecution] = useState(false)

  // Definition edit
  const [editingDef, setEditingDef] = useState(false)
  const [defValue, setDefValue] = useState('')
  const [defError, setDefError] = useState('')
  const [savingDef, setSavingDef] = useState(false)

  const loadDetail = useCallback(async () => {
    setLoadingDetail(true)
    const res = await window.electronAPI.sfnDescribeStateMachine(machine.stateMachineArn)
    if (res.success && res.data) setDetail(res.data)
    setLoadingDetail(false)
  }, [machine.stateMachineArn])

  const loadExecutions = useCallback(async () => {
    setLoadingExecs(true)
    const filter = execStatusFilter === 'ALL' ? undefined : execStatusFilter
    const res = await window.electronAPI.sfnListExecutions(machine.stateMachineArn, filter)
    if (res.success && res.data) setExecutions(res.data)
    else if (!res.success) showToast('error', res.error || 'Failed to load executions')
    setLoadingExecs(false)
  }, [machine.stateMachineArn, execStatusFilter])

  const loadTags = useCallback(async () => {
    setLoadingTags(true)
    const res = await window.electronAPI.sfnListTagsForResource(machine.stateMachineArn)
    if (res.success && res.data) setTags(res.data)
    setLoadingTags(false)
  }, [machine.stateMachineArn])

  useEffect(() => {
    setActiveTab('overview')
    setDetail(null)
    setExecutions([])
    setTags({})
    setConfirmDelete(false)
    setEditingDef(false)
  }, [machine.stateMachineArn])

  useEffect(() => {
    if (activeTab === 'overview') { loadDetail(); loadTags() }
    else if (activeTab === 'executions') loadExecutions()
    else if (activeTab === 'definition') { if (!detail) loadDetail() }
  }, [activeTab])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'executions') loadExecutions()
  }, [execStatusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const res = await window.electronAPI.sfnDeleteStateMachine(machine.stateMachineArn)
    setDeleting(false)
    if (res.success) {
      showToast('success', `State machine "${machine.name}" deleted`)
      onDeleted()
    } else {
      showToast('error', res.error || 'Failed to delete state machine')
      setConfirmDelete(false)
    }
  }

  const handleStopExecution = async (exec: SfnExecution) => {
    if (stoppingId !== exec.executionArn) { setStoppingId(exec.executionArn); return }
    const res = await window.electronAPI.sfnStopExecution(exec.executionArn)
    setStoppingId(null)
    if (res.success) {
      showToast('success', `Execution "${exec.name}" stopped`)
      loadExecutions()
    } else {
      showToast('error', res.error || 'Failed to stop execution')
    }
  }

  const handleSaveDefinition = async () => {
    try { JSON.parse(defValue); setDefError('') } catch { setDefError('Invalid JSON'); return }
    setSavingDef(true)
    const res = await window.electronAPI.sfnUpdateStateMachine(machine.stateMachineArn, defValue)
    setSavingDef(false)
    if (res.success) {
      showToast('success', 'Definition updated')
      setEditingDef(false)
      loadDetail()
    } else {
      showToast('error', res.error || 'Failed to update definition')
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'executions', label: 'Executions' },
    { id: 'definition', label: 'Definition' },
  ]

  const STATUS_FILTERS: Array<SfnExecution['status'] | 'ALL'> = ['ALL', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Header */}
      <div className="px-6 py-5 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-2xl border border-lime-500/20 bg-lime-500/10">
              <Share2 size={24} className="text-lime-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg font-bold text-1 truncate">{machine.name}</h2>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border
                  ${machine.type === 'EXPRESS'
                    ? 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20'
                    : 'bg-raised text-3 border-theme'
                  }`}>
                  {machine.type}
                </span>
              </div>
              <p className="text-xs text-3 font-mono truncate">{machine.stateMachineArn}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowStartExecution(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold bg-lime-600 hover:bg-lime-500 text-white transition-colors"
            >
              <Play size={12} /> Start Execution
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-colors
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                  : 'btn-ghost border border-theme'
                }`}
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-4 -mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setConfirmDelete(false) }}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2
                ${activeTab === tab.id
                  ? 'text-lime-500 border-lime-500 bg-lime-500/5'
                  : 'text-3 border-transparent hover:text-2 hover:bg-raised'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {loadingDetail ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-3" /></div>
            ) : (
              <>
                <div className="rounded-xl border border-theme p-5 grid grid-cols-2 gap-x-8 gap-y-5" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
                  <InfoRow label="Name" value={machine.name} />
                  <InfoRow label="Type" value={machine.type} />
                  <div className="col-span-2">
                    <InfoRow label="ARN" value={machine.stateMachineArn} mono />
                  </div>
                  <InfoRow label="Status" value={detail?.status || '—'} />
                  <InfoRow label="Created" value={machine.creationDate ? new Date(machine.creationDate).toLocaleString() : undefined} />
                  <div className="col-span-2">
                    <InfoRow label="Role ARN" value={detail?.roleArn} mono />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={13} className="text-3" />
                    <span className="text-xs font-semibold text-2">Tags</span>
                    {!loadingTags && <span className="badge-gray">{Object.keys(tags).length}</span>}
                    <button onClick={loadTags} disabled={loadingTags} className="btn-ghost !px-2 !py-1 ml-auto">
                      <RefreshCw size={12} className={loadingTags ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  {Object.keys(tags).length === 0 ? (
                    <p className="text-xs text-4 italic">No tags</p>
                  ) : (
                    <div className="rounded-xl border border-theme overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
                            <th className="text-left px-4 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Key</th>
                            <th className="text-left px-4 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(tags).map(([k, v]) => (
                            <tr key={k} className="border-b border-theme last:border-0">
                              <td className="px-4 py-2 font-semibold text-1">{k}</td>
                              <td className="px-4 py-2 text-3">{v || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Executions ── */}
        {activeTab === 'executions' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Status filter */}
              <div className="flex rounded-lg border border-theme overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setExecStatusFilter(f)}
                    className={`px-2.5 py-1.5 text-[10px] font-bold transition-colors
                      ${execStatusFilter === f
                        ? f === 'ALL' ? 'bg-raised text-2' : f === 'RUNNING' ? 'bg-lime-500/15 text-lime-600 dark:text-lime-400' : f === 'SUCCEEDED' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : 'text-3 hover:text-2'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={loadExecutions} disabled={loadingExecs} className="btn-ghost !px-2 !py-1.5">
                  <RefreshCw size={13} className={loadingExecs ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setShowStartExecution(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-lime-600 hover:bg-lime-500 text-white rounded-lg transition-colors"
                >
                  <Plus size={12} /> Start Execution
                </button>
              </div>
            </div>

            {loadingExecs ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-3" /></div>
            ) : executions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Play size={24} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No executions</p>
                <p className="text-[10px] text-4 mt-1">Start an execution to see it here</p>
              </div>
            ) : (
              <div className="rounded-xl border border-theme overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Started</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Stopped</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((exec) => (
                      <tr key={exec.executionArn} className="border-b border-theme last:border-0 hover:bg-raised transition-colors">
                        <td className="px-4 py-2.5 max-w-[200px]">
                          <span className="font-semibold text-1 truncate block" title={exec.name}>{exec.name}</span>
                          <span className="text-[9px] font-mono text-4 truncate block" title={exec.executionArn}>
                            {exec.executionArn.split(':').slice(-1)[0]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5"><ExecStatusBadge status={exec.status} /></td>
                        <td className="px-4 py-2.5 text-3">
                          {exec.startDate ? new Date(exec.startDate).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-3">
                          {exec.stopDate ? new Date(exec.stopDate).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => setHistoryTarget(exec)}
                              className="btn-ghost !px-2 !py-1"
                              title="View history"
                            >
                              <List size={12} />
                            </button>
                            {exec.status === 'RUNNING' && (
                              <button
                                onClick={() => handleStopExecution(exec)}
                                className={`!px-2 !py-1 text-[10px] rounded transition-colors
                                  ${stoppingId === exec.executionArn
                                    ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 font-bold'
                                    : 'btn-ghost text-red-500'
                                  }`}
                                title={stoppingId === exec.executionArn ? 'Confirm stop' : 'Stop execution'}
                              >
                                <Square size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Definition ── */}
        {activeTab === 'definition' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-2">State Machine Definition (ASL)</span>
              <div className="flex items-center gap-2">
                <button onClick={loadDetail} disabled={loadingDetail} className="btn-ghost !px-2 !py-1.5">
                  <RefreshCw size={13} className={loadingDetail ? 'animate-spin' : ''} />
                </button>
                {!editingDef ? (
                  <button
                    onClick={() => {
                      setDefValue(detail?.definition
                        ? (() => { try { return JSON.stringify(JSON.parse(detail.definition), null, 2) } catch { return detail.definition } })()
                        : '')
                      setDefError('')
                      setEditingDef(true)
                    }}
                    className="btn-ghost !px-3 !py-1.5 text-xs font-semibold"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button onClick={() => setEditingDef(false)} className="btn-ghost !px-2 !py-1.5">
                      <X size={13} />
                    </button>
                    <button
                      onClick={handleSaveDefinition}
                      disabled={savingDef || !!defError}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-lime-600 hover:bg-lime-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingDef ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>

            {loadingDetail ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-3" /></div>
            ) : editingDef ? (
              <div>
                <textarea
                  value={defValue}
                  onChange={(e) => {
                    setDefValue(e.target.value)
                    try { JSON.parse(e.target.value); setDefError('') } catch { setDefError('Invalid JSON') }
                  }}
                  rows={28}
                  className={`input-base w-full font-mono text-xs resize-none ${defError ? 'border-red-500' : ''}`}
                  spellCheck={false}
                />
                {defError && <p className="text-[10px] text-red-500 mt-1">{defError}</p>}
              </div>
            ) : (
              <pre
                className="text-[11px] font-mono text-2 bg-base rounded-xl border border-theme p-4 overflow-auto whitespace-pre-wrap break-all"
                style={{ maxHeight: '60vh' }}
              >
                {detail?.definition
                  ? (() => { try { return JSON.stringify(JSON.parse(detail.definition), null, 2) } catch { return detail.definition } })()
                  : '—'}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showStartExecution && (
        <StartExecutionModal
          stateMachineArn={machine.stateMachineArn}
          stateMachineName={machine.name}
          onClose={() => setShowStartExecution(false)}
          onStarted={() => { setShowStartExecution(false); setActiveTab('executions') }}
        />
      )}

      {historyTarget && (
        <ExecutionHistoryModal
          executionArn={historyTarget.executionArn}
          executionName={historyTarget.name}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  )
}
