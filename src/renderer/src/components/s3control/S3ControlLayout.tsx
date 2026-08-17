import { useState, useEffect } from 'react'
import { Lock, Globe, Settings } from 'lucide-react'
import type { AppSettings, S3ControlAccessPoint, S3ControlMRAP } from '../../types'
import AccessPointDetail from './AccessPointDetail'
import {
  ServiceShell, ResourceRail, SubviewTabs, Inspector, EmptyState as UiEmptyState,
  statusColor, type RailItem, type Subview,
} from '../common/ui'

/** Which family of S3 Control resources the rail is listing. */
export type SidebarSection = 'accesspoints' | 'mraps'
import MRAPDetail from './MRAPDetail'
import AccountSettingsPanel from './AccountSettingsPanel'
import CreateAccessPointModal from './CreateAccessPointModal'
import CreateMRAPModal from './CreateMRAPModal'

interface Props {
  settings: AppSettings
}

export default function S3ControlLayout({ settings }: Props) {
  const [section, setSection] = useState<SidebarSection>('accesspoints')
  const [accessPoints, setAccessPoints] = useState<S3ControlAccessPoint[]>([])
  const [mraps, setMraps] = useState<S3ControlMRAP[]>([])
  const [selectedAP, setSelectedAP] = useState<S3ControlAccessPoint | null>(null)
  const [selectedMRAP, setSelectedMRAP] = useState<S3ControlMRAP | null>(null)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [loadingAPs, setLoadingAPs] = useState(false)
  const [loadingMRAPs, setLoadingMRAPs] = useState(false)
  const [showCreateAP, setShowCreateAP] = useState(false)
  const [showCreateMRAP, setShowCreateMRAP] = useState(false)


  const loadAccessPoints = async () => {
    setLoadingAPs(true)
    try {
      const res = await window.electronAPI.s3controlListAccessPoints()
      if (res.success && res.data) {
        setAccessPoints([...res.data].sort((a: S3ControlAccessPoint, b: S3ControlAccessPoint) => a.name.localeCompare(b.name)))
      }
    } finally {
      setLoadingAPs(false)
    }
  }

  const loadMRAPs = async () => {
    setLoadingMRAPs(true)
    try {
      const res = await window.electronAPI.s3controlListMRAPs()
      if (res.success && res.data) {
        setMraps([...res.data].sort((a: S3ControlMRAP, b: S3ControlMRAP) => a.name.localeCompare(b.name)))
      }
    } finally {
      setLoadingMRAPs(false)
    }
  }

  useEffect(() => {
    loadAccessPoints()
    loadMRAPs()
  }, [])

  const handleAPDeleted = async () => {
    setSelectedAP(null)
    await loadAccessPoints()
  }

  const handleMRAPDeleted = async () => {
    setSelectedMRAP(null)
    await loadMRAPs()
  }

  const handleSelectAP = (ap: S3ControlAccessPoint) => {
    setSelectedAP(ap)
    setSelectedMRAP(null)
    setShowAccountSettings(false)
  }

  const handleSelectMRAP = (mrap: S3ControlMRAP) => {
    setSelectedMRAP(mrap)
    setSelectedAP(null)
    setShowAccountSettings(false)
  }

  const handleOpenAccountSettings = () => {
    setShowAccountSettings(true)
    setSelectedAP(null)
    setSelectedMRAP(null)
  }

  const SECTIONS: Subview<SidebarSection>[] = [
    { id: 'accesspoints', label: 'Access Points', icon: Lock, count: accessPoints.length },
    { id: 'mraps', label: 'Multi-Region', icon: Globe, count: mraps.length },
  ]

  const railItems: RailItem[] = [
    { id: '__account__', name: 'Account Settings', icon: Settings, sub: 'PUBLIC ACCESS BLOCK' },
    ...(section === 'accesspoints'
      ? accessPoints.map(ap => ({
          id: ap.name,
          name: ap.name,
          icon: Lock,
          state: 'ok' as const,
          sub: ap.networkOrigin?.toUpperCase() ?? 'ACCESS POINT',
          meta: ap.bucket,
          keywords: `${ap.alias ?? ''} ${ap.vpcId ?? ''}`,
        }))
      : mraps.map(m => ({
          id: m.name,
          name: m.name,
          icon: Globe,
          state: 'ok' as const,
          sub: m.status?.toUpperCase() ?? 'MRAP',
          meta: m.regions?.length ? `${m.regions.length} regions` : undefined,
          keywords: m.alias,
        }))),
  ]

  const selectedRailId = showAccountSettings
    ? '__account__'
    : section === 'accesspoints'
      ? (selectedAP?.name ?? null)
      : (selectedMRAP?.name ?? null)

  const renderMain = () => {
    if (showAccountSettings) {
      return <AccountSettingsPanel onClose={() => setShowAccountSettings(false)} />
    }
    if (section === 'accesspoints' && selectedAP) {
      return <AccessPointDetail key={selectedAP.name} accessPoint={selectedAP} onDeleted={handleAPDeleted} />
    }
    if (section === 'mraps' && selectedMRAP) {
      return <MRAPDetail key={selectedMRAP.name} mrap={selectedMRAP} onDeleted={handleMRAPDeleted} />
    }
    return (
      <div className="flex-1 flex items-center justify-center">
        <UiEmptyState
          icon={section === 'accesspoints' ? Lock : Globe}
          title={section === 'accesspoints' ? 'Select an access point' : 'Select a multi-region access point'}
          hint="Pick one from the rail, or open Account Settings for the public access block."
          action={
            <button
              onClick={() => (section === 'accesspoints' ? setShowCreateAP(true) : setShowCreateMRAP(true))}
              className="btn-primary"
            >
              {section === 'accesspoints' ? 'Create Access Point' : 'Create MRAP'}
            </button>
          }
        />
      </div>
    )
  }

  const inspector = (() => {
    if (section === 'accesspoints' && selectedAP && !showAccountSettings) {
      return (
        <Inspector
          kind="access point"
          icon={Lock}
          iconColor="#0d9488"
          title={selectedAP.name}
          subtitle={selectedAP.bucket}
          rows={[
            { key: 'Bucket', value: selectedAP.bucket, color: 'rgb(var(--accent))' },
            { key: 'Network', value: selectedAP.networkOrigin ?? '\u2014' },
            { key: 'VPC', value: selectedAP.vpcId ?? '\u2014', color: 'rgb(var(--text-2))' },
            { key: 'Alias', value: selectedAP.alias ?? '\u2014', color: 'rgb(var(--text-2))' },
            { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
          ]}
        />
      )
    }
    if (section === 'mraps' && selectedMRAP && !showAccountSettings) {
      return (
        <Inspector
          kind="mrap"
          icon={Globe}
          iconColor="#0d9488"
          title={selectedMRAP.name}
          subtitle={selectedMRAP.alias || 'Multi-region access point'}
          rows={[
            { key: 'Status', value: selectedMRAP.status ?? '\u2014', color: statusColor(selectedMRAP.status) },
            { key: 'Regions', value: String(selectedMRAP.regions?.length ?? 0) },
            { key: 'Alias', value: selectedMRAP.alias ?? '\u2014', color: 'rgb(var(--text-2))' },
            {
              key: 'Created',
              value: selectedMRAP.createdAt ? new Date(selectedMRAP.createdAt).toLocaleDateString() : '\u2014',
              color: 'rgb(var(--text-2))',
            },
          ]}
        />
      )
    }
    return undefined
  })()

  return (
    <>
      <div className="shrink-0 px-5 pt-3 border-b border-theme bg-app">
        <SubviewTabs
          views={SECTIONS}
          active={section}
          onChange={next => {
            setSection(next)
            setShowAccountSettings(false)
          }}
        />
      </div>

      <ServiceShell
        rail={
          <ResourceRail
            title={section === 'accesspoints' ? 'ACCESS POINTS' : 'MULTI-REGION'}
            items={railItems}
            selectedId={selectedRailId}
            onSelect={item => {
              if (item.id === '__account__') {
                handleOpenAccountSettings()
              } else if (section === 'accesspoints') {
                const ap = accessPoints.find(a => a.name === item.id)
                if (ap) handleSelectAP(ap)
              } else {
                const m = mraps.find(x => x.name === item.id)
                if (m) handleSelectMRAP(m)
              }
            }}
            icon={section === 'accesspoints' ? Lock : Globe}
            searchPlaceholder={section === 'accesspoints' ? 'Search access points...' : 'Search MRAPs...'}
            onCreate={() => (section === 'accesspoints' ? setShowCreateAP(true) : setShowCreateMRAP(true))}
            createLabel={section === 'accesspoints' ? 'Create Access Point' : 'Create MRAP'}
            loading={section === 'accesspoints' ? loadingAPs : loadingMRAPs}
            emptyLabel={section === 'accesspoints' ? 'No access points' : 'No MRAPs'}
          />
        }
        inspector={inspector}
      >
        {renderMain()}
      </ServiceShell>

      {showCreateAP && (
        <CreateAccessPointModal
          onClose={() => setShowCreateAP(false)}
          onCreated={() => {
            setShowCreateAP(false)
            loadAccessPoints()
          }}
        />
      )}
      {showCreateMRAP && (
        <CreateMRAPModal
          onClose={() => setShowCreateMRAP(false)}
          onCreated={() => {
            setShowCreateMRAP(false)
            loadMRAPs()
          }}
        />
      )}
    </>
  )
}
