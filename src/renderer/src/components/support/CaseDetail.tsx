import { useState } from 'react'
import { LifeBuoy, CheckCircle, Loader2, Copy, Check } from 'lucide-react'
import type { SupportCase } from '../../types'

interface Props {
  supportCase: SupportCase
  onResolved: () => void
  showToast: (type: 'success' | 'error', text: string) => void
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
            {copied ? <Check size={11} className="text-sky-500" /> : <Copy size={11} />}
          </button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-raised text-4 border-theme">—</span>
  const s = status.toLowerCase()
  if (s === 'resolved' || s === 'closed') {
    return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">RESOLVED</span>
  }
  if (s === 'pending-customer-action') {
    return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">PENDING</span>
  }
  return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">{status}</span>
}

export default function CaseDetail({ supportCase, onResolved, showToast }: Props) {
  const [confirmResolve, setConfirmResolve] = useState(false)
  const [resolving, setResolving] = useState(false)

  const isResolved = supportCase.status?.toLowerCase() === 'resolved' ||
    supportCase.status?.toLowerCase() === 'closed'

  const handleResolve = async () => {
    if (!confirmResolve) { setConfirmResolve(true); return }
    setResolving(true)
    const res = await window.electronAPI.supportResolveCase(supportCase.caseId)
    setResolving(false)
    if (res.success) {
      showToast('success', `Case resolved`)
      onResolved()
    } else {
      showToast('error', res.error || 'Failed to resolve case')
      setConfirmResolve(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Header */}
      <div className="px-6 py-5 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-2xl border border-sky-500/20 bg-sky-500/10">
              <LifeBuoy size={24} className="text-sky-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-base font-bold text-1 truncate">{supportCase.subject}</h2>
                <StatusBadge status={supportCase.status} />
              </div>
              <p className="text-xs text-3 font-mono">{supportCase.displayId || supportCase.caseId}</p>
            </div>
          </div>

          {!isResolved && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-colors shrink-0
                ${confirmResolve
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                  : 'btn-ghost border border-theme'
                }`}
            >
              {resolving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              {confirmResolve ? 'Confirm Resolve' : 'Resolve'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div
          className="rounded-xl border border-theme p-5 grid grid-cols-2 gap-x-8 gap-y-5"
          style={{ backgroundColor: 'rgb(var(--bg-base))' }}
        >
          <InfoRow label="Case ID" value={supportCase.caseId} mono />
          <InfoRow label="Display ID" value={supportCase.displayId} mono />
          <InfoRow label="Status" value={supportCase.status} />
          <InfoRow label="Severity" value={supportCase.severityCode} />
          <InfoRow label="Service" value={supportCase.serviceCode} />
          <InfoRow label="Category" value={supportCase.categoryCode} />
          <InfoRow label="Submitted By" value={supportCase.submittedBy} />
          <InfoRow label="Language" value={supportCase.language} />
          <div className="col-span-2">
            <InfoRow label="Created" value={supportCase.timeCreated} />
          </div>
        </div>
      </div>
    </div>
  )
}
