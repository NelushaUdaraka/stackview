import { useState } from 'react'
import { X, SlidersHorizontal, Lock, List, AlertTriangle, Loader2, ChevronRight } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  onClose: () => void
  onCreated: (name: string) => void
}

type Step = 1 | 2 | 3
type ParamType = 'String' | 'StringList' | 'SecureString'

const TYPE_OPTIONS: { value: ParamType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'String', label: 'String', icon: <SlidersHorizontal size={16} />, desc: 'Plain text value' },
  { value: 'StringList', label: 'StringList', icon: <List size={16} />, desc: 'Comma-separated list' },
  { value: 'SecureString', label: 'SecureString', icon: <Lock size={16} />, desc: 'Encrypted via KMS' },
]

export default function CreateParameterModal({ onClose, onCreated }: Props) {
  const { showToast } = useToastContext()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [type, setType] = useState<ParamType>('String')
  const [kmsKeyId, setKmsKeyId] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [overwrite, setOverwrite] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const nameError = name && !name.match(/^[a-zA-Z0-9_.\/\-]+$/)
    ? 'Name can only contain letters, numbers, . / - and _'
    : ''

  const canNext1 = name.trim().length > 0 && !nameError
  const canNext2 = value.trim().length > 0

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const res = await window.electronAPI.ssmPutParameter(
      name.trim(),
      value,
      type,
      description.trim() || undefined,
      type === 'SecureString' && kmsKeyId.trim() ? kmsKeyId.trim() : undefined,
      overwrite
    )
    setSubmitting(false)
    if (res.success) {
      onCreated(name.trim())
    } else {
      setError(res.error ?? 'Failed to create parameter')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgb(20 184 166 / 0.15)' }}>
              <SlidersHorizontal size={16} style={{ color: 'rgb(20 184 166)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Parameter</h2>
              <p className="text-[10px] text-3">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        {/* Steps indicator */}
        <div className="flex border-b border-theme">
          {['Name & Type', 'Value', 'Review'].map((label, i) => {
            const s = (i + 1) as Step
            return (
              <div key={label} className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-colors
                ${step === s ? 'text-teal-500 border-b-2 border-teal-500' : step > s ? 'text-3' : 'text-4'}`}>
                {label}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Step 1 */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Parameter Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="/app/env/my-param"
                  className="input-base w-full text-sm font-mono"
                  autoFocus
                />
                {nameError && <p className="text-[11px] text-red-500 mt-1">{nameError}</p>}
                <p className="text-[10px] text-3 mt-1">Use /path/name for hierarchical organization</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Type *</label>
                <div className="space-y-2">
                  {TYPE_OPTIONS.map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                      ${type === opt.value ? 'border-teal-500/60 bg-teal-500/8' : 'border-theme hover:bg-raised'}`}>
                      <input type="radio" name="type" value={opt.value} checked={type === opt.value}
                        onChange={() => setType(opt.value)} className="sr-only" />
                      <span className={`${type === opt.value ? 'text-teal-500' : 'text-3'}`}>{opt.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-1">{opt.label}</p>
                        <p className="text-[10px] text-3">{opt.desc}</p>
                      </div>
                      {type === opt.value && <div className="w-4 h-4 rounded-full bg-teal-500 shrink-0" />}
                    </label>
                  ))}
                </div>
              </div>

              {type === 'SecureString' && (
                <div>
                  <label className="block text-xs font-semibold text-2 mb-1.5">KMS Key ID <span className="text-3 font-normal">(optional, uses default if empty)</span></label>
                  <input type="text" value={kmsKeyId} onChange={e => setKmsKeyId(e.target.value)}
                    placeholder="alias/aws/ssm" className="input-base w-full text-sm font-mono" />
                </div>
              )}
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Value *</label>
                <textarea
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={type === 'StringList' ? 'value1,value2,value3' : 'Enter parameter value...'}
                  rows={6}
                  className="input-base w-full text-sm font-mono resize-none"
                  autoFocus
                />
                {type === 'StringList' && <p className="text-[10px] text-3 mt-1">Separate values with commas</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Description <span className="text-3 font-normal">(optional)</span></label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe this parameter..." className="input-base w-full text-sm" />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)}
                  className="w-4 h-4 rounded accent-teal-500" />
                <div>
                  <p className="text-xs font-semibold text-2">Allow overwrite</p>
                  <p className="text-[10px] text-3">Update if a parameter with this name already exists</p>
                </div>
              </label>
            </>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="card p-4 space-y-3">
                {[
                  { label: 'Name', value: <span className="font-mono text-xs">{name}</span> },
                  { label: 'Type', value: type },
                  ...(type === 'SecureString' && kmsKeyId ? [{ label: 'KMS Key', value: kmsKeyId }] : []),
                  { label: 'Value', value: <span className="font-mono text-xs truncate block max-w-[300px]">{type === 'SecureString' ? '••••••••' : value}</span> },
                  ...(description ? [{ label: 'Description', value: description }] : []),
                  { label: 'Overwrite', value: overwrite ? 'Yes' : 'No' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-4">
                    <p className="text-[10px] font-bold text-4 uppercase tracking-wider w-24 shrink-0">{r.label}</p>
                    <p className="text-xs text-2 flex-1">{r.value}</p>
                  </div>
                ))}
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
                  <AlertTriangle size={13} /> {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-theme">
          <button onClick={step === 1 ? onClose : () => setStep(s => (s - 1) as Step)}
            className="btn-ghost text-sm">
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => (s + 1) as Step)}
              disabled={step === 1 ? !canNext1 : !canNext2}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors disabled:opacity-40"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Create Parameter
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
