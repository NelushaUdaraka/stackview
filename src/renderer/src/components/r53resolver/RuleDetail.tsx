import { useState, useEffect, useCallback } from 'react'
import { Trash2, Loader2, Plus, X, GitBranch } from 'lucide-react'
import type { R53ResolverRule, R53RuleAssociation } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  rule: R53ResolverRule
  onDeleted: () => void
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-theme/40 last:border-0">
      <span className="text-[10px] font-bold text-4 uppercase tracking-wider w-44 flex-shrink-0">{label}</span>
      <span className={`text-xs font-mono break-all ${!value ? 'text-4' : 'text-2'}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

export default function RuleDetail({ rule, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [tab, setTab] = useState<'info' | 'associations'>('info')
  const [associations, setAssociations] = useState<R53RuleAssociation[]>([])
  const [loadingAssoc, setLoadingAssoc] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAssociate, setShowAssociate] = useState(false)
  const [vpcId, setVpcId] = useState('')
  const [associating, setAssociating] = useState(false)

  const loadAssociations = useCallback(async () => {
    setLoadingAssoc(true)
    const res = await window.electronAPI.r53rListRuleAssociations(rule.id)
    if (res.success && res.data) setAssociations(res.data)
    setLoadingAssoc(false)
  }, [rule.id])

  useEffect(() => { if (tab === 'associations') loadAssociations() }, [tab, loadAssociations])

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.r53rDeleteRule(rule.id)
    if (res.success) { onDeleted() }
    else showToast('error', res.error ?? 'Failed to delete rule')
    setDeleting(false)
  }

  const handleAssociate = async () => {
    if (!vpcId.trim()) return
    setAssociating(true)
    const res = await window.electronAPI.r53rAssociateRule(rule.id, vpcId.trim())
    if (res.success) {
      showToast('success', 'Rule associated with VPC')
      setShowAssociate(false); setVpcId(''); loadAssociations()
    } else showToast('error', res.error ?? 'Failed to associate rule')
    setAssociating(false)
  }

  const handleDisassociate = async (assocId: string) => {
    const res = await window.electronAPI.r53rDisassociateRule(assocId)
    if (res.success) { showToast('success', 'Rule disassociated'); loadAssociations() }
    else showToast('error', res.error ?? 'Failed to disassociate rule')
  }

  const tabs = [
    { id: 'info'         as const, label: 'Info' },
    { id: 'associations' as const, label: 'VPC Associations' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
              <GitBranch size={18} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-1 truncate">{rule.name ?? rule.id}</h2>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 text-4 border-theme">
                  {rule.ruleType}
                </span>
              </div>
              <p className="text-xs text-3 font-mono truncate">{rule.id}</p>
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
            <InfoRow label="Rule ID"             value={rule.id} />
            <InfoRow label="Name"                value={rule.name} />
            <InfoRow label="Rule Type"           value={rule.ruleType} />
            <InfoRow label="Status"              value={rule.status} />
            <InfoRow label="Domain Name"         value={rule.domainName} />
            <InfoRow label="Resolver Endpoint"   value={rule.resolverEndpointId} />
            <InfoRow label="ARN"                 value={rule.arn} />
            <InfoRow label="Created"             value={rule.creationTime} />
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
                <input type="text" placeholder="VPC ID (required)"
                  value={vpcId} onChange={e => setVpcId(e.target.value)}
                  className="input-base w-full text-sm font-mono" />
                <div className="flex gap-2">
                  <button onClick={handleAssociate} disabled={associating || !vpcId.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                    {associating && <Loader2 size={12} className="animate-spin" />} Associate
                  </button>
                  <button onClick={() => { setShowAssociate(false); setVpcId('') }} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                </div>
              </div>
            )}

            {loadingAssoc ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-3" /></div>
            ) : associations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <GitBranch size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No VPC associations</p>
              </div>
            ) : (
              <div className="card divide-y divide-theme/40">
                {associations.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-1">{a.name ?? a.id}</p>
                      <p className="text-xs text-4 font-mono">{a.vpcId ?? '—'}</p>
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
