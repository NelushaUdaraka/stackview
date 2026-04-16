import { useState, useCallback, useEffect } from 'react'
import { ShieldCheck, Plus, Trash2, Loader2, Search, ChevronDown, ChevronRight } from 'lucide-react'
import type { Ec2SecurityGroup, Ec2IpPermission } from '../../types'

function formatPermission(p: Ec2IpPermission): string {
  const proto = p.IpProtocol === '-1' ? 'All Traffic' : p.IpProtocol?.toUpperCase() ?? '?'
  const ports = p.FromPort !== undefined && p.ToPort !== undefined
    ? p.FromPort === p.ToPort ? ` :${p.FromPort}` : ` :${p.FromPort}-${p.ToPort}`
    : ''
  const cidrs = p.IpRanges?.map(r => r.CidrIp).join(', ') ?? ''
  return `${proto}${ports} — ${cidrs || 'SG-ref'}`
}

export default function SecurityGroupsView() {
  const [groups, setGroups] = useState<Ec2SecurityGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', vpcId: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add ingress rule form per group
  const [ruleForm, setRuleForm] = useState<Record<string, { protocol: string; from: string; to: string; cidr: string }>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.ec2ListSecurityGroups()
    if (res.success && res.data) setGroups(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.description.trim()) { setError('Name and description required'); return }
    setCreating(true); setError(null)
    const res = await window.electronAPI.ec2CreateSecurityGroup({
      groupName: form.name.trim(),
      description: form.description.trim(),
      vpcId: form.vpcId.trim() || undefined,
    })
    setCreating(false)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    setShowCreate(false); setForm({ name: '', description: '', vpcId: '' }); load()
  }

  const handleDelete = async (groupId: string) => {
    if (!confirm(`Delete security group ${groupId}?`)) return
    const res = await window.electronAPI.ec2DeleteSecurityGroup(groupId)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    load()
  }

  const handleAddRule = async (groupId: string) => {
    const rf = ruleForm[groupId] ?? { protocol: 'tcp', from: '80', to: '80', cidr: '0.0.0.0/0' }
    const res = await window.electronAPI.ec2AuthorizeSecurityGroupIngress({
      groupId,
      protocol: rf.protocol,
      fromPort: parseInt(rf.from),
      toPort: parseInt(rf.to),
      cidrIp: rf.cidr,
    })
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    load()
  }

  const filtered = groups.filter(g =>
    (g.GroupName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (g.GroupId ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input className="sidebar-search pl-7 w-full" placeholder="Search security groups..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1" />
        <span className="text-xs text-3">{filtered.length} group{filtered.length !== 1 ? 's' : ''}</span>
        {loading && <Loader2 size={13} className="animate-spin text-3" />}
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
        >
          <Plus size={13} /> Create Group
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="px-4 py-3 border-b border-theme shrink-0 space-y-2" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
          <div className="flex gap-2">
            <input className="input-base text-sm flex-1" placeholder="Group name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="input-base text-sm flex-1" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <input className="input-base text-sm w-40" placeholder="VPC ID (optional)" value={form.vpcId} onChange={e => setForm(f => ({ ...f, vpcId: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg disabled:opacity-50">
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost text-xs rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {error && <p className="mx-4 mt-2 text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 shrink-0">{error}</p>}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <ShieldCheck size={32} className="text-4 mb-3 opacity-20" />
            <p className="text-sm text-3 font-medium">{loading ? 'Loading...' : 'No security groups'}</p>
          </div>
        ) : (
          filtered.map(sg => {
            const isExpanded = expanded === sg.GroupId
            const rf = ruleForm[sg.GroupId ?? ''] ?? { protocol: 'tcp', from: '80', to: '80', cidr: '0.0.0.0/0' }
            const setRf = (patch: Partial<typeof rf>) =>
              setRuleForm(prev => ({ ...prev, [sg.GroupId!]: { ...rf, ...patch } }))
            return (
              <div key={sg.GroupId} className="border-b border-theme">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-raised transition-colors cursor-pointer" onClick={() => setExpanded(isExpanded ? null : sg.GroupId ?? null)}>
                  <button className="text-3 shrink-0">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <ShieldCheck size={14} className="text-orange-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-1">{sg.GroupName}</p>
                    <p className="text-[10px] text-3 font-mono">{sg.GroupId} {sg.VpcId ? `· ${sg.VpcId}` : ''}</p>
                  </div>
                  <span className="text-[10px] text-3 shrink-0">{sg.IpPermissions?.length ?? 0} inbound rules</span>
                  <button onClick={e => { e.stopPropagation(); handleDelete(sg.GroupId!) }} className="p-1.5 text-3 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-10 pb-4" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.3)' }}>
                    <p className="text-[10px] font-bold text-3 uppercase tracking-wider mb-2">Inbound Rules</p>
                    {(sg.IpPermissions?.length ?? 0) === 0 ? (
                      <p className="text-xs text-4 mb-3">No inbound rules</p>
                    ) : (
                      <div className="space-y-1 mb-3">
                        {sg.IpPermissions!.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-2 bg-raised rounded-lg px-3 py-1.5">
                            <span className="font-mono">{formatPermission(p)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add ingress rule */}
                    <p className="text-[10px] font-bold text-3 uppercase tracking-wider mb-2 mt-3">Add Inbound Rule</p>
                    <div className="flex gap-2 flex-wrap">
                      <select className="input-base text-xs w-20" value={rf.protocol} onChange={e => setRf({ protocol: e.target.value })}>
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                        <option value="icmp">ICMP</option>
                        <option value="-1">All</option>
                      </select>
                      <input className="input-base text-xs w-16" placeholder="From" value={rf.from} onChange={e => setRf({ from: e.target.value })} />
                      <input className="input-base text-xs w-16" placeholder="To" value={rf.to} onChange={e => setRf({ to: e.target.value })} />
                      <input className="input-base text-xs w-32" placeholder="CIDR (0.0.0.0/0)" value={rf.cidr} onChange={e => setRf({ cidr: e.target.value })} />
                      <button onClick={() => handleAddRule(sg.GroupId!)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors">
                        <Plus size={11} /> Add
                      </button>
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
