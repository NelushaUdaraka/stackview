import { useState } from 'react'
import { X, LifeBuoy, Loader2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low — General guidance' },
  { value: 'normal', label: 'Normal — System impaired' },
  { value: 'high', label: 'High — Production system impaired' },
  { value: 'urgent', label: 'Urgent — Production system down' },
  { value: 'critical', label: 'Critical — Business-critical system down' },
]

export default function CreateCaseModal({ onClose, onCreated, showToast }: Props) {
  const [subject, setSubject] = useState('')
  const [communicationBody, setCommunicationBody] = useState('')
  const [serviceCode, setServiceCode] = useState('')
  const [severityCode, setSeverityCode] = useState('normal')
  const [categoryCode, setCategoryCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await window.electronAPI.supportCreateCase(
      subject.trim(),
      communicationBody.trim(),
      serviceCode.trim() || undefined,
      severityCode || undefined,
      categoryCode.trim() || undefined
    )
    setLoading(false)
    if (res.success) {
      showToast('success', `Case created${res.data ? `: ${res.data}` : ''}`)
      onCreated()
    } else {
      showToast('error', res.error || 'Failed to create case')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'rgb(var(--bg-base))', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-sky-500/15">
              <LifeBuoy size={16} className="text-sky-500" />
            </div>
            <h2 className="text-sm font-bold text-1">Create Support Case</h2>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of the issue"
                required
                autoFocus
                className="input-base w-full"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Severity
              </label>
              <select
                value={severityCode}
                onChange={(e) => setSeverityCode(e.target.value)}
                className="input-base w-full"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Service Code */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Service Code <span className="text-3 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                placeholder="e.g. amazon-s3"
                className="input-base w-full"
              />
            </div>

            {/* Category Code */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Category Code <span className="text-3 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                placeholder="e.g. general-guidance"
                className="input-base w-full"
              />
            </div>

            {/* Communication Body */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={communicationBody}
                onChange={(e) => setCommunicationBody(e.target.value)}
                placeholder="Describe the issue in detail…"
                required
                rows={6}
                className="input-base w-full resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-theme shrink-0">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !subject.trim() || !communicationBody.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Case
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
