import { useState, useEffect } from 'react'
import { Shield, Key, Settings, Trash2, Check, AlertTriangle, Copy, Loader2, Save, Edit2 } from 'lucide-react'
import type { SecretInfo, SecretValue } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  secret: SecretInfo
  onDeleted: () => void
}

type Tab = 'value' | 'overview'

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export default function SecretDetail({ secret, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<Tab>('value')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copiedName, setCopiedName] = useState(false)
  const [copiedArn, setCopiedArn] = useState(false)

  useEffect(() => {
    setActiveTab('value')
    setConfirmDelete(false)
  }, [secret.name])

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setDeleting(true)
    const result = await window.electronAPI.secretsManagerDeleteSecret(secret.name)
    setDeleting(false)
    if (result.success) {
      onDeleted()
    } else {
      showToast('error', result.error ?? 'Failed to delete secret')
      setConfirmDelete(false)
    }
  }

  const copyName = async () => {
    await navigator.clipboard.writeText(secret.name)
    setCopiedName(true)
    setTimeout(() => setCopiedName(false), 2000)
  }

  const copyArn = async () => {
    if (!secret.arn) return
    await navigator.clipboard.writeText(secret.arn)
    setCopiedArn(true)
    setTimeout(() => setCopiedArn(false), 2000)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'value', label: 'Secret Value', icon: <Key size={13} /> },
    { id: 'overview', label: 'Overview', icon: <Settings size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full relative">
      <div
        className="px-5 pt-4 pb-0 border-b border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(99 102 241 / 0.1)' }}>
              <Shield size={18} style={{ color: 'rgb(99 102 241)' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-1 truncate">{secret.name}</h2>
                <button onClick={copyName} className="text-4 hover:text-2 shrink-0 transition-colors">
                  {copiedName ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-3 font-mono truncate">{secret.arn || 'No ARN available'}</p>
                {secret.arn && (
                  <button onClick={copyArn} className="text-4 hover:text-2 shrink-0 transition-colors">
                    {copiedArn ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors shrink-0
              ${confirmDelete
                ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'
              }`}
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {confirmDelete ? 'Confirm Delete' : 'Delete Secret'}
          </button>
        </div>

        <div className="flex items-center -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300'
                  : 'border-transparent text-3 hover:text-1'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <OverviewTab secret={secret} />
        )}
        {activeTab === 'value' && (
          <ValueTab secret={secret} />
        )}
      </div>
    </div>
  )
}

function OverviewTab({ secret }: { secret: SecretInfo }) {
  return (
    <div className="p-5 overflow-y-auto h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <div className="card p-4 space-y-3">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Identity</p>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Secret Name</p>
            <p className="text-sm font-mono text-1 break-all">{secret.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Description</p>
            <p className="text-sm text-2">{secret.description || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-3 mb-0.5">ARN</p>
            <p className="text-xs font-mono text-2 break-all">{secret.arn || '—'}</p>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Timestamps</p>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Created</p>
            <p className="text-xs text-2">{formatDate(secret.createdDate)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ValueTab({ secret }: { secret: SecretInfo }) {
  const { showToast } = useToastContext()
  const [revealed, setRevealed] = useState(false)
  const [value, setValue] = useState<SecretValue | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [draftValue, setDraftValue] = useState('')

  useEffect(() => {
    setRevealed(false)
    setValue(null)
    setEditMode(false)
  }, [secret.name])

  useEffect(() => {
    if (!revealed) return
    let active = true
    const loadValue = async () => {
      setLoading(true)
      const res = await window.electronAPI.secretsManagerGetSecretValue(secret.name)
      if (active) {
        setLoading(false)
        if (res.success && res.data) {
          setValue(res.data)
          setDraftValue(res.data.secretString || '')
        } else {
          showToast('error', res.error || 'Failed to fetch secret value')
        }
      }
    }
    loadValue()
    return () => { active = false }
  }, [secret.name, revealed])

  const handleSave = async () => {
    setSaving(true)
    const res = await window.electronAPI.secretsManagerPutSecretValue(secret.name, draftValue)
    setSaving(false)
    if (res.success) {
      showToast('success', 'Secret value updated successfully')
      setValue(prev => prev ? { ...prev, secretString: draftValue } : { secretString: draftValue })
      setEditMode(false)
    } else {
      showToast('error', res.error || 'Failed to update secret value')
    }
  }

  if (!revealed) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-app">
        <div className="w-16 h-16 rounded-2xl border flex items-center justify-center border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
          <Key size={24} className="text-4" />
        </div>
        <div>
           <h3 className="text-sm font-semibold text-2 mb-1">Secret value is hidden</h3>
           <p className="text-xs text-3">Retrieve the value to view or edit it.</p>
        </div>
        <button
          onClick={() => setRevealed(true)}
          className="btn-primary text-xs py-1.5 px-4"
          style={{ backgroundColor: 'rgb(99 102 241)', boxShadow: '0 4px 12px -2px rgb(99 102 241 / 0.5)' }}
        >
          Retrieve Secret Value
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-3 bg-app">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-5 overflow-y-auto h-full flex flex-col bg-app">
      <div className="w-full flex flex-col flex-1">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <h3 className="text-sm font-semibold text-1">Secret Data</h3>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button onClick={() => {
                  setEditMode(false)
                  setDraftValue(value?.secretString || '')
                }} className="btn-ghost text-xs py-1.5 px-3">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 text-white"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Edit2 size={12} />
                Edit Value
              </button>
            )}
          </div>
        </div>

        {editMode ? (
          <textarea
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            className="input-base font-mono text-sm p-4 w-full flex-1 min-h-[300px] resize-y"
            placeholder="Enter secret string or JSON..."
            spellCheck={false}
          />
        ) : (
          <div className="card bg-raised border border-theme overflow-auto flex-1 min-h-[300px]">
            {value?.secretString ? (
              <pre className="p-4 text-sm font-mono text-2 whitespace-pre-wrap leading-relaxed">
                {value.secretString}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full p-8 text-3 text-sm italic">
                {value?.secretBinary ? 'Binary secret cannot be displayed.' : 'No secret value set.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
