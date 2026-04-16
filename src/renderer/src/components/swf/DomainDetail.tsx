import { useState, useCallback, useEffect } from 'react'
import {
  GitBranch,
  RefreshCw,
  Trash2,
  Loader2,
  Plus,
  Play,
  XCircle,
  Zap,
  List,
  Copy,
  Check,
} from 'lucide-react'
import type {
  SwfDomain,
  SwfWorkflowType,
  SwfActivityType,
  SwfExecution,
} from '../../types'
import RegisterWorkflowTypeModal from './RegisterWorkflowTypeModal'
import RegisterActivityTypeModal from './RegisterActivityTypeModal'
import StartExecutionModal from './StartExecutionModal'
import SignalExecutionModal from './SignalExecutionModal'
import ExecutionHistoryModal from './ExecutionHistoryModal'

type Tab = 'overview' | 'workflow-types' | 'activity-types' | 'executions'

interface Props {
  domain: SwfDomain
  onDeprecated: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value?: string
  mono?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const display = value || '—'
  const isEmpty = !value
  return (
    <div>
      <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <p
          className={`text-sm ${isEmpty ? 'text-4' : 'text-2'} ${
            mono ? 'font-mono text-xs' : 'font-semibold'
          } truncate`}
        >
          {display}
        </p>
        {value && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(value)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
            className="p-0.5 rounded hover:bg-raised text-3 hover:text-1 transition-colors shrink-0"
          >
            {copied ? (
              <Check size={11} className="text-green-500" />
            ) : (
              <Copy size={11} />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'DEPRECATED') {
    return (
      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
        DEPRECATED
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
      REGISTERED
    </span>
  )
}

function TypeStatusBadge({ status }: { status: string }) {
  return status === 'DEPRECATED' ? (
    <span className="text-[8px] font-bold uppercase text-amber-500">DEPRECATED</span>
  ) : (
    <span className="text-[8px] font-bold uppercase text-green-500">REGISTERED</span>
  )
}

function ExecStatusBadge({ execution }: { execution: SwfExecution }) {
  if (execution.executionStatus === 'OPEN') {
    return (
      <span className="text-[8px] font-bold uppercase text-green-500">OPEN</span>
    )
  }
  const cs = execution.closeStatus ?? 'CLOSED'
  const colors: Record<string, string> = {
    COMPLETED: 'text-emerald-500',
    FAILED: 'text-red-500',
    CANCELED: 'text-amber-500',
    TERMINATED: 'text-red-400',
    TIMED_OUT: 'text-orange-500',
    CONTINUED_AS_NEW: 'text-blue-500',
  }
  return (
    <span className={`text-[8px] font-bold uppercase ${colors[cs] ?? 'text-3'}`}>{cs}</span>
  )
}

// ── Domain Detail ─────────────────────────────────────────────────────────────

export default function DomainDetail({ domain, onDeprecated, showToast }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [workflowTypes, setWorkflowTypes] = useState<SwfWorkflowType[]>([])
  const [activityTypes, setActivityTypes] = useState<SwfActivityType[]>([])
  const [openExecutions, setOpenExecutions] = useState<SwfExecution[]>([])
  const [closedExecutions, setClosedExecutions] = useState<SwfExecution[]>([])
  const [execView, setExecView] = useState<'open' | 'closed'>('open')

  const [loadingTypes, setLoadingTypes] = useState(false)
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [loadingExecs, setLoadingExecs] = useState(false)
  const [deprecating, setDeprecating] = useState(false)
  const [confirmDeprecate, setConfirmDeprecate] = useState(false)

  const [showRegisterWorkflow, setShowRegisterWorkflow] = useState(false)
  const [showRegisterActivity, setShowRegisterActivity] = useState(false)
  const [showStartExecution, setShowStartExecution] = useState(false)
  const [signalTarget, setSignalTarget] = useState<SwfExecution | null>(null)
  const [historyTarget, setHistoryTarget] = useState<SwfExecution | null>(null)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const loadWorkflowTypes = useCallback(async () => {
    setLoadingTypes(true)
    const [reg, dep] = await Promise.all([
      window.electronAPI.swfListWorkflowTypes(domain.name, 'REGISTERED'),
      window.electronAPI.swfListWorkflowTypes(domain.name, 'DEPRECATED'),
    ])
    const all: SwfWorkflowType[] = [
      ...(reg.success && reg.data ? reg.data : []),
      ...(dep.success && dep.data ? dep.data : []),
    ]
    setWorkflowTypes(all)
    setLoadingTypes(false)
  }, [domain.name])

  const loadActivityTypes = useCallback(async () => {
    setLoadingActivities(true)
    const [reg, dep] = await Promise.all([
      window.electronAPI.swfListActivityTypes(domain.name, 'REGISTERED'),
      window.electronAPI.swfListActivityTypes(domain.name, 'DEPRECATED'),
    ])
    const all: SwfActivityType[] = [
      ...(reg.success && reg.data ? reg.data : []),
      ...(dep.success && dep.data ? dep.data : []),
    ]
    setActivityTypes(all)
    setLoadingActivities(false)
  }, [domain.name])

  const loadExecutions = useCallback(async () => {
    setLoadingExecs(true)
    const [openRes, closedRes] = await Promise.all([
      window.electronAPI.swfListOpenExecutions(domain.name),
      window.electronAPI.swfListClosedExecutions(domain.name),
    ])
    if (openRes.success && openRes.data) setOpenExecutions(openRes.data)
    if (closedRes.success && closedRes.data) setClosedExecutions(closedRes.data)
    setLoadingExecs(false)
  }, [domain.name])

  useEffect(() => {
    setActiveTab('overview')
    setWorkflowTypes([])
    setActivityTypes([])
    setOpenExecutions([])
    setClosedExecutions([])
  }, [domain.name])

  useEffect(() => {
    if (activeTab === 'workflow-types') loadWorkflowTypes()
    else if (activeTab === 'activity-types') loadActivityTypes()
    else if (activeTab === 'executions') loadExecutions()
  }, [activeTab, loadWorkflowTypes, loadActivityTypes, loadExecutions])

  const handleDeprecateDomain = async () => {
    if (!confirmDeprecate) { setConfirmDeprecate(true); return }
    setDeprecating(true)
    const res = await window.electronAPI.swfDeprecateDomain(domain.name)
    setDeprecating(false)
    if (res.success) {
      showToast('success', `Domain "${domain.name}" deprecated`)
      onDeprecated()
    } else {
      showToast('error', res.error || 'Failed to deprecate domain')
      setConfirmDeprecate(false)
    }
  }

  const handleDeprecateWorkflowType = async (name: string, version: string) => {
    const res = await window.electronAPI.swfDeprecateWorkflowType(domain.name, name, version)
    if (res.success) {
      showToast('success', `Workflow type "${name}" v${version} deprecated`)
      loadWorkflowTypes()
    } else {
      showToast('error', res.error || 'Failed to deprecate workflow type')
    }
  }

  const handleDeprecateActivityType = async (name: string, version: string) => {
    const res = await window.electronAPI.swfDeprecateActivityType(domain.name, name, version)
    if (res.success) {
      showToast('success', `Activity type "${name}" v${version} deprecated`)
      loadActivityTypes()
    } else {
      showToast('error', res.error || 'Failed to deprecate activity type')
    }
  }

  const handleTerminate = async (exec: SwfExecution) => {
    const key = `${exec.workflowId}:${exec.runId}`
    if (terminatingId !== key) { setTerminatingId(key); return }
    const res = await window.electronAPI.swfTerminateExecution(
      domain.name,
      exec.workflowId,
      exec.runId
    )
    setTerminatingId(null)
    if (res.success) {
      showToast('success', `Execution "${exec.workflowId}" terminated`)
      loadExecutions()
    } else {
      showToast('error', res.error || 'Failed to terminate execution')
    }
  }

  const handleRequestCancel = async (exec: SwfExecution) => {
    const key = `${exec.workflowId}:${exec.runId}`
    if (cancelingId !== key) { setCancelingId(key); return }
    const res = await window.electronAPI.swfRequestCancelExecution(
      domain.name,
      exec.workflowId,
      exec.runId
    )
    setCancelingId(null)
    if (res.success) {
      showToast('success', `Cancel requested for "${exec.workflowId}"`)
      loadExecutions()
    } else {
      showToast('error', res.error || 'Failed to request cancel')
    }
  }

  const isDeprecated = domain.status === 'DEPRECATED'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'workflow-types', label: 'Workflow Types' },
    { id: 'activity-types', label: 'Activity Types' },
    { id: 'executions', label: 'Executions' },
  ]

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Header */}
      <div
        className="px-6 py-5 border-b border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-2xl border border-green-500/20 bg-green-500/10">
              <GitBranch size={24} className="text-green-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg font-bold text-1 truncate">{domain.name}</h2>
                <StatusBadge status={domain.status} />
              </div>
              <p className="text-xs text-3">
                {domain.description || 'No description'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isDeprecated && (
              <button
                onClick={handleDeprecateDomain}
                disabled={deprecating}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-colors
                  ${confirmDeprecate
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    : 'btn-ghost border border-theme'
                  }`}
              >
                {deprecating ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {confirmDeprecate ? 'Confirm Deprecate' : 'Deprecate'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 -mb-5 border-b-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setConfirmDeprecate(false) }}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2
                ${activeTab === tab.id
                  ? 'text-green-500 border-green-500 bg-green-500/5'
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
            <div
              className="rounded-xl border border-theme p-5 grid grid-cols-2 gap-x-8 gap-y-5"
              style={{ backgroundColor: 'rgb(var(--bg-base))' }}
            >
              <InfoRow label="Domain Name" value={domain.name} />
              <InfoRow label="Status" value={domain.status} />
              <InfoRow label="ARN" value={domain.arn} mono />
              <InfoRow
                label="Retention Period"
                value={
                  domain.workflowExecutionRetentionPeriodInDays
                    ? `${domain.workflowExecutionRetentionPeriodInDays} days`
                    : undefined
                }
              />
              <div className="col-span-2">
                <InfoRow label="Description" value={domain.description} />
              </div>
            </div>
          </div>
        )}

        {/* ── Workflow Types ── */}
        {activeTab === 'workflow-types' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-2">
                  Workflow Types
                </span>
                {!loadingTypes && (
                  <span className="badge-gray">{workflowTypes.length}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadWorkflowTypes}
                  disabled={loadingTypes}
                  className="btn-ghost !px-2 !py-1.5"
                >
                  <RefreshCw size={13} className={loadingTypes ? 'animate-spin' : ''} />
                </button>
                {!isDeprecated && (
                  <button
                    onClick={() => setShowRegisterWorkflow(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                  >
                    <Plus size={12} /> Register Type
                  </button>
                )}
              </div>
            </div>

            {loadingTypes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-3" />
              </div>
            ) : workflowTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GitBranch size={24} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No workflow types</p>
                <p className="text-[10px] text-4 mt-1">Register a workflow type to get started</p>
              </div>
            ) : (
              <div
                className="rounded-xl border border-theme overflow-hidden"
                style={{ backgroundColor: 'rgb(var(--bg-base))' }}
              >
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="border-b border-theme"
                      style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
                    >
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Version</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Created</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {workflowTypes.map((t) => (
                      <tr
                        key={`${t.name}:${t.version}`}
                        className="border-b border-theme last:border-0 hover:bg-raised transition-colors"
                      >
                        <td className="px-4 py-2.5 font-semibold text-1">{t.name}</td>
                        <td className="px-4 py-2.5 font-mono text-3">{t.version}</td>
                        <td className="px-4 py-2.5"><TypeStatusBadge status={t.status} /></td>
                        <td className="px-4 py-2.5 text-3">
                          {t.creationDate
                            ? new Date(t.creationDate).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-3 max-w-[180px] truncate">
                          {t.description || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {t.status === 'REGISTERED' && !isDeprecated && (
                            <button
                              onClick={() => handleDeprecateWorkflowType(t.name, t.version)}
                              className="btn-ghost !px-2 !py-1 text-[10px]"
                            >
                              Deprecate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Activity Types ── */}
        {activeTab === 'activity-types' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-2">Activity Types</span>
                {!loadingActivities && (
                  <span className="badge-gray">{activityTypes.length}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadActivityTypes}
                  disabled={loadingActivities}
                  className="btn-ghost !px-2 !py-1.5"
                >
                  <RefreshCw size={13} className={loadingActivities ? 'animate-spin' : ''} />
                </button>
                {!isDeprecated && (
                  <button
                    onClick={() => setShowRegisterActivity(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                  >
                    <Plus size={12} /> Register Type
                  </button>
                )}
              </div>
            </div>

            {loadingActivities ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-3" />
              </div>
            ) : activityTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GitBranch size={24} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No activity types</p>
                <p className="text-[10px] text-4 mt-1">Register an activity type to get started</p>
              </div>
            ) : (
              <div
                className="rounded-xl border border-theme overflow-hidden"
                style={{ backgroundColor: 'rgb(var(--bg-base))' }}
              >
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="border-b border-theme"
                      style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
                    >
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Version</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Created</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {activityTypes.map((t) => (
                      <tr
                        key={`${t.name}:${t.version}`}
                        className="border-b border-theme last:border-0 hover:bg-raised transition-colors"
                      >
                        <td className="px-4 py-2.5 font-semibold text-1">{t.name}</td>
                        <td className="px-4 py-2.5 font-mono text-3">{t.version}</td>
                        <td className="px-4 py-2.5"><TypeStatusBadge status={t.status} /></td>
                        <td className="px-4 py-2.5 text-3">
                          {t.creationDate
                            ? new Date(t.creationDate).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-3 max-w-[180px] truncate">
                          {t.description || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {t.status === 'REGISTERED' && !isDeprecated && (
                            <button
                              onClick={() => handleDeprecateActivityType(t.name, t.version)}
                              className="btn-ghost !px-2 !py-1 text-[10px]"
                            >
                              Deprecate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Executions ── */}
        {activeTab === 'executions' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Open / Closed toggle */}
                <div
                  className="flex rounded-lg border border-theme overflow-hidden"
                  style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
                >
                  {(['open', 'closed'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setExecView(v)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors
                        ${execView === v
                          ? v === 'open'
                            ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                            : 'bg-raised text-2'
                          : 'text-3 hover:text-2'
                        }`}
                    >
                      {v === 'open'
                        ? `Open (${openExecutions.length})`
                        : `Closed (${closedExecutions.length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadExecutions}
                  disabled={loadingExecs}
                  className="btn-ghost !px-2 !py-1.5"
                >
                  <RefreshCw size={13} className={loadingExecs ? 'animate-spin' : ''} />
                </button>
                {!isDeprecated && (
                  <button
                    onClick={() => setShowStartExecution(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                  >
                    <Play size={12} /> Start Execution
                  </button>
                )}
              </div>
            </div>

            {loadingExecs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-3" />
              </div>
            ) : (
              (() => {
                const execs = execView === 'open' ? openExecutions : closedExecutions
                if (execs.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Play size={24} className="text-4 mb-2 opacity-20" />
                      <p className="text-xs text-3 font-medium">
                        No {execView} executions
                      </p>
                      <p className="text-[10px] text-4 mt-1">
                        {execView === 'open'
                          ? 'Start an execution to see it here'
                          : 'Completed executions appear here'}
                      </p>
                    </div>
                  )
                }
                return (
                  <div
                    className="rounded-xl border border-theme overflow-hidden"
                    style={{ backgroundColor: 'rgb(var(--bg-base))' }}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr
                          className="border-b border-theme"
                          style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
                        >
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Workflow ID</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Type</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Started</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-4 uppercase tracking-wider">Closed</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {execs.map((exec) => {
                          const key = `${exec.workflowId}:${exec.runId}`
                          return (
                            <tr
                              key={key}
                              className="border-b border-theme last:border-0 hover:bg-raised transition-colors"
                            >
                              <td className="px-4 py-2.5 font-semibold text-1 max-w-[160px]">
                                <span className="truncate block" title={exec.workflowId}>
                                  {exec.workflowId}
                                </span>
                                <span className="text-[9px] font-mono text-4 truncate block" title={exec.runId}>
                                  {exec.runId.slice(0, 8)}…
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-3">
                                {exec.workflowType
                                  ? `${exec.workflowType.name} v${exec.workflowType.version}`
                                  : '—'}
                              </td>
                              <td className="px-4 py-2.5">
                                <ExecStatusBadge execution={exec} />
                              </td>
                              <td className="px-4 py-2.5 text-3">
                                {exec.startTimestamp
                                  ? new Date(exec.startTimestamp).toLocaleString()
                                  : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-3">
                                {exec.closeTimestamp
                                  ? new Date(exec.closeTimestamp).toLocaleString()
                                  : '—'}
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
                                  {exec.executionStatus === 'OPEN' && (
                                    <>
                                      <button
                                        onClick={() => setSignalTarget(exec)}
                                        className="btn-ghost !px-2 !py-1"
                                        title="Signal execution"
                                      >
                                        <Zap size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleRequestCancel(exec)}
                                        className={`!px-2 !py-1 text-[10px] rounded transition-colors
                                          ${cancelingId === key
                                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-bold'
                                            : 'btn-ghost'
                                          }`}
                                        title="Request cancel"
                                      >
                                        <XCircle size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleTerminate(exec)}
                                        className={`!px-2 !py-1 text-[10px] rounded transition-colors
                                          ${terminatingId === key
                                            ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 font-bold'
                                            : 'btn-ghost text-red-500'
                                          }`}
                                        title={terminatingId === key ? 'Confirm terminate' : 'Terminate'}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showRegisterWorkflow && (
        <RegisterWorkflowTypeModal
          domain={domain.name}
          onClose={() => setShowRegisterWorkflow(false)}
          onCreated={() => { setShowRegisterWorkflow(false); loadWorkflowTypes() }}
          showToast={showToast}
        />
      )}

      {showRegisterActivity && (
        <RegisterActivityTypeModal
          domain={domain.name}
          onClose={() => setShowRegisterActivity(false)}
          onCreated={() => { setShowRegisterActivity(false); loadActivityTypes() }}
          showToast={showToast}
        />
      )}

      {showStartExecution && (
        <StartExecutionModal
          domain={domain.name}
          workflowTypes={workflowTypes}
          onClose={() => setShowStartExecution(false)}
          onStarted={() => { setShowStartExecution(false); loadExecutions(); setActiveTab('executions') }}
          showToast={showToast}
        />
      )}

      {signalTarget && (
        <SignalExecutionModal
          domain={domain.name}
          workflowId={signalTarget.workflowId}
          runId={signalTarget.runId}
          onClose={() => setSignalTarget(null)}
          onSignaled={() => setSignalTarget(null)}
          showToast={showToast}
        />
      )}

      {historyTarget && (
        <ExecutionHistoryModal
          domain={domain.name}
          workflowId={historyTarget.workflowId}
          runId={historyTarget.runId}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  )
}
