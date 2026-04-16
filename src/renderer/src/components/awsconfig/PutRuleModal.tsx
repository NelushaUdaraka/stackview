import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface Props {
  onSaved: () => void
  onClose: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

// Common AWS managed rules
const MANAGED_RULES = [
  'ACCESS_KEYS_ROTATED',
  'ACM_CERTIFICATE_EXPIRATION_CHECK',
  'CLOUD_TRAIL_ENABLED',
  'CLOUDWATCH_ALARM_ACTION_CHECK',
  'EC2_INSTANCE_DETAILED_MONITORING_ENABLED',
  'EC2_VOLUME_INUSE_CHECK',
  'EIP_ATTACHED',
  'ENCRYPTED_VOLUMES',
  'IAM_PASSWORD_POLICY',
  'IAM_ROOT_ACCESS_KEY_CHECK',
  'IAM_USER_MFA_ENABLED',
  'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
  'RDS_STORAGE_ENCRYPTED',
  'RESTRICTED_INCOMING_TRAFFIC',
  'ROOT_ACCOUNT_MFA_ENABLED',
  'S3_BUCKET_PUBLIC_READ_PROHIBITED',
  'S3_BUCKET_PUBLIC_WRITE_PROHIBITED',
  'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
  'VPC_DEFAULT_SECURITY_GROUP_CLOSED',
  'VPC_FLOW_LOGS_ENABLED',
]

export default function PutRuleModal({ onSaved, onClose, showToast }: Props) {
  const [name, setName] = useState('')
  const [sourceOwner, setSourceOwner] = useState<'AWS' | 'CUSTOM_LAMBDA'>('AWS')
  const [sourceIdentifier, setSourceIdentifier] = useState('')
  const [description, setDescription] = useState('')
  const [tagKey, setTagKey] = useState('')
  const [tagValue, setTagValue] = useState('')
  const [resourceTypesRaw, setResourceTypesRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ name: false, sourceIdentifier: false })

  const isValid = name.trim().length > 0 && sourceIdentifier.trim().length > 0

  const handleSave = async () => {
    const resourceTypes = resourceTypesRaw.split('\n').map(s => s.trim()).filter(Boolean)
    setLoading(true)
    const res = await window.electronAPI.configPutRule(
      name.trim(), sourceOwner, sourceIdentifier.trim(),
      description.trim() || undefined,
      tagKey.trim() || undefined,
      tagValue.trim() || undefined,
      resourceTypes.length > 0 ? resourceTypes : undefined
    )
    if (res.success) { onSaved() }
    else { showToast('error', res.error ?? 'Save failed') }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-base border border-theme rounded-xl shadow-xl w-[520px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h2 className="text-sm font-semibold text-1">Add Config Rule</h2>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">Rule Name <span className="text-red-400">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} onBlur={() => setTouched(t => ({ ...t, name: true }))} placeholder="my-config-rule" className={`input-base w-full text-sm ${touched.name && name.trim() === '' ? 'border-red-500/50' : ''}`} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input-base w-full text-sm" />
          </div>
          {/* Source Owner toggle */}
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">Source Owner</label>
            <div className="flex gap-2">
              {(['AWS', 'CUSTOM_LAMBDA'] as const).map(o => (
                <button
                  key={o}
                  onClick={() => setSourceOwner(o)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                    ${sourceOwner === o ? 'bg-amber-500/15 border-amber-500/40 text-amber-500' : 'border-theme text-3 hover:text-2'}`}
                >
                  {o === 'AWS' ? 'AWS Managed' : 'Custom Lambda'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">
              {sourceOwner === 'AWS' ? 'Managed Rule Name' : 'Lambda Function ARN'} <span className="text-red-400">*</span>
            </label>
            {sourceOwner === 'AWS' ? (
              <select value={sourceIdentifier} onChange={e => setSourceIdentifier(e.target.value)} onBlur={() => setTouched(t => ({ ...t, sourceIdentifier: true }))} className={`input-base w-full text-sm ${touched.sourceIdentifier && sourceIdentifier.trim() === '' ? 'border-red-500/50' : ''}`}>
                <option value="">Select a managed rule…</option>
                {MANAGED_RULES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <input type="text" value={sourceIdentifier} onChange={e => setSourceIdentifier(e.target.value)} onBlur={() => setTouched(t => ({ ...t, sourceIdentifier: true }))} placeholder="arn:aws:lambda:..." className={`input-base w-full text-sm font-mono ${touched.sourceIdentifier && sourceIdentifier.trim() === '' ? 'border-red-500/50' : ''}`} />
            )}
            {touched.sourceIdentifier && sourceIdentifier.trim() === '' && (
              <p className="text-[10px] text-red-400 mt-1">Source identifier is required</p>
            )}
          </div>
          {/* Scope */}
          <div className="border-t border-theme pt-3">
            <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-2">Scope (Optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-4 block mb-1">Tag Key</label>
                <input type="text" value={tagKey} onChange={e => setTagKey(e.target.value)} className="input-base w-full text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-4 block mb-1">Tag Value</label>
                <input type="text" value={tagValue} onChange={e => setTagValue(e.target.value)} className="input-base w-full text-xs" />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-[10px] text-4 block mb-1">Resource Types (one per line)</label>
              <textarea
                value={resourceTypesRaw}
                onChange={e => setResourceTypesRaw(e.target.value)}
                rows={3}
                placeholder="AWS::EC2::Instance&#10;AWS::S3::Bucket"
                className="input-base w-full text-xs font-mono resize-none"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading || !isValid}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 size={13} className="animate-spin" />} Save Rule
          </button>
        </div>
      </div>
    </div>
  )
}
