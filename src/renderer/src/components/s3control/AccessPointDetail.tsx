import { useState, useEffect } from 'react'
import { Lock, Trash2, Check, Loader2, Copy, FileText, Shield } from 'lucide-react'
import type { S3ControlAccessPoint } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  accessPoint: S3ControlAccessPoint
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

function DetailsTab({ accessPoint }: { accessPoint: S3ControlAccessPoint }) {
  return (
    <div className="p-5 overflow-auto h-full space-y-5">
      <div className="card p-5">
        <h3 className="text-xs font-bold text-2 flex items-center gap-2 uppercase tracking-wider mb-4">
          <Lock size={14} className="text-teal-500" /> Access Point Details
        </h3>
        <InfoRow label="Name" value={accessPoint.name} />
        <InfoRow label="Bucket" value={accessPoint.bucket} />
        <InfoRow label="ARN" value={accessPoint.accessPointArn} mono />
        <InfoRow label="Alias" value={accessPoint.alias} mono />
        <InfoRow label="Network Origin" value={accessPoint.networkOrigin} />
        {accessPoint.networkOrigin === 'VPC' && (
          <InfoRow label="VPC ID" value={accessPoint.vpcId} mono />
        )}
        <InfoRow label="Created" value={accessPoint.createdAt ? new Date(accessPoint.createdAt).toLocaleString() : undefined} />
      </div>
    </div>
  )
}

function PolicyTab({ accessPoint }: { accessPoint: S3ControlAccessPoint }) {
  const { showToast } = useToastContext()
  const [policy, setPolicy] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadPolicy = async () => {
    setLoading(true)
    const res = await window.electronAPI.s3controlGetAccessPointPolicy(accessPoint.name)
    if (res.success) setPolicy(res.data ?? '')
    setLoading(false)
  }

  useEffect(() => { loadPolicy() }, [accessPoint.name])

  const handleSave = async () => {
    if (!policy.trim()) return
    setSaving(true)
    const res = await window.electronAPI.s3controlPutAccessPointPolicy(accessPoint.name, policy)
    setSaving(false)
    if (res.success) showToast('success', 'Policy saved successfully')
    else showToast('error', res.error ?? 'Failed to save policy')
  }

  const handleDelete = async () => {
    setDeleting(true)
    const res = await window.electronAPI.s3controlDeleteAccessPointPolicy(accessPoint.name)
    setDeleting(false)
    if (res.success) { showToast('success', 'Policy deleted'); setPolicy('') }
    else showToast('error', res.error ?? 'Failed to delete policy')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-theme flex items-center justify-between shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <h3 className="text-sm font-bold text-1 flex items-center gap-2">
          <Shield size={16} className="text-teal-500" /> Access Point Policy
        </h3>
        <div className="flex items-center gap-2">
          {policy.trim() && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-ghost text-red-500 hover:bg-red-500/10 text-xs py-1.5 gap-1.5"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete
            </button>
          )}
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

export default function AccessPointDetail({ accessPoint, onDeleted }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToastContext()

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.s3controlDeleteAccessPoint(accessPoint.name)
    setDeleting(false)
    if (res.success) onDeleted()
    else showToast('error', res.error ?? 'Failed to delete access point')
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Details', icon: <Lock size={13} /> },
    { id: 'policy', label: 'Policy', icon: <FileText size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(13 148 136 / 0.15)' }}>
              <Lock size={18} style={{ color: 'rgb(20 184 166)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-1 truncate mb-0.5">{accessPoint.name}</h2>
              <p className="text-[10px] text-3 truncate">Bucket: {accessPoint.bucket}</p>
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
        {activeTab === 'details' && <DetailsTab accessPoint={accessPoint} />}
        {activeTab === 'policy' && <PolicyTab accessPoint={accessPoint} />}
      </div>
    </div>
  )
}
