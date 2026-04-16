import { useState, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { Lock, Plus } from 'lucide-react'
import type { AppSettings, S3ControlAccessPoint, S3ControlMRAP } from '../../types'
import S3ControlSidebar, { type SidebarSection } from './S3ControlSidebar'
import AccessPointDetail from './AccessPointDetail'
import MRAPDetail from './MRAPDetail'
import AccountSettingsPanel from './AccountSettingsPanel'
import CreateAccessPointModal from './CreateAccessPointModal'
import CreateMRAPModal from './CreateMRAPModal'

interface Props {
  settings: AppSettings
}

export default function S3ControlLayout({ settings: _settings }: Props) {
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

  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 520 })

  const loadAccessPoints = async () => {
    setLoadingAPs(true)
    try {
      const res = await window.electronAPI.s3controlListAccessPoints()
      if (res.success && res.data) {
        setAccessPoints(res.data.sort((a, b) => a.name.localeCompare(b.name)))
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
        setMraps(res.data.sort((a, b) => a.name.localeCompare(b.name)))
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

  const renderMain = () => {
    if (showAccountSettings) {
      return <AccountSettingsPanel onClose={() => setShowAccountSettings(false)} />
    }
    if (section === 'accesspoints' && selectedAP) {
      return (
        <AccessPointDetail
          key={selectedAP.name}
          accessPoint={selectedAP}
          onDeleted={handleAPDeleted}
        />
      )
    }
    if (section === 'mraps' && selectedMRAP) {
      return (
        <MRAPDetail
          key={selectedMRAP.name}
          mrap={selectedMRAP}
          onDeleted={handleMRAPDeleted}
        />
      )
    }
    return <EmptyState onCreate={() => section === 'accesspoints' ? setShowCreateAP(true) : setShowCreateMRAP(true)} section={section} />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex shrink-0 z-10" style={{ width: sidebarWidth }}>
          <S3ControlSidebar
            section={section}
            onSectionChange={setSection}
            accessPoints={accessPoints}
            mraps={mraps}
            selectedAP={selectedAP}
            selectedMRAP={selectedMRAP}
            onSelectAP={handleSelectAP}
            onSelectMRAP={handleSelectMRAP}
            onCreateAP={() => setShowCreateAP(true)}
            onCreateMRAP={() => setShowCreateMRAP(true)}
            onOpenAccountSettings={handleOpenAccountSettings}
            showAccountSettings={showAccountSettings}
            loadingAPs={loadingAPs}
            loadingMRAPs={loadingMRAPs}
          />
        </div>

        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        <main className="flex-1 overflow-hidden bg-app">
          {renderMain()}
        </main>
      </div>

      {showCreateAP && (
        <CreateAccessPointModal
          onClose={() => setShowCreateAP(false)}
          onCreated={async () => {
            setShowCreateAP(false)
            await loadAccessPoints()
          }}
        />
      )}

      {showCreateMRAP && (
        <CreateMRAPModal
          onClose={() => setShowCreateMRAP(false)}
          onCreated={async () => {
            setShowCreateMRAP(false)
            await loadMRAPs()
          }}
        />
      )}
    </div>
  )
}

function EmptyState({ onCreate, section }: { onCreate: () => void; section: SidebarSection }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div
        className="w-20 h-20 rounded-2xl border border-theme flex items-center justify-center mb-5"
        style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
      >
        <Lock size={32} className="text-4" />
      </div>
      <h3 className="text-base font-semibold text-2 mb-2">
        {section === 'accesspoints' ? 'Select an Access Point' : 'Select a Multi-Region Access Point'}
      </h3>
      <p className="text-sm text-3 mb-6 max-w-xs leading-relaxed">
        {section === 'accesspoints'
          ? 'Choose an access point from the sidebar to view its configuration and manage policies.'
          : 'Choose a multi-region access point from the sidebar to view its details and manage routing policies.'}
      </p>
      <button onClick={onCreate} className="btn-primary gap-2" style={{ backgroundColor: 'rgb(13 148 136)' }}>
        <Plus size={15} />
        {section === 'accesspoints' ? 'Create Access Point' : 'Create MRAP'}
      </button>
    </div>
  )
}
