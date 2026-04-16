import { useState, useEffect, useCallback } from 'react'
import { Trash2, Loader2, Plus, X, Shield } from 'lucide-react'
import type { R53FirewallRuleGroup, R53FirewallRule, R53FirewallRuleGroupAssociation, R53FirewallDomainList } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  group: R53FirewallRuleGroup
  domainLists: R53FirewallDomainList[]
  onDeleted: () => void
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-theme/40 last:border-0">
      <span className="text-[10px] font-bold text-4 uppercase tracking-wider w-36 flex-shrink-0">{label}</span>
      <span className={`text-xs font-mono break-all ${value == null || value === '' ? 'text-4' : 'text-2'}`}>
        {value == null || value === '' ? '—' : String(value)}
      </span>
    </div>
  )
}

const ACTION_COLORS: Record<string, string> = {
  ALLOW: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  BLOCK: 'text-red-400 border-red-500/30 bg-red-500/10',
  ALERT: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
}

export default function FirewallRuleGroupDetail({ group, domainLists, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [tab, setTab] = useState<'info' | 'rules' | 'associations'>('info')
  const [rules, setRules] = useState<R53FirewallRule[]>([])
  const [associations, setAssociations] = useState<R53FirewallRuleGroupAssociation[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAddRule, setShowAddRule] = useState(false)
  const [showAssociate, setShowAssociate] = useState(false)

  // add rule form
  const [ruleName, setRuleName] = useState('')
  const [ruleDomainListId, setRuleDomainListId] = useState('')
  const [rulePriority, setRulePriority] = useState('100')
  const [ruleAction, setRuleAction] = useState('ALLOW')
  const [blockResponse, setBlockResponse] = useState('NODATA')
  const [addingRule, setAddingRule] = useState(false)

  // associate form
  const [assocVpcId, setAssocVpcId] = useState('')
  const [assocPriority, setAssocPriority] = useState('100')
  const [assocName, setAssocName] = useState('')
  const [associating, setAssociating] = useState(false)

  const loadRules = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.r53rListFwRules(group.id)
    if (res.success && res.data) setRules(res.data)
    setLoading(false)
  }, [group.id])

  const loadAssociations = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.r53rListFwRuleGroupAssociations(group.id)
    if (res.success && res.data) setAssociations(res.data)
    setLoading(false)
  }, [group.id])

  useEffect(() => {
    if (tab === 'rules') loadRules()
    else if (tab === 'associations') loadAssociations()
  }, [tab, loadRules, loadAssociations])

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.r53rDeleteFwRuleGroup(group.id)
    if (res.success) onDeleted()
    else showToast('error', res.error ?? 'Failed to delete group')
    setDeleting(false)
  }

  const handleAddRule = async () => {
    if (!ruleName.trim() || !ruleDomainListId) return
    setAddingRule(true)
    const res = await window.electronAPI.r53rCreateFwRule(
      group.id, ruleDomainListId, ruleName.trim(), parseInt(rulePriority) || 100, ruleAction,
      ruleAction === 'BLOCK' ? blockResponse : undefined
    )
    if (res.success) {
      showToast('success', 'Firewall rule created')
      setShowAddRule(false); setRuleName(''); setRuleDomainListId(''); setRulePriority('100'); setRuleAction('ALLOW')
      loadRules()
    } else showToast('error', res.error ?? 'Failed to create rule')
    setAddingRule(false)
  }

  const handleDeleteRule = async (domainListId: string, name: string) => {
    const res = await window.electronAPI.r53rDeleteFwRule(group.id, domainListId, name)
    if (res.success) { showToast('success', 'Rule deleted'); loadRules() }
    else showToast('error', res.error ?? 'Failed to delete rule')
  }

  const handleAssociate = async () => {
    if (!assocVpcId.trim()) return
    setAssociating(true)
    const res = await window.electronAPI.r53rAssociateFwRuleGroup(group.id, assocVpcId.trim(), parseInt(assocPriority) || 100, assocName.trim() || undefined)
    if (res.success) {
      showToast('success', 'Rule group associated with VPC')
      setShowAssociate(false); setAssocVpcId(''); setAssocPriority('100'); setAssocName('')
      loadAssociations()
    } else showToast('error', res.error ?? 'Failed to associate')
    setAssociating(false)
  }

  const handleDisassociate = async (assocId: string) => {
    const res = await window.electronAPI.r53rDisassociateFwRuleGroup(assocId)
    if (res.success) { showToast('success', 'Disassociated'); loadAssociations() }
    else showToast('error', res.error ?? 'Failed to disassociate')
  }

  const tabs = [
    { id: 'info'         as const, label: 'Info' },
    { id: 'rules'        as const, label: 'Firewall Rules' },
    { id: 'associations' as const, label: 'VPC Associations' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
              <Shield size={18} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-1 truncate">{group.name}</h2>
              <p className="text-xs text-3 font-mono truncate">{group.id}</p>
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
            <InfoRow label="Group ID"     value={group.id} />
            <InfoRow label="Name"         value={group.name} />
            <InfoRow label="Status"       value={group.status} />
            <InfoRow label="Share Status" value={group.shareStatus} />
            <InfoRow label="Rule Count"   value={group.ruleCount} />
            <InfoRow label="ARN"          value={group.arn} />
            <InfoRow label="Created"      value={group.creationTime} />
          </div>
        ) : tab === 'rules' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Firewall Rules</p>
              <button onClick={() => setShowAddRule(v => !v)} className="btn-ghost text-xs flex items-center gap-1">
                <Plus size={12} /> Add Rule
              </button>
            </div>

            {showAddRule && (
              <div className="card p-4 space-y-2">
                <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Add Firewall Rule</p>
                <input type="text" placeholder="Rule name" value={ruleName} onChange={e => setRuleName(e.target.value)} className="input-base w-full text-sm" />
                <select value={ruleDomainListId} onChange={e => setRuleDomainListId(e.target.value)} className="input-base w-full text-sm">
                  <option value="">Select domain list…</option>
                  {domainLists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="Priority" value={rulePriority} onChange={e => setRulePriority(e.target.value)} className="input-base flex-1 text-sm" />
                  <select value={ruleAction} onChange={e => setRuleAction(e.target.value)} className="input-base flex-1 text-sm">
                    <option value="ALLOW">ALLOW</option>
                    <option value="BLOCK">BLOCK</option>
                    <option value="ALERT">ALERT</option>
                  </select>
                </div>
                {ruleAction === 'BLOCK' && (
                  <select value={blockResponse} onChange={e => setBlockResponse(e.target.value)} className="input-base w-full text-sm">
                    <option value="NODATA">NODATA</option>
                    <option value="NXDOMAIN">NXDOMAIN</option>
                    <option value="OVERRIDE">OVERRIDE</option>
                  </select>
                )}
                <div className="flex gap-2">
                  <button onClick={handleAddRule} disabled={addingRule || !ruleName.trim() || !ruleDomainListId}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                    {addingRule && <Loader2 size={12} className="animate-spin" />} Create
                  </button>
                  <button onClick={() => setShowAddRule(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-3" /></div>
            ) : rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Shield size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No firewall rules</p>
              </div>
            ) : (
              <div className="card divide-y divide-theme/40">
                {rules.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-1">{r.name}</p>
                        <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded border flex-shrink-0
                          ${ACTION_COLORS[r.action] ?? 'text-4 border-theme'}`}>{r.action}</span>
                      </div>
                      <p className="text-xs text-4">Priority: {r.priority} · {r.firewallDomainListId}</p>
                    </div>
                    <button onClick={() => handleDeleteRule(r.firewallDomainListId, r.name)}
                      className="text-red-400 hover:text-red-300 transition-colors ml-3">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider">VPC Associations</p>
              <button onClick={() => setShowAssociate(v => !v)} className="btn-ghost text-xs flex items-center gap-1">
                <Plus size={12} /> Associate VPC
              </button>
            </div>

            {showAssociate && (
              <div className="card p-4 space-y-2">
                <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Associate with VPC</p>
                <input type="text" placeholder="VPC ID (required)" value={assocVpcId} onChange={e => setAssocVpcId(e.target.value)} className="input-base w-full text-sm font-mono" />
                <input type="text" placeholder="Name (optional)" value={assocName} onChange={e => setAssocName(e.target.value)} className="input-base w-full text-sm" />
                <input type="number" placeholder="Priority" value={assocPriority} onChange={e => setAssocPriority(e.target.value)} className="input-base w-full text-sm" />
                <div className="flex gap-2">
                  <button onClick={handleAssociate} disabled={associating || !assocVpcId.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                    {associating && <Loader2 size={12} className="animate-spin" />} Associate
                  </button>
                  <button onClick={() => setShowAssociate(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-3" /></div>
            ) : associations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Shield size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No VPC associations</p>
              </div>
            ) : (
              <div className="card divide-y divide-theme/40">
                {associations.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-1">{a.name ?? a.id}</p>
                      <p className="text-xs text-4 font-mono">VPC: {a.vpcId} · Priority: {a.priority}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-4">{a.status}</span>
                      <button onClick={() => handleDisassociate(a.id)} className="text-red-400 hover:text-red-300 transition-colors">
                        <X size={14} />
                      </button>
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
