import { useState, useEffect } from 'react'
import { Globe, Activity } from 'lucide-react'
import type { AppSettings, Route53HostedZone } from '../../types'
import HostedZoneDetail from './HostedZoneDetail'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, type RailItem,
} from '../common/ui'
import CreateHostedZoneModal from './CreateHostedZoneModal'
import HealthChecksPanel from './HealthChecksPanel'

interface Props {
  settings: AppSettings
}

type MainView = 'zone' | 'healthchecks'

export default function Route53Layout({ settings }: Props) {
  const [zones, setZones] = useState<Route53HostedZone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [mainView, setMainView] = useState<MainView>('zone')

  const loadZones = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.route53ListHostedZones()
      if (result.success && result.data) {
        setZones(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadZones()
  }, [])

  const handleZoneCreated = async (zone: Route53HostedZone) => {
    setShowCreateModal(false)
    await loadZones()
    setSelectedZoneId(zone.Id)
    setMainView('zone')
  }

  const handleZoneDeleted = async () => {
    setSelectedZoneId(null)
    await loadZones()
  }

  const selectedZone = zones.find(z => z.Id === selectedZoneId) ?? null

  const railItems: RailItem[] = [
    {
      id: '__healthchecks__',
      name: 'Health Checks',
      icon: Activity,
      sub: 'ENDPOINT MONITORS',
    },
    ...zones.map(z => ({
      id: z.Id,
      name: z.Name.replace(/\.$/, ''),
      icon: Globe,
      state: 'ok' as const,
      sub: z.Config?.PrivateZone ? 'PRIVATE' : 'PUBLIC',
      meta: z.ResourceRecordSetCount != null ? `${z.ResourceRecordSetCount} records` : undefined,
      keywords: z.Config?.Comment,
    })),
  ]

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="HOSTED ZONES"
            items={railItems}
            selectedId={mainView === 'healthchecks' ? '__healthchecks__' : selectedZoneId}
            onSelect={item => {
              if (item.id === '__healthchecks__') {
                setSelectedZoneId(null)
                setMainView('healthchecks')
              } else {
                setSelectedZoneId(item.id)
                setMainView('zone')
              }
            }}
            icon={Globe}
            searchPlaceholder="Search zones..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="Create Zone"
            loading={loading}
            emptyLabel="No hosted zones"
          />
        }
        inspector={
          selectedZone ? (
            <Inspector
              kind="hosted zone"
              icon={Globe}
              iconColor="#60a5fa"
              title={selectedZone.Name.replace(/\.$/, '')}
              subtitle={selectedZone.Config?.Comment || (selectedZone.Config?.PrivateZone ? 'Private zone' : 'Public zone')}
              rows={[
                {
                  key: 'Visibility',
                  value: selectedZone.Config?.PrivateZone ? 'Private' : 'Public',
                  color: 'rgb(var(--accent))',
                },
                { key: 'Records', value: String(selectedZone.ResourceRecordSetCount ?? 0) },
                { key: 'Zone ID', value: selectedZone.Id.replace('/hostedzone/', ''), color: 'rgb(var(--text-2))' },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {mainView === 'healthchecks' ? (
          <HealthChecksPanel key="healthchecks" />
        ) : selectedZone ? (
          <HostedZoneDetail key={selectedZone.Id} zone={selectedZone} onDeleted={handleZoneDeleted} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Globe}
              title="Select a hosted zone"
              hint="Pick a zone from the rail to manage its DNS records."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Zone
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateHostedZoneModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleZoneCreated}
        />
      )}
    </>
  )
}
