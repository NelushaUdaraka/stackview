import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Route53HostedZone } from '../../types'

interface Props {
  onClose: () => void
  onCreated: (zone: Route53HostedZone) => void
}

export default function CreateHostedZoneModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [privateZone, setPrivateZone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim().length >= 3

  const handleCreate = async () => {
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      const result = await window.electronAPI.route53CreateHostedZone({
        name: name.trim().endsWith('.') ? name.trim() : name.trim() + '.',
        comment: comment.trim() || undefined,
        privateZone,
      })
      if (result.success && result.data) {
        onCreated(result.data)
      } else {
        setError(result.error ?? 'Failed to create hosted zone')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl border border-theme p-6"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(59 130 246 / 0.1)' }}>
              <GlobeIcon size={15} className="text-blue-400" />
            </div>
            <h2 className="text-sm font-bold text-1">Create Hosted Zone</h2>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
              Domain Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="example.com"
              className="input-base w-full"
              autoFocus
            />
            <p className="text-[10px] text-4 mt-1">A trailing dot will be added automatically.</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
              Comment
            </label>
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Optional description"
              className="input-base w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="privateZone"
              checked={privateZone}
              onChange={e => setPrivateZone(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <label htmlFor="privateZone" className="text-xs text-2 cursor-pointer select-none">
              Private hosted zone
            </label>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 break-all">
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-end pt-5 border-t border-theme mt-5">
          <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-4">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!valid || loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'rgb(59 130 246)' }}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Create Zone
          </button>
        </div>
      </div>
    </div>
  )
}

function GlobeIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
