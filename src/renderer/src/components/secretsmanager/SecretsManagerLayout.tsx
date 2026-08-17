import { useCallback, useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import type { AppSettings, SecretInfo } from '../../types'
import SecretDetail from './SecretDetail'
import CreateSecretModal from './CreateSecretModal'
import { ServiceShell, ResourceRail, Inspector, EmptyState, type RailItem } from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function SecretsManagerLayout({ settings }: Props) {
  const [secrets, setSecrets] = useState<SecretInfo[]>([])
  const [selected, setSelected] = useState<SecretInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadSecrets = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.secretsManagerListSecrets()
      if (result.success && result.data) setSecrets(result.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSecrets()
  }, [loadSecrets])

  const railItems: RailItem[] = secrets.map(s => ({
    id: s.name,
    name: s.name,
    icon: Shield,
    state: 'ok',
    sub: 'SECRET',
    meta: s.createdDate ? new Date(s.createdDate).toLocaleDateString() : undefined,
    keywords: s.description,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="SECRETS"
            items={railItems}
            selectedId={selected?.name ?? null}
            onSelect={item => setSelected(secrets.find(s => s.name === item.id) ?? null)}
            icon={Shield}
            searchPlaceholder="Search secrets..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="Create Secret"
            loading={loading}
            emptyLabel="No secrets yet"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="secret"
              icon={Shield}
              iconColor="#6366f1"
              title={selected.name}
              subtitle={selected.description || 'No description'}
              sectionTitle="SECRET"
              rows={[
                { key: 'Region', value: settings.region, color: 'rgb(var(--accent))' },
                {
                  key: 'Created',
                  value: selected.createdDate ? new Date(selected.createdDate).toLocaleDateString() : '—',
                  color: 'rgb(var(--text-2))',
                },
                ...(selected.arn ? [{ key: 'ARN', value: selected.arn, color: 'rgb(var(--text-2))' }] : []),
              ]}
            />
          ) : undefined
        }
      >
        {selected ? (
          <SecretDetail
            key={selected.name}
            secret={selected}
            onDeleted={async () => {
              setSelected(null)
              await loadSecrets()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Shield}
              title="Select a secret"
              hint="Pick a secret from the rail to read or rotate its value."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Secret
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateSecretModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async (name: string) => {
            setShowCreateModal(false)
            await loadSecrets()
            setSelected({ name })
          }}
        />
      )}
    </>
  )
}
