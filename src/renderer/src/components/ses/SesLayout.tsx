import { useCallback, useEffect, useState } from 'react'
import { Mail, ShieldCheck, Send, Loader2, AlertTriangle, Globe } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, SesIdentity } from '../../types'
import SesIdentitiesDetail from './SesIdentitiesDetail'
import SendEmailModal from './SendEmailModal'
import {
  ServiceShell, ResourceRail, Inspector, InspectorSection, EmptyState, Modal, statusColor, stateOf,
  type RailItem,
} from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function SesLayout({ settings }: Props) {
  const { showToast } = useToastContext()
  const [identities, setIdentities] = useState<SesIdentity[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateIdentity, setShowCreateIdentity] = useState(false)
  const [showSendEmail, setShowSendEmail] = useState(false)

  const loadIdentities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.sesListIdentities()
      if (res.success && res.data) {
        const list: SesIdentity[] = res.data
        setIdentities(list)
        setSelectedName(prev =>
          prev && list.some(i => i.name === prev) ? prev : (list[0]?.name ?? null)
        )
      } else if (!res.success) {
        showToast('error', res.error || 'Failed to load identities')
      }
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadIdentities()
  }, [loadIdentities])

  const selected = identities.find(i => i.name === selectedName) ?? null

  const railItems: RailItem[] = identities.map(i => ({
    id: i.name,
    name: i.name,
    icon: i.type === 'Domain' ? Globe : Mail,
    state: stateOf(i.verificationStatus) ?? 'warn',
    sub: i.verificationStatus?.toUpperCase(),
    meta: i.type,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="IDENTITIES"
            items={railItems}
            selectedId={selectedName}
            onSelect={item => setSelectedName(item.id)}
            icon={Mail}
            searchPlaceholder="Search identities..."
            onCreate={() => setShowCreateIdentity(true)}
            createLabel="Verify Identity"
            loading={loading}
            emptyLabel="No identities yet"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind={selected.type.toLowerCase()}
              icon={selected.type === 'Domain' ? Globe : Mail}
              iconColor="#0ea5e9"
              title={selected.name}
              subtitle={`${selected.type} identity`}
              rows={[
                {
                  key: 'Status',
                  value: selected.verificationStatus,
                  color: statusColor(selected.verificationStatus),
                },
                { key: 'Type', value: selected.type, color: 'rgb(var(--text-2))' },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            >
              <InspectorSection title="ACTIONS">
                <button onClick={() => setShowSendEmail(true)} className="btn-primary w-full">
                  <Send size={12} />
                  Send Test Email
                </button>
              </InspectorSection>
            </Inspector>
          ) : undefined
        }
      >
        {selected ? (
          <SesIdentitiesDetail
            key={selected.name}
            identity={selected}
            onRefresh={loadIdentities}
            onDeleted={() => {
              setSelectedName(null)
              loadIdentities()
            }}
            onSendEmail={() => setShowSendEmail(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Mail}
              title={loading ? 'Loading identities…' : 'Select an identity'}
              hint={
                identities.length === 0 && !loading
                  ? 'Verify an email address or domain to get started.'
                  : 'Pick an identity from the rail to check its verification status.'
              }
              action={
                identities.length === 0 && !loading ? (
                  <button onClick={() => setShowCreateIdentity(true)} className="btn-primary">
                    <ShieldCheck size={12} />
                    Verify Identity
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateIdentity && (
        <CreateIdentityModal
          onClose={() => setShowCreateIdentity(false)}
          onCreated={() => {
            setShowCreateIdentity(false)
            loadIdentities()
          }}
        />
      )}
      {showSendEmail && selected && (
        <SendEmailModal sourceIdentity={selected} onClose={() => setShowSendEmail(false)} />
      )}
    </>
  )
}

function CreateIdentityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToastContext()
  const [identity, setIdentity] = useState('')
  const [type, setType] = useState<'Email' | 'Domain'>('Email')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const value = identity.trim()
    if (!value) return
    setError('')

    if (type === 'Email' && (!value.includes('@') || !value.includes('.'))) {
      setError('Enter a valid email address, e.g. user@example.com')
      return
    }
    if (type === 'Domain' && !value.includes('.')) {
      setError('Enter a valid domain name, e.g. example.com')
      return
    }

    setSubmitting(true)
    const res =
      type === 'Email'
        ? await window.electronAPI.sesVerifyEmail(value)
        : await window.electronAPI.sesVerifyDomain(value)
    setSubmitting(false)

    if (res.success) {
      showToast('success', `${type} verification requested`)
      onCreated()
    } else {
      setError(res.error || 'Failed to verify identity')
    }
  }

  return (
    <Modal
      title="Verify Identity"
      onClose={onClose}
      width={420}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={!identity.trim() || submitting} className="btn-primary">
            {submitting && <Loader2 size={13} className="animate-spin" />}
            Verify
          </button>
        </>
      }
    >
      <div className="p-4">
        <div className="ui-label mb-2">TYPE</div>
        <div className="flex gap-1.5 mb-4">
          {(['Email', 'Domain'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`chip flex-1 justify-center ${type === t ? 'chip-active' : ''}`}
            >
              {t === 'Email' ? <Mail size={11} /> : <Globe size={11} />}
              {t}
            </button>
          ))}
        </div>

        <div className="ui-label mb-2">{type === 'Email' ? 'EMAIL ADDRESS' : 'DOMAIN'}</div>
        <input
          autoFocus
          value={identity}
          onChange={e => setIdentity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder={type === 'Email' ? 'user@example.com' : 'example.com'}
          className="input-base"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
        />

        {error && (
          <div
            className="mt-3 flex items-center gap-2 rounded-[7px] px-2.5 py-2 text-[11.5px]"
            style={{
              backgroundColor: 'rgb(var(--danger) / 0.10)',
              border: '1px solid rgb(var(--danger) / 0.35)',
              color: 'rgb(var(--danger))',
            }}
          >
            <AlertTriangle size={13} className="shrink-0" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
