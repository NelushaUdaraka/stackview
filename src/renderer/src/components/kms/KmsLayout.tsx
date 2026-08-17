import { useCallback, useEffect, useState } from 'react'
import { Key, KeyRound, Loader2, AlertTriangle } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, KmsKey } from '../../types'
import KmsKeyDetail from './KmsKeyDetail'
import EncryptDecryptModal from './EncryptDecryptModal'
import {
  ServiceShell, ResourceRail, Inspector, InspectorSection, EmptyState, Modal, statusColor, stateOf,
  type RailItem,
} from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function KmsLayout({ settings }: Props) {
  const { showToast } = useToastContext()
  const [keys, setKeys] = useState<KmsKey[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [showCreateAlias, setShowCreateAlias] = useState(false)
  const [showCrypto, setShowCrypto] = useState(false)

  const loadKeys = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.kmsListKeysWithAliases()
      if (res.success && res.data) {
        const list: KmsKey[] = res.data
        setKeys(list)
        setSelectedId(prev =>
          prev && list.some(k => k.keyId === prev) ? prev : (list[0]?.keyId ?? null)
        )
      } else if (!res.success) {
        showToast('error', res.error || 'Failed to load keys')
      }
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const selected = keys.find(k => k.keyId === selectedId) ?? null

  const railItems: RailItem[] = keys.map(k => ({
    id: k.keyId,
    name: k.aliases?.[0]?.aliasName?.replace('alias/', '') || k.keyId,
    icon: Key,
    state: stateOf(k.state) ?? 'idle',
    sub: k.state?.toUpperCase(),
    meta: k.aliases?.length ? `${k.aliases.length} alias` : undefined,
    keywords: `${k.keyId} ${k.description ?? ''}`,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="KEYS"
            items={railItems}
            selectedId={selectedId}
            onSelect={item => setSelectedId(item.id)}
            icon={Key}
            searchPlaceholder="Search keys..."
            onCreate={() => setShowCreateKey(true)}
            createLabel="Create Key"
            loading={loading}
            emptyLabel="No customer keys"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="cmk"
              icon={Key}
              iconColor="#8b5cf6"
              title={selected.aliases?.[0]?.aliasName?.replace('alias/', '') || selected.keyId}
              subtitle={selected.description || 'Symmetric key'}
              rows={[
                { key: 'State', value: selected.state, color: statusColor(selected.state) },
                { key: 'Key ID', value: selected.keyId, color: 'rgb(var(--text-2))' },
                { key: 'Aliases', value: String(selected.aliases?.length ?? 0) },
                {
                  key: 'Created',
                  value: selected.creationDate ? new Date(selected.creationDate).toLocaleDateString() : '—',
                  color: 'rgb(var(--text-2))',
                },
                ...(selected.deletionDate
                  ? [
                      {
                        key: 'Deletes',
                        value: new Date(selected.deletionDate).toLocaleDateString(),
                        color: 'rgb(var(--danger))',
                      },
                    ]
                  : []),
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            >
              <InspectorSection title="TOOLS">
                <button onClick={() => setShowCrypto(true)} className="btn-secondary w-full mb-2">
                  <KeyRound size={12} />
                  Encrypt / Decrypt
                </button>
                <button onClick={() => setShowCreateAlias(true)} className="btn-secondary w-full">
                  Add Alias
                </button>
              </InspectorSection>
            </Inspector>
          ) : undefined
        }
      >
        {selected ? (
          <KmsKeyDetail
            key={selected.keyId}
            dataKey={selected}
            onRefresh={loadKeys}
            onDeleted={() => {
              setSelectedId(null)
              loadKeys()
            }}
            onEncryptDecrypt={() => setShowCrypto(true)}
            onCreateAlias={() => setShowCreateAlias(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={KeyRound}
              title={loading ? 'Loading keys…' : 'Select a key'}
              hint={
                keys.length === 0 && !loading
                  ? 'Create a symmetric key to get started.'
                  : 'Pick a key from the rail to manage aliases or test encryption.'
              }
              action={
                keys.length === 0 && !loading ? (
                  <button onClick={() => setShowCreateKey(true)} className="btn-primary">
                    Create Key
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateKey && (
        <CreateKeyModal
          onClose={() => setShowCreateKey(false)}
          onCreated={() => {
            setShowCreateKey(false)
            loadKeys()
          }}
        />
      )}
      {showCreateAlias && selected && (
        <CreateAliasModal
          targetKeyId={selected.keyId}
          onClose={() => setShowCreateAlias(false)}
          onCreated={() => {
            setShowCreateAlias(false)
            loadKeys()
          }}
        />
      )}
      {showCrypto && selected && (
        <EncryptDecryptModal dataKey={selected} onClose={() => setShowCrypto(false)} />
      )}
    </>
  )
}

function CreateKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToastContext()
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setSubmitting(true)
    setError('')
    const res = await window.electronAPI.kmsCreateKey(desc.trim() || undefined)
    setSubmitting(false)
    if (res.success) {
      showToast('success', 'Key created')
      onCreated()
    } else {
      setError(res.error || 'Failed to create key')
    }
  }

  return (
    <Modal
      title="Create Key"
      onClose={onClose}
      width={420}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting} className="btn-primary">
            {submitting && <Loader2 size={13} className="animate-spin" />}
            Create Key
          </button>
        </>
      }
    >
      <div className="p-4">
        <div className="ui-label mb-2">DESCRIPTION</div>
        <input
          autoFocus
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Application data encryption key"
          className="input-base"
        />
        <p className="text-[11px] text-4 mt-1.5">Optional. Creates a symmetric encrypt/decrypt key.</p>
        {error && <ModalError message={error} />}
      </div>
    </Modal>
  )
}

function CreateAliasModal({
  targetKeyId,
  onClose,
  onCreated,
}: {
  targetKeyId: string
  onClose: () => void
  onCreated: () => void
}) {
  const { showToast } = useToastContext()
  const [alias, setAlias] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const normalized = alias.startsWith('alias/') ? alias : `alias/${alias}`
  const canSubmit = alias.trim().length > 0

  const submit = async () => {
    setSubmitting(true)
    setError('')
    const res = await window.electronAPI.kmsCreateAlias(normalized, targetKeyId)
    setSubmitting(false)
    if (res.success) {
      showToast('success', 'Alias created')
      onCreated()
    } else {
      setError(res.error || 'Failed to create alias')
    }
  }

  return (
    <Modal
      title="Add Alias"
      onClose={onClose}
      width={420}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={!canSubmit || submitting} className="btn-primary">
            {submitting && <Loader2 size={13} className="animate-spin" />}
            Add Alias
          </button>
        </>
      }
    >
      <div className="p-4">
        <div className="ui-label mb-2">ALIAS</div>
        <input
          autoFocus
          value={alias}
          onChange={e => setAlias(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canSubmit && submit()}
          placeholder="my-app-key"
          className="input-base"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
        />
        <p className="ui-mono text-[11px] mt-1.5">{normalized}</p>
        {error && <ModalError message={error} />}
      </div>
    </Modal>
  )
}

function ModalError({ message }: { message: string }) {
  return (
    <div
      className="mt-3 flex items-center gap-2 rounded-[7px] px-2.5 py-2 text-[11.5px]"
      style={{
        backgroundColor: 'rgb(var(--danger) / 0.10)',
        border: '1px solid rgb(var(--danger) / 0.35)',
        color: 'rgb(var(--danger))',
      }}
    >
      <AlertTriangle size={13} className="shrink-0" />
      {message}
    </div>
  )
}
