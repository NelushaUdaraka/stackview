import { useState, useEffect, useCallback } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { Activity, Plus } from 'lucide-react'
import KinesisSidebar from './KinesisSidebar'
import KinesisStreamDetail from './KinesisStreamDetail'
import CreateKinesisStreamModal from './CreateKinesisStreamModal'
import type { AppSettings } from '../../types'

interface Props {
  settings: AppSettings
  showToast: (type: 'success' | 'error', text: string) => void
}

export default function KinesisLayout({
  settings, showToast,
}: Props) {
  const [streams, setStreams] = useState<string[]>([])
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 200, max: 480 })

  const loadStreams = useCallback(async () => {
    setRefreshing(true)
    const res = await window.electronAPI.kinesisListStreams(settings.endpoint, settings.region)
    if (res.success && res.data) {
      setStreams(res.data)
    } else {
      showToast('error', res.error || 'Failed to load streams')
    }
    setRefreshing(false)
  }, [settings.endpoint, settings.region, showToast])

  useEffect(() => {
    window.electronAPI.kinesisReinit(settings.endpoint, settings.region)
    loadStreams()
  }, [settings.endpoint, settings.region, loadStreams])

  const handleCreated = () => {
    loadStreams()
    setShowCreateModal(false)
  }

  const handleDeleted = () => {
    setSelectedStream(null)
    loadStreams()
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-app text-1 select-none">
      <div className="flex flex-1 overflow-hidden relative">
        <KinesisSidebar
          streams={streams}
          selectedStream={selectedStream}
          onSelectStream={setSelectedStream}
          onCreateStream={() => setShowCreateModal(true)}
          refreshing={refreshing}
          sidebarWidth={sidebarWidth}
        />

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20 transition-colors"
          style={{ backgroundColor: 'rgb(var(--border))', left: 0 }}
        />

        <main className="flex-1 overflow-hidden bg-app relative mt-0.5">
          {selectedStream ? (
            <KinesisStreamDetail
              key={selectedStream}
              streamName={selectedStream}
              onDeleted={handleDeleted}
              showToast={showToast}
              endpoint={settings.endpoint}
              region={settings.region}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-app animate-in fade-in duration-500">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/5 flex items-center justify-center text-amber-500/20 mb-6 ring-1 ring-amber-500/10 shadow-inner">
                <Activity size={40} />
              </div>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-black text-1 tracking-tight">No Stream Selected</h3>
                <p className="text-sm text-3 max-w-xs leading-relaxed">Select a data stream from the sidebar to monitor its shards, capacity, and status.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-amber-500/20 active:scale-95 group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                Create New Stream
              </button>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateKinesisStreamModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
          showToast={showToast}
          endpoint={settings.endpoint}
          region={settings.region}
        />
      )}
    </div>
  )
}
