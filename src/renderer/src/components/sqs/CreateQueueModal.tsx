import { useState } from 'react'
import { X, Plus, Loader2, AlertCircle, Info } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: (url: string) => void
}

export default function CreateQueueModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [isFifo, setIsFifo] = useState(false)
  const [contentBasedDedup, setContentBasedDedup] = useState(false)
  const [visibilityTimeout, setVisibilityTimeout] = useState('30')
  const [retentionPeriod, setRetentionPeriod] = useState('345600')
  const [delaySeconds, setDelaySeconds] = useState('0')
  const [maxMessageSize, setMaxMessageSize] = useState('262144')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewName = isFifo && name && !name.endsWith('.fifo') ? `${name}.fifo` : name

  const handleCreate = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) { setError('Queue name is required'); return }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      setError('Name can only contain alphanumeric characters, hyphens, and underscores')
      return
    }
    setLoading(true)
    setError(null)
    const attributes: Record<string, string> = {
      VisibilityTimeout: visibilityTimeout,
      MessageRetentionPeriod: retentionPeriod,
      DelaySeconds: delaySeconds,
      MaximumMessageSize: maxMessageSize
    }
    if (isFifo && contentBasedDedup) attributes['ContentBasedDeduplication'] = 'true'

    try {
      const result = await window.electronAPI.createQueue(trimmedName, isFifo, attributes)
      if (result.success && result.data) onCreated(result.data)
      else setError(result.error ?? 'Failed to create queue')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-theme sticky top-0 z-10 card"
          style={{ borderRadius: 0 }}
        >
          <div>
            <h2 className="text-sm font-semibold text-1">Create Queue</h2>
            <p className="text-xs text-3 mt-0.5">Configure a new SQS queue</p>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5 uppercase tracking-wider">
              Queue Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={name} autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="my-queue"
              className="input-base"
            />
            {previewName && previewName !== name && (
              <p className="mt-1.5 text-xs text-3">
                Will be created as: <span className="font-mono text-brand-500">{previewName}</span>
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-2 mb-2 uppercase tracking-wider">Queue Type</label>
            <div className="grid grid-cols-2 gap-2">
              <TypeCard
                title="Standard" badge={null}
                description="At-least-once delivery, best-effort ordering"
                selected={!isFifo} onClick={() => setIsFifo(false)}
              />
              <TypeCard
                title="FIFO" badge=".fifo"
                description="Exactly-once processing, strict ordering"
                selected={isFifo} onClick={() => setIsFifo(true)}
              />
            </div>
          </div>

          {/* FIFO options */}
          {isFifo && (
            <div
              className="rounded-xl border border-theme p-4"
              style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={contentBasedDedup}
                  onChange={(e) => setContentBasedDedup(e.target.checked)}
                  className="mt-0.5 accent-brand-500"
                />
                <div>
                  <span className="text-xs font-semibold text-1 block">Content-Based Deduplication</span>
                  <span className="text-xs text-3 mt-0.5 block">
                    Use message content (SHA-256 hash) as deduplication ID
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Settings */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-xs font-semibold text-2 uppercase tracking-wider">Queue Settings</span>
              <Info size={11} className="text-4" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumericField label="Visibility Timeout" hint="s" value={visibilityTimeout}
                onChange={setVisibilityTimeout} min={0} max={43200} />
              <NumericField label="Message Retention" hint="s" value={retentionPeriod}
                onChange={setRetentionPeriod} min={60} max={1209600} />
              <NumericField label="Delivery Delay" hint="s" value={delaySeconds}
                onChange={setDelaySeconds} min={0} max={900} />
              <NumericField label="Max Message Size" hint="bytes" value={maxMessageSize}
                onChange={setMaxMessageSize} min={1024} max={262144} />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 px-5 py-4 border-t border-theme sticky bottom-0 card"
          style={{ borderRadius: 0 }}
        >
          <button onClick={onClose} disabled={loading} className="btn-secondary">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={13} className="animate-spin" />Creating...</> : <><Plus size={13} />Create Queue</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function TypeCard({ title, badge, description, selected, onClick }: {
  title: string; badge: string | null; description: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-xl border-2 transition-all
        ${selected ? 'border-brand-500 bg-brand-500/10' : 'border-theme hover:border-slate-300 dark:hover:border-slate-600'}`}
      style={!selected ? { backgroundColor: 'rgb(var(--bg-raised))' } : undefined}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-xs font-bold ${selected ? 'text-brand-600 dark:text-brand-300' : 'text-1'}`}>
          {title}
        </span>
        {badge && <span className="badge badge-blue text-[10px]">{badge}</span>}
      </div>
      <p className="text-[10px] text-3 leading-relaxed">{description}</p>
    </button>
  )
}

function NumericField({ label, hint, value, onChange, min, max }: {
  label: string; hint: string; value: string; onChange: (v: string) => void; min: number; max: number
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-3 mb-1">
        {label} <span className="text-4">({hint})</span>
      </label>
      <input
        type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(e.target.value)}
        className="input-base text-xs !py-1.5"
      />
    </div>
  )
}
