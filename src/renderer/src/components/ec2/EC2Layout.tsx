import { useState, useCallback, useEffect } from 'react'
import { Server, Key, ShieldCheck, Network, HardDrive, Image } from 'lucide-react'
import type { AppSettings, Ec2Instance } from '../../types'
import InstanceDetail from './InstanceDetail'
import LaunchInstanceModal from './LaunchInstanceModal'
import KeyPairsView from './KeyPairsView'
import SecurityGroupsView from './SecurityGroupsView'
import VPCsView from './VPCsView'
import VolumesView from './VolumesView'
import AMIsView from './AMIsView'
import {
  ServiceShell, ResourceRail, SubviewTabs, Inspector, EmptyState, statusColor, stateOf,
  type RailItem, type Subview,
} from '../common/ui'

type MainView = 'instances' | 'amis' | 'keypairs' | 'securitygroups' | 'vpcs' | 'volumes'

interface Props {
  settings: AppSettings
}

const NAV_TABS: Subview<MainView>[] = [
  { id: 'instances', label: 'Instances', icon: Server },
  { id: 'amis', label: 'AMIs', icon: Image },
  { id: 'keypairs', label: 'Key Pairs', icon: Key },
  { id: 'securitygroups', label: 'Security Groups', icon: ShieldCheck },
  { id: 'vpcs', label: 'VPCs', icon: Network },
  { id: 'volumes', label: 'Volumes', icon: HardDrive },
]

/** An instance addressable by id — anything else can't be selected or acted on. */
type IdentifiedInstance = Ec2Instance & { InstanceId: string }

/** The `Name` tag is what people actually call an instance; fall back to its id. */
function instanceName(i: IdentifiedInstance): string {
  return i.Tags?.find(t => t.Key === 'Name')?.Value || i.InstanceId
}

export default function EC2Layout({ settings }: Props) {
  const [mainView, setMainView] = useState<MainView>('instances')
  const [instances, setInstances] = useState<Ec2Instance[]>([])
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showLaunch, setShowLaunch] = useState(false)

  const loadInstances = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.ec2ListInstances()
      if (res.success && res.data) {
        // Terminated instances linger in the API for a while — they aren't listed.
        const active = (res.data as Ec2Instance[]).filter(i => i.State?.Name !== 'terminated')
        setInstances(active)
        setSelectedInstanceId(prev =>
          prev && active.some(i => i.InstanceId === prev) ? prev : null
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInstances()
  }, [loadInstances])

  const selectedInstance = instances.find(i => i.InstanceId === selectedInstanceId) ?? null

  const railItems: RailItem[] = instances
    .filter((i): i is IdentifiedInstance => Boolean(i.InstanceId))
    .map(i => ({
      id: i.InstanceId,
      name: instanceName(i),
      icon: Server,
      state: stateOf(i.State?.Name) ?? 'warn',
      sub: i.State?.Name?.toUpperCase(),
      meta: i.InstanceType,
      keywords: `${i.InstanceId} ${i.PrivateIpAddress ?? ''} ${i.PublicIpAddress ?? ''}`,
    }))

  const tabs = <SubviewTabs views={NAV_TABS} active={mainView} onChange={setMainView} />

  // Only the instances view has a resource rail — the rest are flat tables.
  if (mainView !== 'instances') {
    return (
      <div className="flex-1 min-h-0 flex flex-col bg-app">
        <div className="shrink-0 px-5 pt-3 border-b border-theme">{tabs}</div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {mainView === 'amis' && <AMIsView />}
          {mainView === 'keypairs' && <KeyPairsView />}
          {mainView === 'securitygroups' && <SecurityGroupsView />}
          {mainView === 'vpcs' && <VPCsView />}
          {mainView === 'volumes' && <VolumesView />}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="shrink-0 px-5 pt-3 border-b border-theme bg-app">{tabs}</div>

      <ServiceShell
        rail={
          <ResourceRail
            title="INSTANCES"
            items={railItems}
            selectedId={selectedInstanceId}
            onSelect={item => setSelectedInstanceId(item.id)}
            icon={Server}
            searchPlaceholder="Search instances..."
            onCreate={() => setShowLaunch(true)}
            createLabel="Launch Instance"
            loading={loading}
            emptyLabel="No running instances"
          />
        }
        inspector={
          selectedInstance ? (
            <Inspector
              kind="instance"
              icon={Server}
              iconColor="#f97316"
              title={instanceName(selectedInstance as IdentifiedInstance)}
              subtitle={selectedInstance.InstanceType}
              rows={[
                {
                  key: 'State',
                  value: selectedInstance.State?.Name ?? '—',
                  color: statusColor(selectedInstance.State?.Name),
                },
                { key: 'Instance ID', value: selectedInstance.InstanceId ?? '\u2014', color: 'rgb(var(--text-2))' },
                { key: 'Type', value: selectedInstance.InstanceType ?? '—' },
                { key: 'AZ', value: selectedInstance.Placement?.AvailabilityZone ?? '—', color: 'rgb(var(--text-2))' },
                { key: 'Private IP', value: selectedInstance.PrivateIpAddress ?? '—', color: 'rgb(var(--text-2))' },
                { key: 'Public IP', value: selectedInstance.PublicIpAddress ?? '—', color: 'rgb(var(--text-2))' },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selectedInstance ? (
          <InstanceDetail
            key={selectedInstance.InstanceId}
            instance={selectedInstance}
            onRefresh={loadInstances}
            onDeleted={() => {
              setSelectedInstanceId(null)
              loadInstances()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Server}
              title={loading ? 'Loading instances…' : 'Select an instance'}
              hint="Pick an instance from the rail to inspect it or change its state."
              action={
                <button onClick={() => setShowLaunch(true)} className="btn-primary">
                  Launch Instance
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showLaunch && (
        <LaunchInstanceModal
          onClose={() => setShowLaunch(false)}
          onLaunched={() => {
            setShowLaunch(false)
            loadInstances()
          }}
        />
      )}
    </>
  )
}
