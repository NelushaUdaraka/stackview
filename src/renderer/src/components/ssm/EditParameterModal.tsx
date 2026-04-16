import { useState } from 'react'
import { X, SlidersHorizontal, Lock, List, AlertTriangle, Loader2 } from 'lucide-react'
import type { SsmParameter } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  param: SsmParameter
  onClose: () => void
  onUpdated: () => void
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  String: <SlidersHorizontal size={14} />,
  StringList: <List size={14} />,
  SecureString: <Lock size={14} />,
}

export default function EditParameterModal({ param, onClose, onUpdated }: Props) {
  const { showToast } = useToastContext()
  const [value, setValue] = useState('')
  const [description, setDescription] = useState(param.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = value.trim().length > 0

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const res = await window.electronAPI.ssmPutParameter(
      param.name,
      value,
      param.type,
      description.trim() || undefined,
      undefined,
      true // ALWAYS overwrite when editing
    )
    setSubmitting(false)
    if (res.success) {
      onUpdated()
    } else {
      setError(res.error ?? 'Failed to update parameter')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgb(20 184 166 / 0.15)' }}>
              <SlidersHorizontal size={16} style={{ color: 'rgb(20 184 166)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Edit Parameter</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] text-1">{param.name}</span>
                <span className="text-[10px] text-3 flex items-center gap-1">
                  ({TYPE_ICONS[param.type]} {param.type})
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">New Value *</label>
            <textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={`Enter new ${param.type === 'StringList' ? 'comma-separated list' : 'value'}...`}
              rows={6}
              className="input-base w-full text-sm font-mono resize-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Description <span className="text-3 font-normal">(optional)</span></label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe this parameter..." className="input-base w-full text-sm" />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-600 dark:text-teal-400">
            <AlertTriangle size={14} className="shrink-0" />
            <p>This will overwrite the current parameter value and create a new version.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
