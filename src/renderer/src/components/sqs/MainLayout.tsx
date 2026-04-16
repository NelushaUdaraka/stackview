import { useState, useCallback } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { Layers, Plus } from 'lucide-react'
import type { AppSettings, QueueInfo } from '../../types'
import Sidebar from './Sidebar'
import QueueDetail from './QueueDetail'
import CreateQueueModal from './CreateQueueModal'

interface Props {
  settings: AppSettings
  queues: QueueInfo[]
  selectedQueue: QueueInfo | null
  onSelectQueue: (q: QueueInfo) => void
  onQueuesChanged: () => void
}

export default function MainLayout({
  settings,
  queues,
  selectedQueue,
  onSelectQueue,
  onQueuesChanged,
}: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sidebarQueues, setSidebarQueues] = useState<QueueInfo[]>(queues)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 180, max: 480 })

  // Sync queues
  if (JSON.stringify(queues) !== JSON.stringify(sidebarQueues)) {
    setSidebarQueues(queues)
  }

  const handleQueueDeleted = useCallback(async () => {
    await onQueuesChanged()
    onSelectQueue(null as unknown as QueueInfo)
  }, [onQueuesChanged, onSelectQueue])

  const refreshQueueAttributes = useCallback(
    async (url: string): Promise<Record<string, string>> => {
      const result = await window.electronAPI.getQueueAttributes(url)
      if (result.success && result.data) {
        setSidebarQueues((prev) =>
          prev.map((q) => (q.url === url ? { ...q, attributes: result.data } : q))
        )
        return result.data!
      }
      return {}
    },
    []
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with dynamic width */}
        <div
          className="flex shrink-0"
          style={{ width: sidebarWidth }}
        >
          <Sidebar
            queues={sidebarQueues}
            selectedQueue={selectedQueue}
            onSelectQueue={onSelectQueue}
            onCreateQueue={() => setShowCreateModal(true)}
            loading={false}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none"
          style={{ backgroundColor: 'rgb(var(--border))' }}
          title="Drag to resize"
        />

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-app">
          {selectedQueue ? (
            <QueueDetail
              key={selectedQueue.url}
              queue={selectedQueue}
              onDeleted={handleQueueDeleted}
              onPurged={async () => {
                await refreshQueueAttributes(selectedQueue.url)
              }}
              onRefreshAttributes={refreshQueueAttributes}
            />
          ) : (
            <EmptyState onCreateQueue={() => setShowCreateModal(true)} />
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateQueueModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async () => {
            setShowCreateModal(false)
            await onQueuesChanged()
          }}
        />
      )}
    </div>
  )
}

function EmptyState({ onCreateQueue }: { onCreateQueue: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div
        className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
      >
        <Layers size={32} className="text-4" />
      </div>
      <h3 className="text-base font-semibold text-2 mb-2">Select a queue to get started</h3>
      <p className="text-sm text-3 mb-6 max-w-xs leading-relaxed">
        Choose a queue from the sidebar to view its details, send messages, or manage it.
      </p>
      <button onClick={onCreateQueue} className="btn-primary gap-2">
        <Plus size={15} />
        Create New Queue
      </button>
    </div>
  )
}
