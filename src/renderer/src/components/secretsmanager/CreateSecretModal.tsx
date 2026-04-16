import { useState } from 'react'
import { X, Shield, Loader2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: (name: string) => void
}

export default function CreateSecretModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [secretString, setSecretString] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim().length > 0 && secretString.trim().length > 0

  const handleCreate = async () => {
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      const result = await window.electronAPI.secretsManagerCreateSecret(
        name.trim(),
        description.trim(),
        secretString
      )
      if (result.success) {
        onCreated(name)
      } else {
        setError(result.error ?? 'Failed to create secret')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        {/* Pointer events none on wrapper to allow clicks to pass to backdrop, auto on modal */}
        <div
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-theme pointer-events-auto"
          style={{ backgroundColor: 'rgb(var(--bg-base))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-theme shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(99 102 241 / 0.1)' }}>
                <Shield size={15} style={{ color: 'rgb(99 102 241)' }} />
              </div>
              <h2 className="text-sm font-bold text-1">Create Secret</h2>
            </div>
            <button onClick={onClose} className="btn-ghost !px-2 !py-2">
              <X size={15} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto min-h-0 space-y-5">
            {/* Name field */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Secret Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                placeholder="my-app/db-password"
                className="input-base w-full"
                autoFocus
              />
            </div>

            {/* Description field */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Database credentials for the production environment"
                className="input-base w-full"
              />
            </div>

            {/* Value field */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Secret Value <span className="text-red-500">*</span>
              </label>
              <textarea
                value={secretString}
                onChange={(e) => { setSecretString(e.target.value); setError('') }}
                placeholder='{"username": "admin", "password": "..."}'
                className="input-base font-mono text-xs w-full min-h-[140px] resize-y"
                spellCheck={false}
              />
            </div>
          </div>

          {error && (
            <div className="px-6 pb-2">
               <p className="text-xs text-red-500 p-3 rounded-lg bg-red-500/10 border border-red-500/20 break-all">
                 {error}
               </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 p-5 border-t border-theme shrink-0 bg-raised/10 rounded-b-2xl">
            <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-4">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!valid || loading}
              className="btn-primary text-xs py-1.5 px-4 gap-1.5 text-white"
              style={valid && !loading ? { backgroundColor: 'rgb(99 102 241)', boxShadow: '0 4px 12px -2px rgb(99 102 241 / 0.5)' } : {}}
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              Create Secret
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
