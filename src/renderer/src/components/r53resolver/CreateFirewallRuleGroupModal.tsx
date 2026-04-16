import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  onCreated: () => void
  onClose: () => void
}

export default function CreateFirewallRuleGroupModal({ onCreated, onClose }: Props) {
  const { showToast } = useToastContext()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)

  const isValid = name.trim().length > 0

  const handleCreate = async () => {
    if (!isValid) return
    setLoading(true)
    const res = await window.electronAPI.r53rCreateFwRuleGroup(name.trim())
    if (res.success) { onCreated() }
    else showToast('error', res.error ?? 'Failed to create firewall rule group')
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl flex flex-col" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h3 className="text-sm font-bold text-1">Create Firewall Rule Group</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={14} /></button>
        </div>

        {/* body */}
        <div className="p-5">
          <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Name <span className="text-red-400">*</span></label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="my-firewall-rule-group"
            className={`input-base w-full text-sm ${touched && !name.trim() ? 'border-red-500/50' : ''}`}
          />
          {touched && !name.trim() && (
            <p className="text-[10px] text-red-400 mt-1">Name is required</p>
          )}
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-ghost text-xs px-4 py-2">Cancel</button>
          <button onClick={handleCreate} disabled={loading || !isValid}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 transition-colors">
            {loading && <Loader2 size={13} className="animate-spin" />}
            Create Group
          </button>
        </div>
      </div>
    </div>
  )
}
