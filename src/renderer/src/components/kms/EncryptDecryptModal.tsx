import { useState } from 'react'
import { X, Lock, Unlock, AlertTriangle, Loader2 } from 'lucide-react'
import type { KmsKey } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  dataKey: KmsKey
  onClose: () => void
}

export default function EncryptDecryptModal({ dataKey, onClose }: Props) {
  const { showToast } = useToastContext()
  const [inputText, setInputText] = useState('')
  const [resultText, setResultText] = useState('')
  const [mode, setMode] = useState<'Encrypt' | 'Decrypt'>('Encrypt')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleAction = async () => {
    if (!inputText.trim()) return
    setError('')
    setSubmitting(true)
    let res
    try {
      if (mode === 'Encrypt') {
        res = await window.electronAPI.kmsEncryptData(dataKey.keyId, inputText.trim())
      } else {
        res = await window.electronAPI.kmsDecryptData(inputText.trim())
      }
      if (res.success) {
        setResultText(res.data || '')
        showToast('success', `${mode}ion successful`)
      } else {
        setError(res.error || `Failed to ${mode.toLowerCase()} data`)
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error occurred')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-2xl border border-theme shadow-2xl flex flex-col max-h-[90vh]" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-500/15">
              {mode === 'Encrypt' ? <Lock size={16} className="text-violet-500" /> : <Unlock size={16} className="text-violet-500" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">{mode} Data</h2>
              <p className="text-[10px] text-3">Key: <span className="font-mono text-violet-500">{dataKey.keyId.split('-')[0]}...</span></p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex bg-raised rounded-lg p-0.5 border border-theme w-fit">
            <button
              onClick={() => { setMode('Encrypt'); setResultText(''); setError('') }}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors ${mode === 'Encrypt' ? 'bg-base shadow-sm text-violet-500' : 'text-3 hover:text-2'}`}
            >
              Encrypt (String ➔ Base64)
            </button>
            <button
              onClick={() => { setMode('Decrypt'); setResultText(''); setError('') }}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors ${mode === 'Decrypt' ? 'bg-base shadow-sm text-violet-500' : 'text-3 hover:text-2'}`}
            >
              Decrypt (Base64 ➔ String)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Input {mode === 'Encrypt' ? 'Plaintext' : 'Ciphertext (Base64)'}</label>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={mode === 'Encrypt' ? "Secret string to encrypt..." : "Base64 encoded ciphertext..."}
              className="input-base w-full text-sm font-mono min-h-[120px] resize-y"
              autoFocus
            />
          </div>

          <div className="flex justify-center -my-2 opacity-50">
            <div className="w-px h-6 bg-theme"></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Output {mode === 'Encrypt' ? 'Ciphertext (Base64)' : 'Plaintext'}</label>
            <textarea
              value={resultText}
              readOnly
              placeholder="Output will appear here..."
              className="input-base w-full text-sm font-mono min-h-[120px] resize-y bg-raised"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Done</button>
          <button
            onClick={handleAction}
            disabled={!inputText.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {mode === 'Encrypt' ? <Lock size={14} /> : <Unlock size={14} />} {mode} Data
          </button>
        </div>
      </div>
    </div>
  )
}
