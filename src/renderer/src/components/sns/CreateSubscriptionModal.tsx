import { useState } from 'react'
import { X, Link as LinkIcon, AlertTriangle, Loader2 } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  topicArn: string
  onClose: () => void
  onCreated: (arn: string) => void
}

const PROTOCOLS = [
  { value: 'http', label: 'HTTP', desc: 'Delivery to HTTP endpoint' },
  { value: 'https', label: 'HTTPS', desc: 'Secure delivery to HTTPS endpoint' },
  { value: 'email', label: 'Email', desc: 'Delivery to email address' },
  { value: 'email-json', label: 'Email-JSON', desc: 'JSON delivery to email address' },
  { value: 'sms', label: 'SMS', desc: 'Delivery to mobile device' },
  { value: 'sqs', label: 'SQS', desc: 'Delivery to Amazon SQS' },
  { value: 'application', label: 'Application', desc: 'Delivery to mobile app' },
  { value: 'lambda', label: 'Lambda', desc: 'Delivery to AWS Lambda' },
  { value: 'firehose', label: 'Firehose', desc: 'Delivery to Kinesis Data Firehose' },
]

export default function CreateSubscriptionModal({ topicArn, onClose, onCreated }: Props) {
  const [protocol, setProtocol] = useState('sqs')
  const [endpoint, setEndpoint] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = endpoint.trim().length > 0

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const res = await window.electronAPI.snsSubscribe(topicArn, protocol, endpoint.trim())
    setSubmitting(false)
    if (res.success && res.data) {
      onCreated(res.data)
    } else {
      setError(res.error ?? 'Failed to subscribe')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgb(236 72 153 / 0.15)' }}>
              <LinkIcon size={16} style={{ color: 'rgb(236 72 153)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Subscription</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] text-3 truncate max-w-[250px]" title={topicArn}>{topicArn.substring(0, 40)}...</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 overflow-auto space-y-5">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Protocol *</label>
            <select
              value={protocol}
              onChange={e => setProtocol(e.target.value)}
              className="input-base w-full text-sm appearance-none bg-app py-2 px-3 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
            >
              {PROTOCOLS.map(p => (
                <option key={p.value} value={p.value}>{p.label} - {p.desc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Endpoint *</label>
            <input
              type="text"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder={protocol === 'sqs' ? 'arn:aws:sqs:region:account:queue' : protocol === 'email' ? 'user@example.com' : 'https://...'}
              className="input-base w-full text-sm font-mono"
              autoFocus
            />
            <p className="text-[10px] text-3 mt-1 leading-relaxed">
              The endpoint must be formatted correctly for the selected protocol. For SQS, use the Queue ARN. For HTTP, use a valid URL.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500 mt-2">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-pink-600 hover:bg-pink-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Subscribe Endpoint
          </button>
        </div>
      </div>
    </div>
  )
}
