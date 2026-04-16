import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { Server, Key, ShieldCheck, Network, HardDrive, Image, Plus } from 'lucide-react'
import type { AppSettings, Ec2Instance } from '../../types'
import EC2Sidebar from './EC2Sidebar'
import InstanceDetail from './InstanceDetail'
import LaunchInstanceModal from './LaunchInstanceModal'
import KeyPairsView from './KeyPairsView'
import SecurityGroupsView from './SecurityGroupsView'
import VPCsView from './VPCsView'
import VolumesView from './VolumesView'
import AMIsView from './AMIsView'

type MainView = 'instances' | 'keypairs' | 'securitygroups' | 'vpcs' | 'volumes' | 'amis'

interface Props {
  settings: AppSettings
}

const NAV_TABS: { id: MainView; label: string; icon: ReactNode }[] = [
  { id: 'instances', label: 'Instances', icon: <Server size={13} /> },
  { id: 'amis', label: 'AMIs', icon: <Image size={13} /> },
  { id: 'keypairs', label: 'Key Pairs', icon: <Key size={13} /> },
  { id: 'securitygroups', label: 'Security Groups', icon: <ShieldCheck size={13} /> },
  { id: 'vpcs', label: 'VPCs', icon: <Network size={13} /> },
  { id: 'volumes', label: 'Volumes', icon: <HardDrive size={13} /> },
]

export default function EC2Layout({
  settings,
}: Props) {
  const [mainView, setMainView] = useState<MainView>('instances')
  const [instances, setInstances] = useState<Ec2Instance[]>([])
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showLaunch, setShowLaunch] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })

  const loadInstances = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.ec2ListInstances()
      if (res.success && res.data) {
        // Filter out terminated instances from the main list by default
        const active = res.data.filter((i: Ec2Instance) => i.State?.Name !== 'terminated')
        setInstances(active)
        if (selectedInstanceId) {
          const stillExists = active.find((i: Ec2Instance) => i.InstanceId === selectedInstanceId)
          if (!stillExists) setSelectedInstanceId(null)
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [selectedInstanceId])

  useEffect(() => { loadInstances() }, [])

  const selectedInstance = instances.find(i => i.InstanceId === selectedInstanceId) ?? null

  return (
    <div className="flex flex-col h-full bg-app text-1">
      {/* Nav tabs */}
      <div className="flex items-center gap-0 shrink-0 border-b border-theme px-4" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        {NAV_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMainView(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
              ${mainView === tab.id ? 'border-orange-500 text-orange-600 dark:text-orange-300' : 'border-transparent text-3 hover:text-1'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {mainView === 'instances' ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex shrink-0" style={{ width: sidebarWidth }}>
            <EC2Sidebar
              instances={instances}
              selectedInstanceId={selectedInstanceId}
              onSelectInstance={setSelectedInstanceId}
              onLaunchInstance={() => setShowLaunch(true)}
              loading={loading}
            />
          </div>

          <div
            onMouseDown={handleResizeStart}
            className="w-1 shrink-0 cursor-col-resize relative select-none"
            style={{ backgroundColor: 'rgb(var(--border))' }}
          />

          <main className="flex-1 overflow-hidden flex flex-col bg-app">
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
              <EC2EmptyState onLaunch={() => setShowLaunch(true)} />
            )}
          </main>
        </div>
      ) : mainView === 'keypairs' ? (
        <div className="flex-1 overflow-hidden">
          <KeyPairsView />
        </div>
      ) : mainView === 'securitygroups' ? (
        <div className="flex-1 overflow-hidden">
          <SecurityGroupsView />
        </div>
      ) : mainView === 'vpcs' ? (
        <div className="flex-1 overflow-hidden">
          <VPCsView />
        </div>
      ) : mainView === 'volumes' ? (
        <div className="flex-1 overflow-hidden">
          <VolumesView />
        </div>
      ) : mainView === 'amis' ? (
        <div className="flex-1 overflow-hidden">
          <AMIsView />
        </div>
      ) : null}

      {showLaunch && (
        <LaunchInstanceModal
          onClose={() => setShowLaunch(false)}
          onLaunched={() => {
            setShowLaunch(false)
            loadInstances()
          }}
        />
      )}
    </div>
  )
}

function EC2EmptyState({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div
        className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
      >
        <Server size={32} className="text-4" />
      </div>
      <h3 className="text-base font-semibold text-2 mb-2">Select an instance</h3>
      <p className="text-sm text-3 mb-6 max-w-xs leading-relaxed">
        Choose an instance from the sidebar to view its details and manage its state.
      </p>
      <button
        onClick={onLaunch}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors"
      >
        <Plus size={15} />
        Launch Instance
      </button>
    </div>
  )
}
