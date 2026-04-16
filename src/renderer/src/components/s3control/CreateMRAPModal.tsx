import { useState } from 'react'
import { X, Globe, Loader2, Plus, Trash2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateMRAPModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [buckets, setBuckets] = useState<string[]>([''])
  const [blockPublicAcls, setBlockPublicAcls] = useState(true)
  const [ignorePublicAcls, setIgnorePublicAcls] = useState(true)
  const [blockPublicPolicy, setBlockPublicPolicy] = useState(true)
  const [restrictPublicBuckets, setRestrictPublicBuckets] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    const validBuckets = buckets.map((b) => b.trim()).filter(Boolean)
    if (!name.trim() || validBuckets.length === 0) return
    setCreating(true)
    setError('')
    const res = await window.electronAPI.s3controlCreateMRAP(
      name.trim(),
      validBuckets.map((b) => ({ bucket: b })),
      blockPublicAcls,
      ignorePublicAcls,
      blockPublicPolicy,
      restrictPublicBuckets
    )
    setCreating(false)
    if (res.success) {
      onCreated()
    } else {
      setError(res.error ?? 'Failed to create multi-region access point')
    }
  }

  const validBuckets = buckets.map((b) => b.trim()).filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgb(0 0 0 / 0.6)' }}>
      <div className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl flex flex-col max-h-[90vh]" style={{ backgroundColor: 'rgb(var(--bg-overlay))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(13 148 136 / 0.15)' }}>
              <Globe size={16} style={{ color: 'rgb(20 184 166)' }} />
            </div>
            <h2 className="text-sm font-bold text-1">Create Multi-Region Access Point</h2>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 text-3"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-[11px] font-bold text-3 mb-1.5 ml-1">MRAP Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-multi-region-ap"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-3 ml-1">Buckets *</label>
              <button
                onClick={() => setBuckets([...buckets, ''])}
                className="flex items-center gap-1 text-[10px] text-teal-500 hover:text-teal-400 font-semibold"
              >
                <Plus size={11} /> Add Bucket
              </button>
            </div>
            <div className="space-y-2">
              {buckets.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={b}
                    onChange={(e) => {
                      const next = [...buckets]
                      next[i] = e.target.value
                      setBuckets(next)
                    }}
                    placeholder={`bucket-name-${i + 1}`}
                    className="input-base flex-1 text-sm"
                  />
                  {buckets.length > 1 && (
                    <button
                      onClick={() => setBuckets(buckets.filter((_, j) => j !== i))}
                      className="btn-ghost !p-1.5 text-red-500 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-3 mb-3 ml-1">Public Access Block</label>
            <div className="card p-4 space-y-3">
              {([
                { key: 'blockPublicAcls', label: 'Block Public ACLs', value: blockPublicAcls, set: setBlockPublicAcls },
                { key: 'ignorePublicAcls', label: 'Ignore Public ACLs', value: ignorePublicAcls, set: setIgnorePublicAcls },
                { key: 'blockPublicPolicy', label: 'Block Public Policies', value: blockPublicPolicy, set: setBlockPublicPolicy },
                { key: 'restrictPublicBuckets', label: 'Restrict Public Buckets', value: restrictPublicBuckets, set: setRestrictPublicBuckets },
              ] as const).map(({ key, label, value, set }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-2">{label}</span>
                  <button
                    onClick={() => set(!value)}
                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors
                      ${value ? 'bg-teal-500' : 'bg-raised border border-theme'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

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
            disabled={creating || !name.trim() || validBuckets.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'rgb(13 148 136)' }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            Create MRAP
          </button>
        </div>
      </div>
    </div>
  )
}
