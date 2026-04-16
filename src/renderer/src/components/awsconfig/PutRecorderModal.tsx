import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface Props {
  onSaved: () => void
  onClose: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

export default function PutRecorderModal({ onSaved, onClose, showToast }: Props) {
  const [name, setName] = useState('default')
  const [roleARN, setRoleARN] = useState('')
  const [allSupported, setAllSupported] = useState(true)
  const [includeGlobal, setIncludeGlobal] = useState(false)
  const [resourceTypesRaw, setResourceTypesRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ name: false, roleARN: false })

  const isValid = name.trim().length > 0 && roleARN.trim().length > 0

  const handleSave = async () => {
    const resourceTypes = allSupported ? [] : resourceTypesRaw.split('\n').map(s => s.trim()).filter(Boolean)
    setLoading(true)
    const res = await window.electronAPI.configPutRecorder(name.trim(), roleARN.trim(), allSupported, includeGlobal, resourceTypes)
    if (res.success) { onSaved() }
    else { showToast('error', res.error ?? 'Save failed') }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-base border border-theme rounded-xl shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h2 className="text-sm font-semibold text-1">Add Configuration Recorder</h2>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">Recorder Name <span className="text-red-400">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} onBlur={() => setTouched(t => ({ ...t, name: true }))} className="input-base w-full text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">IAM Role ARN <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={roleARN}
              onChange={e => setRoleARN(e.target.value)}
              placeholder="arn:aws:iam::000000000000:role/config-role"
              onBlur={() => setTouched(t => ({ ...t, roleARN: true }))}
              className={`input-base w-full text-sm font-mono ${touched.roleARN && roleARN.trim() === '' ? 'border-red-500/50' : ''}`}
            />
            {touched.roleARN && roleARN.trim() === '' && (
              <p className="text-[10px] text-red-400 mt-1">Role ARN is required</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allSupported} onChange={e => setAllSupported(e.target.checked)} className="rounded" />
              <span className="text-sm text-2">Record all supported resources</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeGlobal} onChange={e => setIncludeGlobal(e.target.checked)} className="rounded" />
              <span className="text-sm text-2">Include global resource types</span>
            </label>
          </div>
          {!allSupported && (
            <div>
              <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">Resource Types (one per line)</label>
              <textarea
                value={resourceTypesRaw}
                onChange={e => setResourceTypesRaw(e.target.value)}
                rows={4}
                placeholder="AWS::EC2::Instance&#10;AWS::S3::Bucket"
                className="input-base w-full text-xs font-mono resize-none"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading || !isValid}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 size={13} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  )
}
