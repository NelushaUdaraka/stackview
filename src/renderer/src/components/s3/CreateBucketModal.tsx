import { useState } from 'react'
import { X, HardDrive, Loader2 } from 'lucide-react'

interface Props {
  region: string
  onClose: () => void
  onCreated: (name: string) => void
}

const BUCKET_NAME_RE = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/

export default function CreateBucketModal({ region, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const valid = BUCKET_NAME_RE.test(name)

  const handleCreate = async () => {
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      const result = await window.electronAPI.s3CreateBucket(name, region)
      if (result.success) {
        onCreated(name)
      } else {
        setError(result.error ?? 'Failed to create bucket')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl border border-theme p-6"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <HardDrive size={15} className="text-emerald-500" />
            </div>
            <h2 className="text-sm font-bold text-1">Create Bucket</h2>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2">
            <X size={15} />
          </button>
        </div>

        {/* Name field */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
            Bucket Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value.toLowerCase()); setError('') }}
            placeholder="my-bucket-name"
            className="input-base"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && valid && !loading && handleCreate()}
          />
          <p className="text-[10px] text-3 mt-1.5 leading-relaxed">
            3–63 characters, lowercase letters, numbers, hyphens and dots only.
            Must start and end with a letter or number.
          </p>
          {name && !valid && (
            <p className="text-[10px] text-red-500 mt-1">Invalid bucket name format</p>
          )}
        </div>

        {/* Region info */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-5 text-xs text-3"
          style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
        >
          <span>Region:</span>
          <span className="font-mono text-2">{region}</span>
        </div>

        {error && (
          <p className="text-xs text-red-500 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-4">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!valid || loading}
            className="btn-primary text-xs py-1.5 px-4 gap-1.5"
            style={valid && !loading ? { backgroundColor: 'rgb(16 185 129)' } : {}}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Create Bucket
          </button>
        </div>
      </div>
    </div>
  )
}
