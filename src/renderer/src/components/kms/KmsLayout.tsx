import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import { AlertTriangle, X, Plus, Loader2, KeyRound, Key } from 'lucide-react'
import type { AppSettings, KmsKey } from '../../types'
import KmsSidebar from './KmsSidebar'
import KmsKeyDetail from './KmsKeyDetail'
import EncryptDecryptModal from './EncryptDecryptModal'

// ── Create Key Modal ──────────────────────────────────────────────────

function CreateKeyModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const { showToast } = useToastContext()
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.kmsCreateKey(desc.trim() || undefined)
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Symmetric key created successfully`)
      onCreated()
    } else {
      setError(res.error || 'Failed to create key')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-500/15">
              <KeyRound size={16} className="text-violet-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create KMS Key</h2>
              <p className="text-[10px] text-3">Symmetric (LocalStack)</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Description (Optional)</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Database encryption key"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Create Key
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateAliasModal({ targetKeyId, onClose, onCreated }: { targetKeyId: string, onClose: () => void, onCreated: () => void }) {
  const { showToast } = useToastContext()
  const [alias, setAlias] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!alias.trim()) return
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.kmsCreateAlias(alias.trim(), targetKeyId)
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Alias created successfully`)
      onCreated()
    } else {
      setError(res.error || 'Failed to create alias')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-500/15">
              <Key size={16} className="text-violet-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Alias</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Alias Name</label>
            <div className="flex input-base w-full items-center p-0 overflow-hidden">
              <span className="bg-raised text-3 px-3 py-2 text-sm font-mono border-r border-theme">alias/</span>
              <input
                value={alias.replace(/^alias\//, '')}
                onChange={e => setAlias(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !!alias.trim() && handleSubmit()}
                placeholder="my-key"
                className="bg-transparent text-sm w-full py-2 px-3 focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!alias.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Create Alias
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

interface Props {
  settings: AppSettings
}

export default function KmsLayout({ settings }: Props) {
  const [keys, setKeys] = useState<KmsKey[]>([])
  const [selectedKey, setSelectedKey] = useState<KmsKey | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [showCreateAlias, setShowCreateAlias] = useState(false)
  const [showCrypto, setShowCrypto] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadKeys = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.kmsListKeysWithAliases()
    if (res.success && res.data) {
      setKeys(res.data)
      if (selectedKey) {
        const refreshed = res.data.find(k => k.keyId === selectedKey.keyId)
        setSelectedKey(refreshed || null)
      } else if (res.data.length > 0) {
        setSelectedKey(res.data[0])
      }
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load keys')
    }
    setLoading(false)
  }, [selectedKey, showToast])

  useEffect(() => { loadKeys() }, [])

  const handleKeyCreated = () => {
    setShowCreateKey(false)
    loadKeys()
  }

  const handleAliasCreated = () => {
    setShowCreateAlias(false)
    loadKeys()
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <KmsSidebar
            keys={keys}
            selectedKey={selectedKey}
            onSelectKey={setSelectedKey}
            onCreateKey={() => setShowCreateKey(true)}
            loading={loading}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-app">
          {selectedKey ? (
            <KmsKeyDetail
              dataKey={selectedKey}
              onRefresh={loadKeys}
              onDeleted={() => { setSelectedKey(null); loadKeys() }}
              onEncryptDecrypt={() => setShowCrypto(true)}
              onCreateAlias={() => setShowCreateAlias(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <KeyRound size={40} className="text-violet-500 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No customer key selected</p>
                <p className="text-xs text-3">{loading ? 'Loading KMS keys...' : keys.length === 0 ? 'Create a symmetric key to get started' : 'Select a key from the sidebar'}</p>
              </div>
              {!loading && keys.length === 0 && (
                <button onClick={() => setShowCreateKey(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors">
                  <Plus size={14} /> Create Key
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateKey && (
        <CreateKeyModal onClose={() => setShowCreateKey(false)} onCreated={handleKeyCreated} />
      )}
      {showCreateAlias && selectedKey && (
        <CreateAliasModal targetKeyId={selectedKey.keyId} onClose={() => setShowCreateAlias(false)} onCreated={handleAliasCreated} />
      )}
      {showCrypto && selectedKey && (
        <EncryptDecryptModal dataKey={selectedKey} onClose={() => setShowCrypto(false)} />
      )}
    </div>
  )
}
