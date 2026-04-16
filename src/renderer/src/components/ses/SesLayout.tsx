import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import { AlertTriangle, X, Plus, Loader2, ShieldCheck, Mail } from 'lucide-react'
import type { AppSettings, SesIdentity } from '../../types'
import SesSidebar from './SesSidebar'
import SesIdentitiesDetail from './SesIdentitiesDetail'
import SendEmailModal from './SendEmailModal'

interface Props {
  settings: AppSettings
}

// ── Create Identity Modal ──────────────────────────────────────────────────

function CreateIdentityModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const { showToast } = useToastContext()
  const [identity, setIdentity] = useState('')
  const [type, setType] = useState<'Email' | 'Domain'>('Email')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const value = identity.trim()
    if (!value) return
    setError('')

    // Basic Validation
    if (type === 'Email') {
      if (!value.includes('@') || !value.includes('.')) {
        setError('Please enter a valid email address (e.g., user@example.com)')
        return
      }
    } else {
      if (!value.includes('.')) {
        setError('Please enter a valid domain name (e.g., example.com)')
        return
      }
    }

    setSubmitting(true)
    let res
    if (type === 'Email') {
      res = await window.electronAPI.sesVerifyEmail(value)
    } else {
      res = await window.electronAPI.sesVerifyDomain(value)
    }
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Verification initiated for ${value}`)
      onCreated()
    } else {
      setError(res.error || 'Failed to initiate verification')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-sky-500/15">
              <ShieldCheck size={16} className="text-sky-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Verify Identity</h2>
              <p className="text-[10px] text-3">AWS SES</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setType('Email')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${type === 'Email' ? 'bg-sky-500/10 border-sky-500 text-sky-600' : 'border-theme text-3 hover:border-sky-500/40'}`}>
              Email Address
            </button>
            <button onClick={() => setType('Domain')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${type === 'Domain' ? 'bg-sky-500/10 border-sky-500 text-sky-600' : 'border-theme text-3 hover:border-sky-500/40'}`}>
              Domain
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">{type === 'Email' ? 'Email Address *' : 'Domain Name *'}</label>
            <input
              value={identity}
              onChange={e => setIdentity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !!identity.trim() && handleSubmit()}
              placeholder={type === 'Email' ? "user@example.com" : "example.com"}
              className="input-base w-full text-sm font-mono"
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
            disabled={!identity.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Verify Identity
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function SesLayout({ settings }: Props) {
  const [identities, setIdentities] = useState<SesIdentity[]>([])
  const [selectedIdentity, setSelectedIdentity] = useState<SesIdentity | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateIdentity, setShowCreateIdentity] = useState(false)
  const [showSendEmail, setShowSendEmail] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadIdentities = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.sesListIdentities()
    if (res.success && res.data) {
      setIdentities(res.data)
      if (selectedIdentity) {
        const refreshed = res.data.find(i => i.name === selectedIdentity.name)
        setSelectedIdentity(refreshed || null)
      } else if (res.data.length > 0) {
        setSelectedIdentity(res.data[0])
      }
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load identities')
    }
    setLoading(false)
  }, [selectedIdentity, showToast])

  useEffect(() => { loadIdentities() }, [])

  const handleIdentityCreated = () => {
    setShowCreateIdentity(false)
    loadIdentities()
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <SesSidebar
            identities={identities}
            selectedIdentity={selectedIdentity}
            onSelectIdentity={setSelectedIdentity}
            onCreateIdentity={() => setShowCreateIdentity(true)}
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
          {selectedIdentity ? (
            <SesIdentitiesDetail
              identity={selectedIdentity}
              onRefresh={loadIdentities}
              onDeleted={() => { setSelectedIdentity(null); loadIdentities() }}
              onSendEmail={() => setShowSendEmail(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <Mail size={40} className="text-sky-500 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No identity selected</p>
                <p className="text-xs text-3">{loading ? 'Loading identities...' : identities.length === 0 ? 'Verify an email or domain to get started' : 'Select an identity from the sidebar'}</p>
              </div>
              {!loading && identities.length === 0 && (
                <button onClick={() => setShowCreateIdentity(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors">
                  <ShieldCheck size={14} /> Verify Identity
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateIdentity && (
        <CreateIdentityModal
          onClose={() => setShowCreateIdentity(false)}
          onCreated={handleIdentityCreated}
        />
      )}
      {showSendEmail && selectedIdentity && (
        <SendEmailModal
          sourceIdentity={selectedIdentity}
          onClose={() => setShowSendEmail(false)}
        />
      )}
    </div>
  )
}
