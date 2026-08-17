import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import DomainDetail from './DomainDetail'
import CreateDomainModal from './CreateDomainModal'
import type { AppSettings } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'
import { ServiceShell, ResourceRail, Inspector, EmptyState, type RailItem } from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function OpenSearchLayout({ settings }: Props) {
  const [domains, setDomains] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { showToast } = useToastContext()

  const loadDomains = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await window.electronAPI.opensearchListDomains(settings.endpoint, settings.region)
      if (res.success && res.data) setDomains(res.data)
      else showToast('error', res.error ?? 'Failed to list domains')
    } finally {
      setRefreshing(false)
    }
  }, [settings.endpoint, settings.region, showToast])

  useEffect(() => {
    window.electronAPI.opensearchReinit(settings.endpoint, settings.region)
    loadDomains()
  }, [settings.endpoint, settings.region, loadDomains])

  const railItems: RailItem[] = domains.map(name => ({
    id: name,
    name,
    icon: Search,
    state: 'ok',
    sub: 'DOMAIN',
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="DOMAINS"
            items={railItems}
            selectedId={selectedDomain}
            onSelect={item => setSelectedDomain(item.id)}
            icon={Search}
            searchPlaceholder="Search domains..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="Create Domain"
            loading={refreshing}
            emptyLabel="No domains yet"
          />
        }
        inspector={
          selectedDomain ? (
            <Inspector
              kind="domain"
              icon={Search}
              iconColor="#a855f7"
              title={selectedDomain}
              subtitle="OpenSearch domain"
              sectionTitle="DOMAIN"
              rows={[
                { key: 'Region', value: settings.region, color: 'rgb(var(--accent))' },
                { key: 'Endpoint', value: settings.endpoint, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selectedDomain ? (
          <DomainDetail
            key={selectedDomain}
            domainName={selectedDomain}
            endpoint={settings.endpoint}
            region={settings.region}
            onDeleted={() => {
              setSelectedDomain(null)
              loadDomains()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Search}
              title="Select a domain"
              hint="Pick a domain from the rail to manage indices and search documents."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Domain
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateDomainModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            loadDomains()
          }}
          endpoint={settings.endpoint}
          region={settings.region}
        />
      )}
    </>
  )
}
