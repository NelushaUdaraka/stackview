import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Loader2, Trash2, Save } from 'lucide-react'
import type { S3ControlPublicAccessBlock } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  onClose: () => void
}

interface ToggleRowProps {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-theme last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-1 mb-0.5">{label}</p>
        <p className="text-[11px] text-3 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none
          ${value ? 'bg-teal-500' : 'bg-raised border border-theme'}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform
            ${value ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

export default function AccountSettingsPanel({ onClose }: Props) {
  const [config, setConfig] = useState<S3ControlPublicAccessBlock>({
    blockPublicAcls: true,
    ignorePublicAcls: true,
    blockPublicPolicy: true,
    restrictPublicBuckets: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [hasBlock, setHasBlock] = useState(false)
  const { showToast } = useToastContext()

  const loadConfig = async () => {
    setLoading(true)
    const res = await window.electronAPI.s3controlGetPublicAccessBlock()
    if (res.success && res.data) {
      setConfig(res.data)
      setHasBlock(true)
    } else {
      setHasBlock(false)
    }
    setLoading(false)
  }

  useEffect(() => { loadConfig() }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await window.electronAPI.s3controlPutPublicAccessBlock(config)
    setSaving(false)
    if (res.success) { showToast('success', 'Public access block settings saved'); setHasBlock(true) }
    else showToast('error', res.error ?? 'Failed to save settings')
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.s3controlDeletePublicAccessBlock()
    setDeleting(false)
    if (res.success) { showToast('success', 'Public access block removed'); setHasBlock(false) }
    else showToast('error', res.error ?? 'Failed to remove public access block')
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-5 pt-4 pb-4 border-b border-theme shrink-0 flex items-center justify-between" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(13 148 136 / 0.15)' }}>
            <Shield size={18} style={{ color: 'rgb(20 184 166)' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-1 mb-0.5">Account Public Access Block</h2>
            <p className="text-[10px] text-3">Account-level S3 public access settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasBlock && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmDelete ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30' : 'btn-ghost text-red-500 hover:bg-red-500/10'}`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Remove' : 'Remove Block'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'rgb(13 148 136)' }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save Settings
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="flex justify-center p-12 text-3"><Loader2 size={24} className="animate-spin" /></div>
        ) : (
          <div className="space-y-5">
            {!hasBlock && (
              <div className="card p-4 border-amber-500/20" style={{ backgroundColor: 'rgb(245 158 11 / 0.05)' }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                    No account-level public access block is currently configured. All access control is governed by bucket and object policies.
                  </p>
                </div>
              </div>
            )}

            <div className="card p-5">
              <h3 className="text-xs font-bold text-2 flex items-center gap-2 uppercase tracking-wider mb-4">
                <Shield size={14} className="text-teal-500" /> Public Access Block Configuration
              </h3>
              <ToggleRow
                label="Block Public ACLs"
                description="Block new public ACLs and uploading public objects. Existing ACLs remain in effect unless removed."
                value={config.blockPublicAcls}
                onChange={(v) => setConfig({ ...config, blockPublicAcls: v })}
              />
              <ToggleRow
                label="Ignore Public ACLs"
                description="Ignore all public ACLs on buckets and objects. Public ACLs are still saved but won't grant public access."
                value={config.ignorePublicAcls}
                onChange={(v) => setConfig({ ...config, ignorePublicAcls: v })}
              />
              <ToggleRow
                label="Block Public Bucket Policies"
                description="Reject calls to PUT bucket policies if they allow public access. Existing policies can still be managed."
                value={config.blockPublicPolicy}
                onChange={(v) => setConfig({ ...config, blockPublicPolicy: v })}
              />
              <ToggleRow
                label="Restrict Public Buckets"
                description="Only authorized AWS services and principals within the account can access buckets with public policies."
                value={config.restrictPublicBuckets}
                onChange={(v) => setConfig({ ...config, restrictPublicBuckets: v })}
              />
            </div>

            <div className="card p-4 border-theme">
              <p className="text-[11px] text-3 leading-relaxed">
                These settings block public access at the account level and apply to all S3 buckets and objects in account <span className="font-mono text-2">000000000000</span>.
                Bucket-level public access block settings can further restrict access on individual buckets.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
