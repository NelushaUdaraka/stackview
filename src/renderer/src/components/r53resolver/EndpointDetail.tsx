import { useState, useEffect, useCallback } from 'react'
import { Trash2, Loader2, Plus, X, Network, RefreshCw } from 'lucide-react'
import type { R53ResolverEndpoint } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface IpAddress {
  ip?: string
  subnetId?: string
  status?: string
}

interface Props {
  endpoint: R53ResolverEndpoint
  onDeleted: () => void
  onChanged: () => void
}

const STATUS_COLOR: Record<string, string> = {
  OPERATIONAL:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  CREATING:      'text-amber-400 bg-amber-500/10 border-amber-500/30',
  DELETING:      'text-red-400 bg-red-500/10 border-red-500/30',
  ACTION_NEEDED: 'text-red-400 bg-red-500/10 border-red-500/30',
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-theme/40 last:border-0">
      <span className="text-[10px] font-bold text-4 uppercase tracking-wider w-40 flex-shrink-0">{label}</span>
      <span className={`text-xs font-mono break-all ${value == null || value === '' ? 'text-4' : 'text-2'}`}>
        {value == null || value === '' ? '—' : String(value)}
      </span>
    </div>
  )
}

export default function EndpointDetail({ endpoint, onDeleted, onChanged }: Props) {
  const { showToast } = useToastContext()
  const [tab, setTab] = useState<'info' | 'ips'>('info')
  const [ipAddresses, setIpAddresses] = useState<IpAddress[]>([])
  const [loadingIps, setLoadingIps] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAddIp, setShowAddIp] = useState(false)
  const [newIp, setNewIp] = useState('')
  const [newSubnet, setNewSubnet] = useState('')
  const [addingIp, setAddingIp] = useState(false)

  const loadIps = useCallback(async () => {
    setLoadingIps(true)
    const res = await window.electronAPI.r53rListEndpointIps(endpoint.id)
    if (res.success && res.data) setIpAddresses(res.data as IpAddress[])
    setLoadingIps(false)
  }, [endpoint.id])

  useEffect(() => { if (tab === 'ips') loadIps() }, [tab, loadIps])

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.r53rDeleteEndpoint(endpoint.id)
    if (res.success) { onDeleted() }
    else showToast('error', res.error ?? 'Failed to delete endpoint')
    setDeleting(false)
  }

  const handleAddIp = async () => {
    if (!newSubnet.trim()) return
    setAddingIp(true)
    const res = await window.electronAPI.r53rAssociateEndpointIp(endpoint.id, newSubnet.trim(), newIp.trim() || undefined)
    if (res.success) {
      showToast('success', 'IP address added')
      setShowAddIp(false); setNewIp(''); setNewSubnet('')
      loadIps(); onChanged()
    } else showToast('error', res.error ?? 'Failed to add IP')
    setAddingIp(false)
  }

  const handleRemoveIp = async (subnetId: string) => {
    const res = await window.electronAPI.r53rDisassociateEndpointIp(endpoint.id, subnetId)
    if (res.success) { showToast('success', 'IP address removed'); loadIps(); onChanged() }
    else showToast('error', res.error ?? 'Failed to remove IP')
  }

  const tabs = [
    { id: 'info' as const, label: 'Info' },
    { id: 'ips'  as const, label: 'IP Addresses' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
              <Network size={18} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-1 truncate">{endpoint.name ?? endpoint.id}</h2>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border flex-shrink-0
                  ${STATUS_COLOR[endpoint.status] ?? 'text-4 border-theme'}`}>{endpoint.status}</span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 text-blue-400 border-blue-500/30 bg-blue-500/10">
                  {endpoint.direction}
                </span>
              </div>
              <p className="text-xs text-3 font-mono truncate">{endpoint.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'btn-ghost text-red-400 hover:bg-red-500/10'}`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>
        <div className="flex items-center -mb-px">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${tab === t.id ? 'border-blue-400 text-blue-400' : 'border-transparent text-3 hover:text-1'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="flex-1 overflow-auto p-5">
        {tab === 'info' ? (
          <div className="card p-4">
            <InfoRow label="Endpoint ID"    value={endpoint.id} />
            <InfoRow label="Name"           value={endpoint.name} />
            <InfoRow label="Direction"      value={endpoint.direction} />
            <InfoRow label="Status"         value={endpoint.status} />
            <InfoRow label="Status Message" value={endpoint.statusMessage} />
            <InfoRow label="Host VPC ID"    value={endpoint.hostVPCId} />
            <InfoRow label="IP Count"       value={endpoint.ipAddressCount} />
            <InfoRow label="Security Groups" value={endpoint.securityGroupIds.join(', ')} />
            <InfoRow label="ARN"            value={endpoint.arn} />
            <InfoRow label="Created"        value={endpoint.creationTime} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider">IP Addresses</p>
              <button onClick={() => setShowAddIp(v => !v)} className="btn-ghost text-xs flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>

            {showAddIp && (
              <div className="card p-4 space-y-2">
                <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Add IP Address</p>
                <input type="text" placeholder="Subnet ID (required)"
                  value={newSubnet} onChange={e => setNewSubnet(e.target.value)}
                  className="input-base w-full text-sm font-mono" />
                <input type="text" placeholder="IP address (optional — auto-assigned)"
                  value={newIp} onChange={e => setNewIp(e.target.value)}
                  className="input-base w-full text-sm font-mono" />
                <div className="flex gap-2">
                  <button onClick={handleAddIp} disabled={addingIp || !newSubnet.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                    {addingIp && <Loader2 size={12} className="animate-spin" />} Add
                  </button>
                  <button onClick={() => { setShowAddIp(false); setNewIp(''); setNewSubnet('') }} className="btn-ghost text-xs px-3 py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loadingIps ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-3" /></div>
            ) : ipAddresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Network size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No IP addresses</p>
              </div>
            ) : (
              <div className="card divide-y divide-theme/40">
                {ipAddresses.map((ip, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-mono text-1">{ip.ip ?? '—'}</p>
                      <p className="text-xs text-4">{ip.subnetId ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-4">{ip.status ?? '—'}</span>
                      {ip.subnetId && (
                        <button onClick={() => handleRemoveIp(ip.subnetId!)}
                          className="text-red-400 hover:text-red-300 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
