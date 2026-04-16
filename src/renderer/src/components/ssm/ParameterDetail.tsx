import { useState, useEffect } from 'react'
import {
  SlidersHorizontal, Trash2, Loader2,
  Copy, CheckCircle2, Eye, EyeOff, Clock, Edit3, Lock, List
} from 'lucide-react'
import type { SsmParameter } from '../../types'
import EditParameterModal from './EditParameterModal'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  param: SsmParameter
  onDeleted: () => void
  onUpdated: () => void
}

type Tab = 'overview' | 'value' | 'history'

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    String: 'bg-teal-500/15 text-teal-500',
    StringList: 'bg-blue-500/15 text-blue-500',
    SecureString: 'bg-amber-500/15 text-amber-500',
  }
  const icons: Record<string, React.ReactNode> = {
    String: <SlidersHorizontal size={10} />,
    StringList: <List size={10} />,
    SecureString: <Lock size={10} />,
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${map[type] ?? 'bg-raised text-3'}`}>
      {icons[type]}{type}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors">
      {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ param }: { param: SsmParameter }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Name', value: <span className="font-mono text-xs text-1 break-all">{param.name}</span> },
    { label: 'Type', value: <TypeBadge type={param.type} /> },
    { label: 'Version', value: param.version ?? '—' },
    { label: 'Data Type', value: param.dataType ?? 'text' },
    { label: 'Tier', value: param.tier ?? 'Standard' },
    { label: 'Last Modified', value: param.lastModifiedDate ? new Date(param.lastModifiedDate).toLocaleString() : '—' },
  ]
  if (param.description) {
    rows.push({ label: 'Description', value: param.description })
  }
  if (param.arn) {
    rows.push({
      label: 'ARN',
      value: (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-2 truncate">{param.arn}</span>
          <CopyButton text={param.arn} />
        </div>
      )
    })
  }

  return (
    <div className="p-5 overflow-auto h-full">
      <div className="card p-5 space-y-4">
        {rows.map(r => (
          <div key={r.label} className="flex items-start gap-4">
            <p className="text-[10px] font-bold text-4 uppercase tracking-wider w-28 shrink-0 mt-0.5">{r.label}</p>
            <div className="flex-1 text-sm text-2">{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Value Tab ────────────────────────────────────────────────────────────────
function ValueTab({ param }: { param: SsmParameter }) {
  const [value, setValue] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const isSecure = param.type === 'SecureString'

  const load = async (decrypt: boolean) => {
    setLoading(true)
    const res = await window.electronAPI.ssmGetParameter(param.name, decrypt)
    if (res.success && res.data) {
      setValue(res.data.value ?? null)
    }
    setLoading(false)
  }

  useEffect(() => { load(false) }, [param.name])

  const handleReveal = async () => {
    if (!revealed) await load(true)
    setRevealed(r => !r)
  }

  const handleCopy = () => {
    if (value) { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  const displayValue = isSecure && !revealed ? (value ? '••••••••••••••••' : null) : value

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-bold text-4 uppercase tracking-wider flex-1">Parameter Value</span>
        {isSecure && (
          <button onClick={handleReveal} disabled={loading} className="btn-secondary text-xs py-1 px-3 gap-1.5">
            {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
            {revealed ? 'Hide' : 'Reveal'}
          </button>
        )}
        <button onClick={handleCopy} disabled={!value} className="btn-secondary text-xs py-1 px-3 gap-1.5">
          {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-3" />
        </div>
      ) : (
        <pre className="flex-1 overflow-auto input-base font-mono text-xs leading-relaxed whitespace-pre-wrap select-text p-4">
          {displayValue ?? '(empty)'}
        </pre>
      )}
    </div>
  )
}

// ── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ param }: { param: SsmParameter }) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const res = await window.electronAPI.ssmGetParameterHistory(param.name)
      if (active && res.success) setHistory(res.data ?? [])
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [param.name])

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-3" /></div>

  return (
    <div className="overflow-auto h-full pb-4">
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <Clock size={32} className="text-4 opacity-20 mb-3" />
          <p className="text-sm text-2 font-semibold">No history</p>
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.97)', backdropFilter: 'blur(4px)' }}>
            <tr>
              {['Version', 'Value', 'Type', 'Last Modified', 'Modified By'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {history.map((h, i) => (
              <tr key={i} className="hover:bg-raised/30 transition-colors">
                <td className="px-4 py-2 text-xs font-mono text-1">v{h.version}</td>
                <td className="px-4 py-2 text-xs font-mono text-2 max-w-[200px] truncate" title={h.value}>{h.value || '—'}</td>
                <td className="px-4 py-2"><TypeBadge type={h.type} /></td>
                <td className="px-4 py-2 text-xs text-3 whitespace-nowrap">{h.lastModifiedDate ? new Date(h.lastModifiedDate).toLocaleString() : '—'}</td>
                <td className="px-4 py-2 text-xs text-3">{h.lastModifiedUser || '—'}</td>
              </tr>
            ))}
            <tr><td colSpan={5} className="py-4" /></tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Main ParameterDetail ─────────────────────────────────────────────────────
export default function ParameterDetail({ param, onDeleted, onUpdated }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => { setActiveTab('overview'); setConfirmDelete(false) }, [param.name])

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.ssmDeleteParameter(param.name)
    setDeleting(false)
    if (res.success) { onDeleted() } else { showToast('error', res.error ?? 'Failed to delete'); setConfirmDelete(false) }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <SlidersHorizontal size={13} /> },
    { id: 'value', label: 'Value', icon: <Copy size={13} /> },
    { id: 'history', label: 'History', icon: <Clock size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(20 184 166 / 0.1)' }}>
              <SlidersHorizontal size={18} style={{ color: 'rgb(20 184 166)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-1 truncate font-mono">{param.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <TypeBadge type={param.type} />
                {param.version && <span className="text-[10px] text-3">v{param.version}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium btn-secondary">
              <Edit3 size={13} /> Edit
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmDelete ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30' : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'}`}>
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="flex items-center -mb-px">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${activeTab === tab.id ? 'border-teal-500 text-teal-600 dark:text-teal-300' : 'border-transparent text-3 hover:text-1'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && <OverviewTab param={param} />}
        {activeTab === 'value' && <ValueTab param={param} />}
        {activeTab === 'history' && <HistoryTab param={param} />}
      </div>

      {showEdit && (
        <EditParameterModal
          param={param}
          onClose={() => setShowEdit(false)}
          onUpdated={() => { setShowEdit(false); onUpdated(); showToast('success', 'Parameter updated') }}
        />
      )}
    </div>
  )
}
