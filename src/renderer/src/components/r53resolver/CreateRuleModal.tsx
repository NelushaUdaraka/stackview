import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { R53ResolverEndpoint } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  endpoints: R53ResolverEndpoint[]
  onCreated: () => void
  onClose: () => void
}

export default function CreateRuleModal({ endpoints, onCreated, onClose }: Props) {
  const { showToast } = useToastContext()
  const [name, setName] = useState('')
  const [ruleType, setRuleType] = useState('FORWARD')
  const [domainName, setDomainName] = useState('')
  const [endpointId, setEndpointId] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ name: false, domainName: false })

  const needsEndpoint = ruleType === 'FORWARD'
  const isValid = name.trim().length > 0 && domainName.trim().length > 0

  const handleCreate = async () => {
    if (!isValid) return
    setLoading(true)
    const res = await window.electronAPI.r53rCreateRule(
      name.trim(), ruleType, domainName.trim(),
      needsEndpoint && endpointId ? endpointId : undefined
    )
    if (res.success) { onCreated() }
    else showToast('error', res.error ?? 'Failed to create rule')
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-theme shadow-2xl flex flex-col" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h3 className="text-sm font-bold text-1">Create Resolver Rule</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={14} /></button>
        </div>

        {/* body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Name <span className="text-red-400">*</span></label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              placeholder="my-resolver-rule"
              className={`input-base w-full text-sm ${touched.name && !name.trim() ? 'border-red-500/50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Rule Type <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              {(['FORWARD', 'SYSTEM', 'RECURSIVE'] as const).map(t => (
                <button key={t} onClick={() => setRuleType(t)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                    ${ruleType === t ? 'bg-blue-500/15 border-blue-500/40 text-blue-400' : 'border-theme text-3 hover:text-2'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Domain Name <span className="text-red-400">*</span></label>
            <input
              type="text" value={domainName} onChange={e => setDomainName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, domainName: true }))}
              placeholder="example.com"
              className={`input-base w-full text-sm ${touched.domainName && !domainName.trim() ? 'border-red-500/50' : ''}`}
            />
          </div>

          {needsEndpoint && (
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">
                Resolver Endpoint <span className="normal-case font-normal text-4">(OUTBOUND only, optional)</span>
              </label>
              <select value={endpointId} onChange={e => setEndpointId(e.target.value)} className="input-base w-full text-sm">
                <option value="">None</option>
                {endpoints.filter(e => e.direction === 'OUTBOUND').map(e => (
                  <option key={e.id} value={e.id}>{e.name ?? e.id}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-ghost text-xs px-4 py-2">Cancel</button>
          <button onClick={handleCreate} disabled={loading || !isValid}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 transition-colors">
            {loading && <Loader2 size={13} className="animate-spin" />}
            Create Rule
          </button>
        </div>
      </div>
    </div>
  )
}
