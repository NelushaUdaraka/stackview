import { useState } from 'react'
import { Trash2, Mail, Loader2, Send, CheckCircle2, Copy, Check, Info } from 'lucide-react'
import type { SesIdentity } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  identity: SesIdentity
  onRefresh: () => void
  onDeleted: () => void
  onSendEmail: () => void
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

export default function SesIdentitiesDetail({ identity, onRefresh, onDeleted, onSendEmail }: Props) {
  const { showToast } = useToastContext()
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isVerified = identity.verificationStatus === 'Success'

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setDeleting(true)
    const res = await window.electronAPI.sesDeleteIdentity(identity.name)
    if (res.success) {
      onDeleted()
    } else {
      showToast('error', res.error || 'Failed to delete identity')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-6 border-b border-theme bg-base shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-3 rounded-2xl border ${isVerified ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
              <Mail size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-1 truncate">{identity.name}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${isVerified ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                  {identity.verificationStatus}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-500/10 text-sky-600 border border-sky-500/20">
                  {identity.type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-3 font-mono">
                {identity.name} <CopyButton text={identity.name} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSendEmail}
              disabled={!isVerified}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-sm
                ${isVerified ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-raised text-4 cursor-not-allowed opacity-50'}`}
              title={!isVerified ? 'Identity must be verified to send email' : ''}
            >
              <Send size={14} /> Send Test Email
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors min-w-[120px] justify-center
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 shadow-sm shadow-red-500/5'
                  : 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                }`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete Identity'}
            </button>
          </div>
        </div>
      </div>

      {/* Details List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="w-full space-y-6">
          {!isVerified && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-500 text-sm">
              <Info size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Verification Pending</p>
                <p className="text-amber-500/80 leading-relaxed">
                  This identity is pending verification. If it is an email address, check the inbox for a verification email from AWS. If it's a domain, ensure you have correctly added the required TXT records to your DNS settings. You cannot send emails from or to this identity until it is successfully verified (unless sandbox limits are lifted and you are sending to verified addresses).
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={13} className="text-sky-500" /> Verification Details
            </h4>
            <div className="bg-base rounded-xl border border-theme p-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-1.5">Identity Type</p>
                  <p className="text-sm text-2">{identity.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-1.5">Verification Status</p>
                  <p className={`text-sm font-semibold ${isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {identity.verificationStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
