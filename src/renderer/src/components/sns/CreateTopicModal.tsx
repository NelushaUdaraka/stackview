import { useState } from 'react'
import { X, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  onClose: () => void
  onCreated: (arn: string) => void
}

export default function CreateTopicModal({ onClose, onCreated }: Props) {
  const { showToast } = useToastContext()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const nameError = name && !name.match(/^[a-zA-Z0-9_-]+$/)
    ? 'Name can only contain letters, numbers, hyphens (-) and underscores (_)'
    : ''

  const canSubmit = name.trim().length > 0 && !nameError

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const res = await window.electronAPI.snsCreateTopic(name.trim())
    setSubmitting(false)
    if (res.success && res.data) {
      onCreated(res.data)
    } else {
      setError(res.error ?? 'Failed to create topic')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgb(236 72 153 / 0.15)' }}>
              <MessageSquare size={16} style={{ color: 'rgb(236 72 153)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Topic</h2>
              <p className="text-[10px] text-3">Standard SNS topic</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Topic Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-notification-topic"
              className="input-base w-full text-sm font-mono"
              autoFocus
            />
            {nameError ? (
              <p className="text-[11px] text-red-500 mt-1">{nameError}</p>
            ) : (
              <p className="text-[10px] text-3 mt-1">Up to 256 alphanumeric characters, hyphens, and underscores.</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-pink-600 hover:bg-pink-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Create Topic
          </button>
        </div>
      </div>
    </div>
  )
}
