import { useState } from 'react'
import { X, Play, Loader2 } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  stateMachineArn: string
  stateMachineName: string
  onClose: () => void
  onStarted: () => void
}

export default function StartExecutionModal({
  stateMachineArn,
  stateMachineName,
  onClose,
  onStarted,
}: Props) {
  const { showToast } = useToastContext()
  const [name, setName] = useState('')
  const [input, setInput] = useState('{}')
  const [loading, setLoading] = useState(false)
  const [inputError, setInputError] = useState('')

  const validateInput = (val: string) => {
    if (!val.trim()) { setInputError(''); return true }
    try {
      JSON.parse(val)
      setInputError('')
      return true
    } catch {
      setInputError('Invalid JSON')
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateInput(input)) return
    setLoading(true)
    const res = await window.electronAPI.sfnStartExecution(
      stateMachineArn,
      name.trim() || undefined,
      input.trim() || undefined
    )
    setLoading(false)
    if (res.success) {
      showToast('success', `Execution started`)
      onStarted()
    } else {
      showToast('error', res.error || 'Failed to start execution')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'rgb(var(--bg-base))', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-lime-500/15">
              <Play size={16} className="text-lime-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Start Execution</h2>
              <p className="text-[10px] text-3 font-mono truncate max-w-[260px]">{stateMachineName}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Execution Name <span className="text-3 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Auto-generated if left blank"
                className="input-base w-full"
              />
            </div>

            {/* Input */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Input (JSON)
              </label>
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); if (inputError) validateInput(e.target.value) }}
                onBlur={() => validateInput(input)}
                rows={8}
                className={`input-base w-full font-mono text-xs resize-none ${inputError ? 'border-red-500' : ''}`}
                spellCheck={false}
              />
              {inputError && <p className="text-[10px] text-red-500 mt-1">{inputError}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-theme shrink-0">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!inputError}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-lime-600 hover:bg-lime-500 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Start
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
