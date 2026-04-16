import { useState, useCallback, useEffect } from 'react'
import { Network, Plus, Trash2, Loader2, Search, ChevronDown, ChevronRight } from 'lucide-react'
import type { Ec2Vpc, Ec2Subnet } from '../../types'

export default function VPCsView() {
  const [vpcs, setVpcs] = useState<Ec2Vpc[]>([])
  const [subnets, setSubnets] = useState<Ec2Subnet[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [cidrBlock, setCidrBlock] = useState('10.0.0.0/16')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [vpcRes, subnetRes] = await Promise.all([
      window.electronAPI.ec2ListVpcs(),
      window.electronAPI.ec2ListSubnets(),
    ])
    if (vpcRes.success && vpcRes.data) setVpcs(vpcRes.data)
    if (subnetRes.success && subnetRes.data) setSubnets(subnetRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!cidrBlock.trim()) { setError('CIDR block required'); return }
    setCreating(true); setError(null)
    const res = await window.electronAPI.ec2CreateVpc(cidrBlock.trim())
    setCreating(false)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    setShowCreate(false); setCidrBlock('10.0.0.0/16'); load()
  }

  const handleDelete = async (vpcId: string) => {
    if (!confirm(`Delete VPC ${vpcId}?`)) return
    const res = await window.electronAPI.ec2DeleteVpc(vpcId)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    load()
  }

  const filtered = vpcs.filter(v =>
    (v.VpcId ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.CidrBlock ?? '').includes(search) ||
    (v.Tags?.find(t => t.Key === 'Name')?.Value ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input className="sidebar-search pl-7 w-full" placeholder="Search VPCs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1" />
        <span className="text-xs text-3">{filtered.length} VPC{filtered.length !== 1 ? 's' : ''}</span>
        {loading && <Loader2 size={13} className="animate-spin text-3" />}
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
        >
          <Plus size={13} /> Create VPC
        </button>
      </div>

      {showCreate && (
        <div className="px-4 py-3 border-b border-theme shrink-0 flex items-center gap-2" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
          <Network size={13} className="text-orange-500 shrink-0" />
          <input className="input-base text-sm flex-1" placeholder="CIDR block (e.g. 10.0.0.0/16)" value={cidrBlock} onChange={e => setCidrBlock(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
          <button onClick={handleCreate} disabled={creating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg disabled:opacity-50">
            {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
          </button>
          <button onClick={() => setShowCreate(false)} className="btn-ghost text-xs rounded-lg">Cancel</button>
        </div>
      )}

      {error && <p className="mx-4 mt-2 text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 shrink-0">{error}</p>}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <Network size={32} className="text-4 mb-3 opacity-20" />
            <p className="text-sm text-3 font-medium">{loading ? 'Loading...' : 'No VPCs found'}</p>
          </div>
        ) : (
          filtered.map(vpc => {
            const isExpanded = expanded === vpc.VpcId
            const vpcSubnets = subnets.filter(s => s.VpcId === vpc.VpcId)
            const vpcName = vpc.Tags?.find(t => t.Key === 'Name')?.Value
            return (
              <div key={vpc.VpcId} className="border-b border-theme">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-raised transition-colors cursor-pointer" onClick={() => setExpanded(isExpanded ? null : vpc.VpcId ?? null)}>
                  <button className="text-3 shrink-0">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <Network size={14} className="text-orange-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-1">{vpcName || vpc.VpcId}</p>
                    <p className="text-[10px] text-3 font-mono">{vpc.VpcId} · {vpc.CidrBlock}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {vpc.IsDefault && (
                      <span className="text-[10px] font-bold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">Default</span>
                    )}
                    <span className="text-[10px] text-3">{vpc.State}</span>
                    <span className="text-[10px] text-3">{vpcSubnets.length} subnet{vpcSubnets.length !== 1 ? 's' : ''}</span>
                  </div>
                  {!vpc.IsDefault && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(vpc.VpcId!) }} className="p-1.5 text-3 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {isExpanded && vpcSubnets.length > 0 && (
                  <div className="px-10 pb-4" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.3)' }}>
                    <p className="text-[10px] font-bold text-3 uppercase tracking-wider mb-2">Subnets</p>
                    <div className="rounded-xl border border-theme overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
                            <th className="px-3 py-2 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Subnet ID</th>
                            <th className="px-3 py-2 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">CIDR</th>
                            <th className="px-3 py-2 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">AZ</th>
                            <th className="px-3 py-2 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Available IPs</th>
                            <th className="px-3 py-2 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">State</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vpcSubnets.map(s => (
                            <tr key={s.SubnetId} className="border-b border-theme last:border-0">
                              <td className="px-3 py-2 font-mono text-2">{s.SubnetId}</td>
                              <td className="px-3 py-2 font-mono text-2">{s.CidrBlock}</td>
                              <td className="px-3 py-2 text-2">{s.AvailabilityZone}</td>
                              <td className="px-3 py-2 text-2">{s.AvailableIpAddressCount}</td>
                              <td className="px-3 py-2 text-2">{s.State}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
