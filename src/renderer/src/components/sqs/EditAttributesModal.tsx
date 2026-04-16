import { useState } from 'react'
import { X, Save } from 'lucide-react'
import type { QueueInfo } from '../../types'

interface Props {
  queue: QueueInfo
  attributes: Record<string, string>
  onClose: () => void
  onSaved: (attrs: Record<string, string>) => void
}

export default function EditAttributesModal({ queue, attributes, onClose, onSaved }: Props) {
  const [visibilityTimeout, setVisibilityTimeout] = useState(attributes.VisibilityTimeout ?? '30')
  const [retentionPeriod, setRetentionPeriod] = useState(attributes.MessageRetentionPeriod ?? '345600')
  const [delaySeconds, setDelaySeconds] = useState(attributes.DelaySeconds ?? '0')
  const [maxMessageSize, setMaxMessageSize] = useState(attributes.MaximumMessageSize ?? '262144')
  const [waitTimeSeconds, setWaitTimeSeconds] = useState(attributes.ReceiveMessageWaitTimeSeconds ?? '0')

  const handleSave = () =>
    onSaved({
      VisibilityTimeout: visibilityTimeout,
      MessageRetentionPeriod: retentionPeriod,
      DelaySeconds: delaySeconds,
      MaximumMessageSize: maxMessageSize,
      ReceiveMessageWaitTimeSeconds: waitTimeSeconds
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div>
            <h2 className="text-sm font-semibold text-1">Edit Queue Attributes</h2>
            <p className="text-xs text-3 mt-0.5">{queue.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Visibility Timeout" hint="0 – 43,200 seconds"
            value={visibilityTimeout} onChange={setVisibilityTimeout} min={0} max={43200} />
          <Field label="Message Retention Period" hint="60 – 1,209,600 seconds"
            value={retentionPeriod} onChange={setRetentionPeriod} min={60} max={1209600} />
          <Field label="Delivery Delay" hint="0 – 900 seconds"
            value={delaySeconds} onChange={setDelaySeconds} min={0} max={900} />
          <Field label="Maximum Message Size" hint="1,024 – 262,144 bytes"
            value={maxMessageSize} onChange={setMaxMessageSize} min={1024} max={262144} />
          <Field label="Receive Message Wait Time" hint="0 – 20 seconds (Long Polling)"
            value={waitTimeSeconds} onChange={setWaitTimeSeconds} min={0} max={20} />
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary gap-1.5">
            <Save size={13} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, value, onChange, min, max }: {
  label: string; hint: string; value: string; onChange: (v: string) => void; min: number; max: number
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-2 mb-1">
        {label}
        <span className="text-4 font-normal ml-1.5">({hint})</span>
      </label>
      <input
        type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(e.target.value)}
        className="input-base"
      />
    </div>
  )
}
