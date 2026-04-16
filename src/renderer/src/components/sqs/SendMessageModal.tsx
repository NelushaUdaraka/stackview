import { useState } from 'react'
import { X, Send, Loader2, AlertCircle, Plus, Trash2, ChevronDown } from 'lucide-react'
import type { QueueInfo } from '../../types'

interface MessageAttribute {
  name: string
  dataType: 'String' | 'Number' | 'Binary'
  value: string
}

interface Props {
  queue: QueueInfo
  onClose: () => void
  onSent: (messageId: string) => void
}

const SAMPLE_MESSAGES = [
  { label: 'Simple text', body: 'Hello, World!' },
  {
    label: 'JSON object',
    body: JSON.stringify(
      { event: 'order.created', orderId: '12345', timestamp: new Date().toISOString() },
      null, 2
    )
  },
  {
    label: 'JSON array',
    body: JSON.stringify([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }], null, 2)
  }
]

export default function SendMessageModal({ queue, onClose, onSent }: Props) {
  const isFifo = queue.name.endsWith('.fifo')

  const [body, setBody] = useState('')
  const [delaySeconds, setDelaySeconds] = useState('0')
  const [messageGroupId, setMessageGroupId] = useState('')
  const [messageDeduplicationId, setMessageDeduplicationId] = useState('')
  const [messageAttributes, setMessageAttributes] = useState<MessageAttribute[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSamples, setShowSamples] = useState(false)

  const addAttribute = () =>
    setMessageAttributes((prev) => [...prev, { name: '', dataType: 'String', value: '' }])

  const removeAttribute = (index: number) =>
    setMessageAttributes((prev) => prev.filter((_, i) => i !== index))

  const updateAttribute = (index: number, field: keyof MessageAttribute, value: string) =>
    setMessageAttributes((prev) => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))

  const handleSend = async () => {
    if (!body.trim()) { setError('Message body is required'); return }
    if (isFifo && !messageGroupId.trim()) {
      setError('Message Group ID is required for FIFO queues')
      return
    }
    setLoading(true)
    setError(null)
    const attrs: Record<string, { DataType: string; StringValue: string }> = {}
    for (const a of messageAttributes) {
      if (a.name.trim()) attrs[a.name.trim()] = { DataType: a.dataType, StringValue: a.value }
    }
    try {
      const result = await window.electronAPI.sendMessage(
        queue.url, body,
        isFifo ? undefined : parseInt(delaySeconds) || 0,
        isFifo ? messageGroupId : undefined,
        isFifo && messageDeduplicationId ? messageDeduplicationId : undefined,
        Object.keys(attrs).length > 0 ? attrs : undefined
      )
      if (result.success && result.data) onSent(result.data)
      else setError(result.error ?? 'Failed to send message')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const formatJson = () => {
    try { setBody(JSON.stringify(JSON.parse(body), null, 2)) } catch { /* not JSON */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-1">Send Message</h2>
            <p className="text-xs text-3 mt-0.5 flex items-center gap-1.5">
              {queue.name}
              {isFifo && <span className="badge badge-blue">FIFO</span>}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-2 uppercase tracking-wider">
                Message Body <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button onClick={formatJson} className="text-[10px] text-3 hover:text-1 transition-colors">
                  Format JSON
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowSamples((s) => !s)}
                    className="flex items-center gap-1 text-[10px] text-3 hover:text-1 transition-colors"
                  >
                    Samples <ChevronDown size={10} className={showSamples ? 'rotate-180' : ''} />
                  </button>
                  {showSamples && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSamples(false)} />
                      <div className="absolute right-0 z-50 mt-1 w-44 card shadow-xl overflow-hidden">
                        {SAMPLE_MESSAGES.map((s) => (
                          <button
                            key={s.label}
                            onClick={() => { setBody(s.body); setShowSamples(false) }}
                            className="w-full text-left px-3 py-2 text-xs text-2 hover:bg-raised transition-colors"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Enter message body..."
              className="input-base resize-none font-mono text-xs leading-relaxed"
            />
            <p className="mt-1 text-[10px] text-4 text-right">
              {new Blob([body]).size.toLocaleString()} bytes
            </p>
          </div>

          {/* FIFO / delay */}
          {isFifo ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5 uppercase tracking-wider">
                  Message Group ID <span className="text-red-500">*</span>
                </label>
                <input type="text" value={messageGroupId}
                  onChange={(e) => setMessageGroupId(e.target.value)}
                  placeholder="group-1" className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5 uppercase tracking-wider">
                  Deduplication ID <span className="text-4 font-normal">(optional)</span>
                </label>
                <input type="text" value={messageDeduplicationId}
                  onChange={(e) => setMessageDeduplicationId(e.target.value)}
                  placeholder="auto if content-based" className="input-base" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5 uppercase tracking-wider">
                Delay <span className="text-4 font-normal">(seconds, 0–900)</span>
              </label>
              <input type="number" value={delaySeconds}
                onChange={(e) => setDelaySeconds(e.target.value)}
                min={0} max={900} className="input-base w-32" />
            </div>
          )}

          {/* Message attributes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-2 uppercase tracking-wider">
                Message Attributes <span className="text-4 font-normal">(optional)</span>
              </label>
              <button onClick={addAttribute} className="flex items-center gap-1 text-[10px] text-brand-500 hover:text-brand-400 transition-colors">
                <Plus size={11} /> Add Attribute
              </button>
            </div>
            {messageAttributes.length > 0 ? (
              <div className="space-y-2">
                {messageAttributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" value={attr.name}
                      onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                      placeholder="Name" className="input-base flex-1 text-xs !py-1.5" />
                    <select value={attr.dataType}
                      onChange={(e) => updateAttribute(index, 'dataType', e.target.value)}
                      className="input-base w-24 shrink-0 text-xs !py-1.5">
                      <option>String</option>
                      <option>Number</option>
                      <option>Binary</option>
                    </select>
                    <input type="text" value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      placeholder="Value" className="input-base flex-1 text-xs !py-1.5" />
                    <button onClick={() => removeAttribute(index)}
                      className="text-4 hover:text-red-500 transition-colors p-1 shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-4 rounded-lg border border-dashed border-theme"
                style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}
              >
                <p className="text-xs text-3">No message attributes added</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-theme shrink-0">
          <button onClick={onClose} disabled={loading} className="btn-secondary">Cancel</button>
          <button onClick={handleSend} disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={13} className="animate-spin" />Sending...</> : <><Send size={13} />Send Message</>}
          </button>
        </div>
      </div>
    </div>
  )
}
