import { useState, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import type { AppSettings, Route53HostedZone } from '../../types'
import Route53Sidebar from './Route53Sidebar'
import HostedZoneDetail from './HostedZoneDetail'
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
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 200, max: 520 })

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex shrink-0" style={{ width: sidebarWidth }}>
          <Route53Sidebar
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={(id) => { setSelectedZoneId(id); setMainView('zone') }}
            onCreateZone={() => setShowCreateModal(true)}
            onShowHealthChecks={() => { setSelectedZoneId(null); setMainView('healthchecks') }}
            mainView={mainView}
            loading={loading}
          />
        </div>

        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        <main className="flex-1 overflow-hidden bg-app">
          {mainView === 'healthchecks' ? (
            <HealthChecksPanel key="healthchecks" />
          ) : selectedZone ? (
            <HostedZoneDetail
              key={selectedZone.Id}
              zone={selectedZone}
              onDeleted={handleZoneDeleted}
            />
          ) : (
            <Route53EmptyState onCreateZone={() => setShowCreateModal(true)} />
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateHostedZoneModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleZoneCreated}
        />
      )}
    </div>
  )
}

function Route53EmptyState({ onCreateZone }: { onCreateZone: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
        style={{ backgroundColor: 'rgb(59 130 246 / 0.1)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(59 130 246)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-1">No hosted zone selected</p>
      <p className="text-xs text-3 max-w-xs">Select a hosted zone from the sidebar or create a new one to manage DNS records.</p>
      <button onClick={onCreateZone}
        className="mt-2 text-xs font-semibold px-4 py-2 rounded-lg text-white transition-colors"
        style={{ backgroundColor: 'rgb(59 130 246)' }}>
        Create Hosted Zone
      </button>
    </div>
  )
}
