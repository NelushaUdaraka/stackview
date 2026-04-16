import { useState, useEffect } from 'react'
import yaml from 'js-yaml'
import {
  LayoutTemplate, Trash2, Check, AlertTriangle, Loader2,
  Package, Clock, FileCode, BarChart3, Copy, CheckCircle2, Edit3
} from 'lucide-react'
import { getStatusColor } from './CloudFormationSidebar'
import UpdateStackModal from './UpdateStackModal'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  stackName: string
  onDeleted: () => void
  onUpdated: () => void
}

type Tab = 'overview' | 'resources' | 'events' | 'template'

const FAILED_STATUSES = [
  'CREATE_FAILED', 'UPDATE_FAILED', 'DELETE_FAILED',
  'ROLLBACK_COMPLETE', 'ROLLBACK_FAILED',
  'UPDATE_ROLLBACK_COMPLETE', 'UPDATE_ROLLBACK_FAILED',
]

export default function StackDetail({ stackName, onDeleted, onUpdated }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  // Top-level status fetch for the failure banner
  const [stackStatus, setStackStatus] = useState<string | null>(null)
  const [stackStatusReason, setStackStatusReason] = useState<string | null>(null)
  const [failedEvents, setFailedEvents] = useState<{ resource: string; type: string; reason: string; time: string }[]>([])

  const loadMeta = async () => {
    const [descRes, evtRes] = await Promise.all([
      window.electronAPI.cfnDescribeStack(stackName),
      window.electronAPI.cfnDescribeStackEvents(stackName),
    ])
    if (descRes.success && descRes.data) {
      const s = descRes.data
      setStackStatus(s.StackStatus ?? null)
      setStackStatusReason(s.StackStatusReason ?? null)
    }
    if (evtRes.success && evtRes.data) {
      // Collect all resource-level failures (not the stack itself)
      const failed = (evtRes.data as any[]).filter(
        e => e.ResourceStatus?.includes('FAILED') && e.LogicalResourceId !== stackName
      ).map(e => ({
        resource: e.LogicalResourceId ?? '?',
        type: e.ResourceType ?? '',
        reason: e.ResourceStatusReason ?? '',
        time: e.Timestamp ? new Date(e.Timestamp).toLocaleTimeString() : '',
      }))
      setFailedEvents(failed)
    }
  }

  useEffect(() => {
    setActiveTab('overview')
    setConfirmDelete(false)
    setStackStatus(null)
    setStackStatusReason(null)
    setFailedEvents([])
    loadMeta()
  }, [stackName])

  const isFailed = stackStatus ? FAILED_STATUSES.includes(stackStatus) : false

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.cfnDeleteStack(stackName)
    setDeleting(false)
    if (res.success) { onDeleted() } else { showToast('error', res.error ?? 'Failed to delete stack'); setConfirmDelete(false) }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={13} /> },
    { id: 'resources', label: 'Resources', icon: <Package size={13} /> },
    { id: 'events', label: 'Events', icon: <Clock size={13} /> },
    { id: 'template', label: 'Template', icon: <FileCode size={13} /> },
  ]


  return (
    <div className="flex flex-col h-full relative">
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(249 115 22 / 0.1)' }}>
              <LayoutTemplate size={18} style={{ color: 'rgb(249 115 22)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-1 truncate">{stackName}</h2>
              <p className="text-xs text-3 mt-0.5 font-mono">CloudFormation Stack</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowUpdateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium btn-secondary"
            >
              <Edit3 size={13} /> Update
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmDelete ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30' : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'}`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="flex items-center -mb-px">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${activeTab === tab.id ? 'border-orange-500 text-orange-600 dark:text-orange-300' : 'border-transparent text-3 hover:text-1'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Failure banner — visible across all tabs */}
      {isFailed && (
        <div className="mx-4 mt-3 mb-3 shrink-0 rounded-xl border border-red-500/30 p-3.5 space-y-3" style={{ backgroundColor: 'rgb(239 68 68 / 0.06)' }}>
          {/* Header row */}
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">{stackStatus}</span>
            <button
              onClick={() => setActiveTab('events')}
              className="ml-auto text-[10px] font-semibold text-red-500 underline underline-offset-2 hover:text-red-400 transition-colors"
            >
              View all events →
            </button>
          </div>

          {/* Stack-level reason */}
          {stackStatusReason && (
            <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed pl-5">
              {stackStatusReason}
            </p>
          )}

          {/* Failed resources */}
          {failedEvents.length > 0 && (
            <div className="pl-5 space-y-2">
              <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-wider">
                Failed resources ({failedEvents.length})
              </p>
              <div className="space-y-1.5">
                {failedEvents.map((fe, i) => (
                  <div key={i} className="rounded-lg border border-red-500/20 p-2.5 space-y-1" style={{ backgroundColor: 'rgb(239 68 68 / 0.06)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 font-mono">{fe.resource}</span>
                      {fe.type && <span className="text-[10px] text-red-400/70 font-mono">{fe.type}</span>}
                      {fe.time && <span className="ml-auto text-[10px] text-red-400/60">{fe.time}</span>}
                    </div>
                    {fe.reason && (
                      <p className="text-[11px] text-red-500/80 leading-relaxed">{fe.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && <OverviewTab stackName={stackName} showToast={showToast} />}
        {activeTab === 'resources' && <ResourcesTab stackName={stackName} showToast={showToast} />}
        {activeTab === 'events' && <EventsTab stackName={stackName} showToast={showToast} />}
        {activeTab === 'template' && <TemplateTab stackName={stackName} showToast={showToast} />}
      </div>

      {showUpdateModal && (
        <UpdateStackModal
          stackName={stackName}
          onClose={() => setShowUpdateModal(false)}
          onUpdated={() => { setShowUpdateModal(false); onUpdated(); showToast('success', 'Stack update initiated') }}
        />
      )}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors">
      {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  )
}

function OverviewTab({ stackName, showToast }: { stackName: string, showToast: any }) {
  const [stack, setStack] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const res = await window.electronAPI.cfnDescribeStack(stackName)
      if (active) {
        if (res.success) setStack(res.data)
        else showToast('error', res.error || 'Failed to describe stack')
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [stackName])

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-3" /></div>
  if (!stack) return null

  return (
    <div className="p-5 overflow-y-auto h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4 space-y-3 border-theme">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Identity</p>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Stack Name</p>
            <p className="text-sm font-mono text-1">{stack.StackName}</p>
          </div>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Status</p>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${getStatusColor(stack.StackStatus ?? '')}`}>{stack.StackStatus}</span>
          </div>
          {stack.StackStatusReason && (
            <div>
              <p className="text-[10px] text-3 mb-0.5">Status Reason</p>
              <p className="text-xs text-2 leading-relaxed">{stack.StackStatusReason}</p>
            </div>
          )}
          <div className="group">
            <p className="text-[10px] text-3 mb-0.5">Stack ID</p>
            <div className="flex items-start gap-2">
              <p className="text-[10px] font-mono text-2 break-all leading-relaxed">{stack.StackId}</p>
              {stack.StackId && <div className="shrink-0"><CopyButton text={stack.StackId} /></div>}
            </div>
          </div>
        </div>

        {(stack.Parameters?.length > 0) && (
          <div className="card p-4 border-theme">
            <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-3">Parameters</p>
            <div className="space-y-2">
              {stack.Parameters.map((p: any) => (
                <div key={p.ParameterKey} className="flex flex-col">
                  <span className="text-[10px] text-3">{p.ParameterKey}</span>
                  <span className="text-xs font-mono text-1">{p.ParameterValue ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(stack.Outputs?.length > 0) && (
          <div className="card p-4 border-theme">
            <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-3">Outputs</p>
            <div className="space-y-2">
              {stack.Outputs.map((o: any) => (
                <div key={o.OutputKey} className="flex flex-col">
                  <span className="text-[10px] text-3">{o.OutputKey}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-1 truncate">{o.OutputValue}</span>
                    {o.OutputValue && <CopyButton text={o.OutputValue} />}
                  </div>
                  {o.Description && <span className="text-[10px] text-3 mt-0.5">{o.Description}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-4 space-y-3 border-theme">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Timestamps</p>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Created</p>
            <p className="text-xs text-1">{stack.CreationTime ? new Date(stack.CreationTime).toLocaleString() : '—'}</p>
          </div>
          {stack.LastUpdatedTime && (
            <div>
              <p className="text-[10px] text-3 mb-0.5">Last Updated</p>
              <p className="text-xs text-1">{new Date(stack.LastUpdatedTime).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResourcesTab({ stackName, showToast }: { stackName: string, showToast: any }) {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const res = await window.electronAPI.cfnDescribeStackResources(stackName)
      if (active) {
        if (res.success) setResources(res.data ?? [])
        else showToast('error', res.error || 'Failed to load resources')
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [stackName])

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-3" /></div>

  return (
    <div className="overflow-auto h-full pb-4">
      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <Package size={32} className="text-4 opacity-20 mb-3" />
          <p className="text-sm text-2 font-semibold">No resources</p>
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.95)', backdropFilter: 'blur(4px)' }}>
            <tr>
              {['Logical ID', 'Type', 'Physical ID', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {resources.map((r, i) => (
              <tr key={i} className="hover:bg-raised/30 transition-colors group">
                <td className="px-4 py-2 text-xs font-mono text-1">{r.LogicalResourceId}</td>
                <td className="px-4 py-2 text-xs text-2">{r.ResourceType}</td>
                <td className="px-4 py-2 text-xs font-mono text-2">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]" title={r.PhysicalResourceId}>{r.PhysicalResourceId || '—'}</span>
                    {r.PhysicalResourceId && <div className="opacity-0 group-hover:opacity-100"><CopyButton text={r.PhysicalResourceId} /></div>}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(r.ResourceStatus ?? '')}`}>{r.ResourceStatus}</span>
                </td>
              </tr>
            ))}
            {/* bottom padding row */}
            <tr><td colSpan={4} className="py-4" /></tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

function EventsTab({ stackName, showToast }: { stackName: string, showToast: any }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const res = await window.electronAPI.cfnDescribeStackEvents(stackName)
      if (active) {
        if (res.success) setEvents(res.data ?? [])
        else showToast('error', res.error || 'Failed to load events')
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [stackName])

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-3" /></div>

  return (
    <div className="overflow-auto h-full pb-4">
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <Clock size={32} className="text-4 opacity-20 mb-3" />
          <p className="text-sm text-2 font-semibold">No events</p>
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.95)', backdropFilter: 'blur(4px)' }}>
            <tr>
              {['Timestamp', 'Logical ID', 'Type', 'Status', 'Reason'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {events.map((e, i) => (
              <tr key={i} className={`hover:bg-raised/30 transition-colors ${e.ResourceStatus?.includes('FAILED') ? 'bg-red-500/5' : ''}`}>
                <td className="px-4 py-2 text-xs text-3 whitespace-nowrap">{e.Timestamp ? new Date(e.Timestamp).toLocaleString() : '—'}</td>
                <td className="px-4 py-2 text-xs font-mono text-1">{e.LogicalResourceId}</td>
                <td className="px-4 py-2 text-xs text-2">{e.ResourceType}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(e.ResourceStatus ?? '')}`}>{e.ResourceStatus}</span>
                </td>
                <td className="px-4 py-2 text-xs text-3 max-w-[240px]" title={e.ResourceStatusReason}>
                  <span className={`${e.ResourceStatus?.includes('FAILED') ? 'text-red-500' : ''} leading-snug block`}>
                    {e.ResourceStatusReason || '—'}
                  </span>
                </td>
              </tr>
            ))}
            {/* bottom padding row */}
            <tr><td colSpan={5} className="py-4" /></tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

// Detect if the raw template looks like JSON
function isJson(raw: string): boolean {
  const t = raw.trimStart()
  return t.startsWith('{') || t.startsWith('[')
}

// Convert raw template (JSON or YAML) to formatted JSON string
function toJsonView(raw: string): string {
  try {
    // Try direct JSON parse
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    try {
      // It's YAML — parse then re-serialise as JSON
      return JSON.stringify(yaml.load(raw), null, 2)
    } catch {
      return raw
    }
  }
}

// Convert raw template (JSON or YAML) to formatted YAML string
function toYamlView(raw: string): string {
  try {
    if (isJson(raw)) {
      // JSON → YAML
      return yaml.dump(JSON.parse(raw), { indent: 2, lineWidth: -1 })
    }
    // Already YAML — re-dump for consistent formatting
    return yaml.dump(yaml.load(raw), { indent: 2, lineWidth: -1 })
  } catch {
    return raw
  }
}

function TemplateTab({ stackName, showToast }: { stackName: string, showToast: any }) {
  const [rawTemplate, setRawTemplate] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [viewFormat, setViewFormat] = useState<'json' | 'yaml'>('json')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const res = await window.electronAPI.cfnGetTemplate(stackName)
      if (active) {
        if (res.success && res.data) {
          setRawTemplate(res.data)
          // Default to YAML view if template is YAML, JSON if JSON
          setViewFormat(isJson(res.data) ? 'json' : 'yaml')
        } else {
          showToast('error', res.error || 'Failed to load template')
        }
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [stackName])

  const displayedTemplate = viewFormat === 'json' ? toJsonView(rawTemplate) : toYamlView(rawTemplate)

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedTemplate)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-3" /></div>

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-bold text-4 uppercase tracking-wider flex-1">Template Body</span>

        {/* Format toggle */}
        <div className="flex items-center rounded-lg border border-theme overflow-hidden">
          <button
            onClick={() => setViewFormat('yaml')}
            className={`px-3 py-1 text-xs font-semibold transition-colors
              ${viewFormat === 'yaml' ? 'bg-orange-500/15 text-orange-500' : 'text-3 hover:text-1 hover:bg-raised'}`}
          >
            YAML
          </button>
          <div className="w-px h-4 bg-theme" />
          <button
            onClick={() => setViewFormat('json')}
            className={`px-3 py-1 text-xs font-semibold transition-colors
              ${viewFormat === 'json' ? 'bg-orange-500/15 text-orange-500' : 'text-3 hover:text-1 hover:bg-raised'}`}
          >
            JSON
          </button>
        </div>

        <button onClick={handleCopy} className="btn-secondary text-xs py-1 px-3 gap-1.5">
          {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="flex-1 overflow-auto input-base font-mono text-xs leading-relaxed whitespace-pre select-text p-4">
        {displayedTemplate || '(empty)'}
      </pre>
    </div>
  )
}
