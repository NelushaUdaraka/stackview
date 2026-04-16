import { useState } from 'react'
import { X, Share2, Loader2 } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

const DEFAULT_DEFINITION = JSON.stringify(
  {
    Comment: 'A simple state machine',
    StartAt: 'HelloWorld',
    States: {
      HelloWorld: {
        Type: 'Pass',
        Result: 'Hello, World!',
        End: true,
      },
    },
  },
  null,
  2
)

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateStateMachineModal({ onClose, onCreated }: Props) {
  const { showToast } = useToastContext()
  const [name, setName] = useState('')
  const [definition, setDefinition] = useState(DEFAULT_DEFINITION)
  const [roleArn, setRoleArn] = useState('arn:aws:iam::000000000000:role/stepfunctions-role')
  const [type, setType] = useState<'STANDARD' | 'EXPRESS'>('STANDARD')
  const [loading, setLoading] = useState(false)
  const [defError, setDefError] = useState('')

  const validateDefinition = (val: string) => {
    try {
      JSON.parse(val)
      setDefError('')
      return true
    } catch {
      setDefError('Invalid JSON')
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateDefinition(definition)) return
    setLoading(true)
    const res = await window.electronAPI.sfnCreateStateMachine(
      name.trim(),
      definition,
      roleArn.trim(),
      type
    )
    setLoading(false)
    if (res.success) {
      showToast('success', `State machine "${name}" created`)
      onCreated()
    } else {
      showToast('error', res.error || 'Failed to create state machine')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-theme shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'rgb(var(--bg-base))', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-lime-500/15">
              <Share2 size={16} className="text-lime-500" />
            </div>
            <h2 className="text-sm font-bold text-1">Create State Machine</h2>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-state-machine"
                required
                className="input-base w-full"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Type
              </label>
              <div
                className="flex rounded-lg border border-theme overflow-hidden"
                style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
              >
                {(['STANDARD', 'EXPRESS'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-colors
                      ${type === t ? 'bg-lime-500/15 text-lime-600 dark:text-lime-400' : 'text-3 hover:text-2'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-4 mt-1">
                {type === 'STANDARD'
                  ? 'Long-running, exactly-once execution with full history.'
                  : 'High-throughput, short-duration, at-least-once execution.'}
              </p>
            </div>

            {/* Role ARN */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Role ARN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                placeholder="arn:aws:iam::000000000000:role/stepfunctions-role"
                required
                className="input-base w-full font-mono text-xs"
              />
            </div>

            {/* Definition */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Definition (Amazon States Language JSON) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={definition}
                onChange={(e) => { setDefinition(e.target.value); if (defError) validateDefinition(e.target.value) }}
                onBlur={() => validateDefinition(definition)}
                rows={14}
                className={`input-base w-full font-mono text-xs resize-none ${defError ? 'border-red-500' : ''}`}
                spellCheck={false}
              />
              {defError && <p className="text-[10px] text-red-500 mt-1">{defError}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-theme shrink-0">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !roleArn.trim() || !!defError}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-lime-600 hover:bg-lime-500 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
