import { useState } from 'react'
import { Mic, Copy, Check, RefreshCw, Trash2, Loader2, ExternalLink, FileText, Clock, AlertTriangle } from 'lucide-react'
import type { TranscribeJob } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  job: TranscribeJob
  onRefresh: () => void
  onDeleted: () => void
}

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

function InfoRow({ label, value, mono = false, copyable = false }: { label: string; value?: string; mono?: boolean; copyable?: boolean }) {
  const display = value || '—'
  const isEmpty = !value
  return (
    <div>
      <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-sm flex items-center gap-1.5 ${isEmpty ? 'text-4' : 'text-2'} ${mono ? 'font-mono text-xs' : 'font-semibold'}`}>
        <span className="truncate">{display}</span>
        {copyable && value && <CopyButton text={value} />}
      </p>
    </div>
  )
}

function statusStyle(status: string): { bg: string; text: string; border: string } {
  switch (status.toUpperCase()) {
    case 'COMPLETED': return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' }
    case 'IN_PROGRESS': return { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' }
    case 'QUEUED': return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' }
    case 'FAILED': return { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' }
    default: return { bg: 'bg-raised', text: 'text-3', border: 'border-theme' }
  }
}

export default function TranscribeJobDetail({ job, onRefresh, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [actioning, setActioning] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { bg, text, border } = statusStyle(job.jobStatus)
  const isCompleted = job.jobStatus.toUpperCase() === 'COMPLETED'
  const isFailed = job.jobStatus.toUpperCase() === 'FAILED'
  const isInProgress = job.jobStatus.toUpperCase() === 'IN_PROGRESS' || job.jobStatus.toUpperCase() === 'QUEUED'

  const handleRefresh = async () => {
    setRefreshing(true)
    const res = await window.electronAPI.transcribeGetJob(job.jobName)
    if (res.success) {
      onRefresh()
    } else {
      showToast('error', res.error || 'Failed to refresh job')
    }
    setRefreshing(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setActioning(true)
    const res = await window.electronAPI.transcribeDeleteJob(job.jobName)
    if (res.success) {
      showToast('success', `Job "${job.jobName}" deleted`)
      onDeleted()
    } else {
      showToast('error', res.error || 'Failed to delete job')
      setConfirmDelete(false)
    }
    setActioning(false)
  }

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-6 border-b border-theme bg-base shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-3 rounded-2xl border ${bg} ${border}`}>
              <Mic size={24} className={text} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg font-bold text-1 truncate">{job.jobName}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${bg} ${text} ${border}`}>
                  {job.jobStatus}
                </span>
              </div>
              <p className="text-xs text-3 font-mono">{job.languageCode || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isInProgress && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                Refresh Status
              </button>
            )}
            {isCompleted && job.transcriptUri && (
              <a
                href={job.transcriptUri}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              >
                <ExternalLink size={13} />
                View Transcript
              </a>
            )}
            <button
              onClick={handleDelete}
              disabled={actioning}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-colors
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 shadow-sm shadow-red-500/5'
                  : 'btn-danger bg-red-500/5 hover:bg-red-500/10 border-red-500/20'
                }`}
            >
              {actioning ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete Job'}
            </button>
          </div>
        </div>
      </div>

      {/* Failure banner */}
      {isFailed && job.failureReason && (
        <div className="mx-6 mt-4 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-500 mb-0.5">Failure Reason</p>
            <p className="text-xs text-red-400">{job.failureReason}</p>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 gap-6">

          {/* Media Info */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
              <FileText size={13} className="text-blue-500" /> Media
            </h4>
            <div className="bg-base rounded-xl border border-theme p-5 space-y-4">
              <InfoRow label="Media URI" value={job.mediaUri} mono copyable />
              <InfoRow label="Media Format" value={job.mediaFormat} />
              <InfoRow label="Language Code" value={job.languageCode} />
            </div>
          </div>

          {/* Output */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
              <FileText size={13} className="text-blue-500" /> Output
            </h4>
            <div className="bg-base rounded-xl border border-theme p-5 space-y-4">
              <InfoRow label="Transcript URI" value={job.transcriptUri} mono copyable />
              <InfoRow label="Job Status" value={job.jobStatus} />
            </div>
          </div>

          {/* Timing */}
          <div className="space-y-4 col-span-2">
            <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
              <Clock size={13} className="text-blue-500" /> Timing
            </h4>
            <div className="bg-base rounded-xl border border-theme p-5 grid grid-cols-3 gap-6">
              <InfoRow
                label="Created"
                value={job.creationTime ? new Date(job.creationTime).toLocaleString() : undefined}
              />
              <InfoRow
                label="Started"
                value={job.startTime ? new Date(job.startTime).toLocaleString() : undefined}
              />
              <InfoRow
                label="Completed"
                value={job.completionTime ? new Date(job.completionTime).toLocaleString() : undefined}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
