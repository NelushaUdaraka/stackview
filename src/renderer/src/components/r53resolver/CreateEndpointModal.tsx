import { useState } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface IpConfig {
  subnetId: string
  ip: string
}

interface Props {
  onCreated: () => void
  onClose: () => void
}

export default function CreateEndpointModal({ onCreated, onClose }: Props) {
  const { showToast } = useToastContext()
  const [name, setName] = useState('')
  const [direction, setDirection] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND')
  const [securityGroupIds, setSecurityGroupIds] = useState('')
  const [ipConfigs, setIpConfigs] = useState<IpConfig[]>([{ subnetId: '', ip: '' }, { subnetId: '', ip: '' }])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ name: false, securityGroupIds: false })

  const isValid = name.trim().length > 0 && securityGroupIds.trim().length > 0 && ipConfigs.every(c => c.subnetId.trim().length > 0)

  const addIpConfig = () => setIpConfigs(prev => [...prev, { subnetId: '', ip: '' }])
  const removeIpConfig = (i: number) => setIpConfigs(prev => prev.filter((_, idx) => idx !== i))
  const updateIpConfig = (i: number, field: keyof IpConfig, value: string) =>
    setIpConfigs(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))

  const handleCreate = async () => {
    if (!isValid) return
    setLoading(true)
    const sgIds = securityGroupIds.split(',').map(s => s.trim()).filter(Boolean)
    const ips = ipConfigs.filter(c => c.subnetId.trim()).map(c => ({ SubnetId: c.subnetId.trim(), Ip: c.ip.trim() || undefined }))
    const res = await window.electronAPI.r53rCreateEndpoint(name.trim(), direction, sgIds, ips)
    if (res.success) { onCreated() }
    else showToast('error', res.error ?? 'Failed to create endpoint')
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl flex flex-col max-h-[85vh]" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h3 className="text-sm font-bold text-1">Create Resolver Endpoint</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={14} /></button>
        </div>

        {/* body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Name <span className="text-red-400">*</span></label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              placeholder="my-resolver-endpoint"
              className={`input-base w-full text-sm ${touched.name && !name.trim() ? 'border-red-500/50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Direction <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              {(['INBOUND', 'OUTBOUND'] as const).map(d => (
                <button key={d} onClick={() => setDirection(d)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                    ${direction === d ? 'bg-blue-500/15 border-blue-500/40 text-blue-400' : 'border-theme text-3 hover:text-2'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">
              Security Group IDs <span className="text-red-400">*</span> <span className="normal-case font-normal">(comma-separated)</span>
            </label>
            <input
              type="text" value={securityGroupIds} onChange={e => setSecurityGroupIds(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, securityGroupIds: true }))}
              placeholder="sg-12345678, sg-87654321"
              className={`input-base w-full text-sm font-mono ${touched.securityGroupIds && !securityGroupIds.trim() ? 'border-red-500/50' : ''}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-4 uppercase tracking-wider">
                IP Configurations <span className="text-red-400">*</span> <span className="normal-case font-normal">(min 2)</span>
              </label>
              <button onClick={addIpConfig} className="btn-ghost text-xs flex items-center gap-1 !py-0.5">
                <Plus size={11} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {ipConfigs.map((cfg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text" placeholder={`Subnet ID ${i + 1} *`}
                    value={cfg.subnetId} onChange={e => updateIpConfig(i, 'subnetId', e.target.value)}
                    className="input-base flex-1 text-sm font-mono"
                  />
                  <input
                    type="text" placeholder="IP (optional)"
                    value={cfg.ip} onChange={e => updateIpConfig(i, 'ip', e.target.value)}
                    className="input-base w-32 text-sm font-mono"
                  />
                  {ipConfigs.length > 2 && (
                    <button onClick={() => removeIpConfig(i)} className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-ghost text-xs px-4 py-2">Cancel</button>
          <button onClick={handleCreate} disabled={loading || !isValid}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 transition-colors">
            {loading && <Loader2 size={13} className="animate-spin" />}
            Create Endpoint
          </button>
        </div>
      </div>
    </div>
  )
}
