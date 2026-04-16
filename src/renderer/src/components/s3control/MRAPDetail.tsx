import { useState, useEffect } from 'react'
import { Globe, Trash2, Check, Loader2, Copy, FileText, Shield } from 'lucide-react'
import type { S3ControlMRAP } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  mrap: S3ControlMRAP
  onDeleted: () => void
}

type Tab = 'details' | 'policy'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-theme last:border-0">
      <p className="text-[10px] font-bold text-4 uppercase tracking-wider w-36 shrink-0 pt-0.5">{label}</p>
      <div className={`flex items-center gap-2 flex-1 min-w-0 ${mono ? 'font-mono' : ''}`}>
        {value ? (
          <span className="text-xs text-1 break-all">{value}</span>
        ) : (
          <span className="text-xs text-4">—</span>
        )}
        {value && mono && <CopyButton text={value} />}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-4">—</span>
  const colors: Record<string, string> = {
    READY: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    CREATING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    DELETING: 'bg-red-500/10 text-red-500 border-red-500/20',
    PARTIALLY_CREATED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] ?? 'bg-raised text-3 border-theme'}`}>
      {status}
    </span>
  )
}

function DetailsTab({ mrap }: { mrap: S3ControlMRAP }) {
  return (
    <div className="p-5 overflow-auto h-full space-y-5">
      <div className="card p-5">
        <h3 className="text-xs font-bold text-2 flex items-center gap-2 uppercase tracking-wider mb-4">
          <Globe size={14} className="text-teal-500" /> MRAP Details
        </h3>
        <InfoRow label="Name" value={mrap.name} />
        <InfoRow label="Alias" value={mrap.alias} mono />
        <InfoRow label="ARN" value={mrap.arn} mono />
        <div className="flex items-start gap-4 py-2 border-b border-theme">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider w-36 shrink-0 pt-0.5">Status</p>
          <StatusBadge status={mrap.status} />
        </div>
        <InfoRow label="Created" value={mrap.createdAt ? new Date(mrap.createdAt).toLocaleString() : undefined} />
      </div>

      {mrap.regions && mrap.regions.length > 0 && (
        <div className="card p-5">
          <h3 className="text-xs font-bold text-2 flex items-center gap-2 uppercase tracking-wider mb-4">
            <Globe size={14} className="text-teal-500" /> Regions
          </h3>
          <div className="space-y-1">
            {mrap.regions.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-theme last:border-0">
                <span className="text-xs text-1 font-medium">{r.bucket}</span>
                {r.region && <span className="text-[10px] text-3 font-mono bg-raised px-1.5 py-0.5 rounded border border-theme">{r.region}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PolicyTab({ mrap }: { mrap: S3ControlMRAP }) {
  const { showToast } = useToastContext()
  const [policy, setPolicy] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadPolicy = async () => {
    setLoading(true)
    const res = await window.electronAPI.s3controlGetMRAPPolicy(mrap.name)
    if (res.success) setPolicy(res.data ?? '')
    setLoading(false)
  }

  useEffect(() => { loadPolicy() }, [mrap.name])

  const handleSave = async () => {
    if (!policy.trim()) return
    setSaving(true)
    const res = await window.electronAPI.s3controlPutMRAPPolicy(mrap.name, policy)
    setSaving(false)
    if (res.success) showToast('success', 'Policy saved successfully')
    else showToast('error', res.error ?? 'Failed to save policy')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-theme flex items-center justify-between shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <h3 className="text-sm font-bold text-1 flex items-center gap-2">
          <Shield size={16} className="text-teal-500" /> MRAP Policy
        </h3>
        <button
          onClick={handleSave}
          disabled={saving || !policy.trim()}
          className="btn-primary text-xs py-1.5 gap-1.5 disabled:opacity-50"
          style={{ backgroundColor: 'rgb(13 148 136)' }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Save Policy
        </button>
      </div>
      <div className="flex-1 p-5 overflow-auto">
        {loading ? (
          <div className="flex justify-center p-12 text-3"><Loader2 size={24} className="animate-spin" /></div>
        ) : (
          <textarea
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            placeholder={JSON.stringify({ Version: '2012-10-17', Statement: [] }, null, 2)}
            rows={24}
            className="input-base w-full text-xs font-mono resize-none leading-relaxed h-full"
            style={{ minHeight: '300px' }}
          />
        )}
      </div>
    </div>
  )
}

export default function MRAPDetail({ mrap, onDeleted }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToastContext()

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.s3controlDeleteMRAP(mrap.name)
    setDeleting(false)
    if (res.success) onDeleted()
    else showToast('error', res.error ?? 'Failed to delete MRAP')
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Details', icon: <Globe size={13} /> },
    { id: 'policy', label: 'Policy', icon: <FileText size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(13 148 136 / 0.15)' }}>
              <Globe size={18} style={{ color: 'rgb(20 184 166)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-1 truncate mb-0.5">{mrap.name}</h2>
              {mrap.alias && <p className="text-[10px] font-mono text-3 truncate">{mrap.alias}</p>}
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors shrink-0
              ${confirmDelete ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30' : 'btn-ghost text-red-500 hover:bg-red-500/10'}`}
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
        </div>

        <div className="flex items-center -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${activeTab === tab.id ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-3 hover:text-1'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'details' && <DetailsTab mrap={mrap} />}
        {activeTab === 'policy' && <PolicyTab mrap={mrap} />}
      </div>
    </div>
  )
}
