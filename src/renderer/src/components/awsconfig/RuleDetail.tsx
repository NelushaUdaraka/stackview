import { useState, useCallback, useEffect } from 'react'
import { Trash2, Loader2, RefreshCw } from 'lucide-react'
import type { ConfigRule, ConfigComplianceResult } from '../../types'

interface Props {
  rule: ConfigRule
  onDeleted: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

const COMPLIANCE_COLORS: Record<string, string> = {
  COMPLIANT:         'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  NON_COMPLIANT:     'text-red-400 bg-red-500/10 border-red-500/30',
  NOT_APPLICABLE:    'text-4 bg-raised border-theme',
  INSUFFICIENT_DATA: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-mono break-all ${!value ? 'text-4' : 'text-2'}`}>{value || '—'}</p>
    </div>
  )
}

export default function RuleDetail({ rule, onDeleted, showToast }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [compliance, setCompliance] = useState<ConfigComplianceResult[]>([])
  const [loadingCompliance, setLoadingCompliance] = useState(false)

  const loadCompliance = useCallback(async () => {
    setLoadingCompliance(true)
    const res = await window.electronAPI.configGetComplianceDetailsByRule(rule.name)
    if (res.success && res.data) setCompliance(res.data)
    setLoadingCompliance(false)
  }, [rule.name])

  useEffect(() => { loadCompliance() }, [rule.name]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const res = await window.electronAPI.configDeleteRule(rule.name)
    if (res.success) { onDeleted() }
    else { showToast('error', res.error ?? 'Delete failed'); setConfirmDelete(false) }
    setDeleting(false)
  }, [confirmDelete, rule.name, onDeleted, showToast])

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-0.5">Config Rule</p>
          <h2 className="text-sm font-semibold text-1">{rule.name}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
              ${confirmDelete ? 'bg-red-600 hover:bg-red-500 text-white' : 'btn-ghost text-red-400 hover:text-red-300'}`}
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {confirmDelete ? 'Confirm' : 'Delete'}
          </button>
          {confirmDelete && !deleting && (
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost text-xs px-2 py-1.5">Cancel</button>
          )}
        </div>
      </div>

      {/* info */}
      <div className="card p-4 border-theme grid grid-cols-2 gap-4">
        <InfoRow label="Source Owner" value={rule.sourceOwner} />
        <InfoRow label="Source Identifier" value={rule.sourceIdentifier} />
        <InfoRow label="State" value={rule.state} />
        <InfoRow label="ARN" value={rule.arn} />
        {rule.description && <div className="col-span-2"><InfoRow label="Description" value={rule.description} /></div>}
        {rule.scope && (
          <>
            {rule.scope.tagKey && <InfoRow label="Scope Tag Key" value={rule.scope.tagKey} />}
            {rule.scope.tagValue && <InfoRow label="Scope Tag Value" value={rule.scope.tagValue} />}
          </>
        )}
      </div>

      {/* scope resource types */}
      {rule.scope && rule.scope.resourceTypes.length > 0 && (
        <div className="card p-4 border-theme">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-2">Scope Resource Types</p>
          <div className="flex flex-wrap gap-1.5">
            {rule.scope.resourceTypes.map(rt => (
              <span key={rt} className="text-[10px] font-mono bg-raised px-2 py-0.5 rounded border border-theme text-3">{rt}</span>
            ))}
          </div>
        </div>
      )}

      {/* compliance */}
      <div className="card p-4 border-theme">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Compliance Results</p>
          <button onClick={loadCompliance} disabled={loadingCompliance} className="btn-ghost !p-1">
            <RefreshCw size={12} className={loadingCompliance ? 'animate-spin' : ''} />
          </button>
        </div>
        {loadingCompliance ? (
          <div className="text-xs text-4 text-center py-4">Loading…</div>
        ) : compliance.length === 0 ? (
          <div className="text-xs text-4 text-center py-4">No compliance data</div>
        ) : (
          <div className="space-y-1.5">
            {compliance.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-theme/50 last:border-0">
                <div className="min-w-0">
                  <p className="text-xs text-2 font-mono truncate">{c.resourceId || '—'}</p>
                  {c.resourceType && <p className="text-[10px] text-4">{c.resourceType}</p>}
                  {c.annotation && <p className="text-[10px] text-3 italic">{c.annotation}</p>}
                </div>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${COMPLIANCE_COLORS[c.complianceType] ?? 'text-4 bg-raised border-theme'}`}>
                  {c.complianceType}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
