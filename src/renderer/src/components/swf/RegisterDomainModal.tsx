import { useState } from 'react'
import { X, GitBranch, AlertTriangle, Loader2, Plus } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

export default function RegisterDomainModal({ onClose, onCreated, showToast }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [retentionDays, setRetentionDays] = useState('30')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Domain name is required'); return }
    const days = parseInt(retentionDays, 10)
    if (isNaN(days) || days < 1 || days > 90) {
      setError('Retention period must be between 1 and 90 days')
      return
    }
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.swfRegisterDomain(
      name.trim(),
      description.trim(),
      retentionDays
    )
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Domain "${name.trim()}" registered`)
      onCreated()
    } else {
      setError(res.error || 'Failed to register domain')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-theme shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500/15">
              <GitBranch size={16} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Register Domain</h2>
              <p className="text-[10px] text-3">Create a new SWF workflow domain</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Domain Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. my-workflow-domain"
              className="input-base w-full text-sm"
              autoFocus
            />
            <p className="text-[10px] text-4 mt-1">
              Unique name for the domain (letters, numbers, hyphens)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Workflow Execution Retention (days){' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              min={1}
              max={90}
              className="input-base w-full text-sm"
            />
            <p className="text-[10px] text-4 mt-1">How long to retain workflow execution history (1–90)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Description{' '}
              <span className="text-4 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this domain is used for..."
              rows={3}
              className="input-base w-full text-sm resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.3)' }}>
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Register Domain
          </button>
        </div>
      </div>
    </div>
  )
}
