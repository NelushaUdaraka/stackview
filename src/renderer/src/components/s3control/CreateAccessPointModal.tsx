import { useState } from 'react'
import { X, Lock, Loader2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateAccessPointModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [bucket, setBucket] = useState('')
  const [networkOrigin, setNetworkOrigin] = useState<'Internet' | 'VPC'>('Internet')
  const [vpcId, setVpcId] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim() || !bucket.trim()) return
    if (networkOrigin === 'VPC' && !vpcId.trim()) {
      setError('VPC ID is required for VPC-restricted access points.')
      return
    }
    setCreating(true)
    setError('')
    const res = await window.electronAPI.s3controlCreateAccessPoint(
      name.trim(),
      bucket.trim(),
      networkOrigin === 'VPC' ? vpcId.trim() : undefined
    )
    setCreating(false)
    if (res.success) {
      onCreated()
    } else {
      setError(res.error ?? 'Failed to create access point')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgb(0 0 0 / 0.6)' }}>
      <div className="w-full max-w-md rounded-2xl border border-theme shadow-2xl flex flex-col" style={{ backgroundColor: 'rgb(var(--bg-overlay))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(13 148 136 / 0.15)' }}>
              <Lock size={16} style={{ color: 'rgb(20 184 166)' }} />
            </div>
            <h2 className="text-sm font-bold text-1">Create Access Point</h2>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 text-3"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-bold text-3 mb-1.5 ml-1">Access Point Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-access-point"
              className="input-base w-full text-sm"
              autoFocus
            />
            <p className="text-[10px] text-4 mt-1 ml-1">Must be lowercase letters, numbers, and hyphens.</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-3 mb-1.5 ml-1">Bucket Name *</label>
            <input
              type="text"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="my-bucket"
              className="input-base w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-3 mb-1.5 ml-1">Network Origin</label>
            <div className="flex gap-3">
              {(['Internet', 'VPC'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setNetworkOrigin(opt)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors
                    ${networkOrigin === opt ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'border-theme text-3 hover:border-teal-500/50'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {networkOrigin === 'VPC' && (
            <div>
              <label className="block text-[11px] font-bold text-3 mb-1.5 ml-1">VPC ID *</label>
              <input
                type="text"
                value={vpcId}
                onChange={(e) => setVpcId(e.target.value)}
                placeholder="vpc-xxxxxxxxxxxxxxxxx"
                className="input-base w-full text-sm font-mono"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-secondary text-sm px-4">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim() || !bucket.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'rgb(13 148 136)' }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Create Access Point
          </button>
        </div>
      </div>
    </div>
  )
}
