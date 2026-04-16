import { useState } from 'react'
import { X, Zap, AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  domain: string
  workflowId: string
  runId: string
  onClose: () => void
  onSignaled: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

export default function SignalExecutionModal({
  domain,
  workflowId,
  runId,
  onClose,
  onSignaled,
  showToast,
}: Props) {
  const [signalName, setSignalName] = useState('')
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!signalName.trim()) { setError('Signal name is required'); return }
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.swfSignalExecution(
      domain,
      workflowId,
      runId,
      signalName.trim(),
      input.trim() || undefined
    )
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Signal "${signalName.trim()}" sent to execution "${workflowId}"`)
      onSignaled()
    } else {
      setError(res.error || 'Failed to send signal')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-theme shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/15">
              <Zap size={16} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Signal Execution</h2>
              <p className="text-[10px] text-3 font-mono truncate max-w-[220px]">{workflowId}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Signal Name <span className="text-red-500">*</span>
            </label>
            <input
              value={signalName}
              onChange={(e) => setSignalName(e.target.value)}
              placeholder="e.g. approve, cancel, retry"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Input <span className="text-4 font-normal">(optional)</span>
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"approved": true}'
              rows={3}
              className="input-base w-full text-sm font-mono resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme"
          style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.3)' }}
        >
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !signalName.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Send Signal
          </button>
        </div>
      </div>
    </div>
  )
}
