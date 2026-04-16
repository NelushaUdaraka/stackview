import { useState, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { HardDrive, Plus } from 'lucide-react'
import type { AppSettings, S3BucketInfo } from '../../types'
import S3Sidebar from './S3Sidebar'
import BucketDetail from './BucketDetail'
import CreateBucketModal from './CreateBucketModal'

interface Props {
  settings: AppSettings
}

export default function S3Layout({
  settings,
}: Props) {
  const [buckets, setBuckets] = useState<S3BucketInfo[]>([])
  const [selectedBucket, setSelectedBucket] = useState<S3BucketInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 180, max: 480 })

  const loadBuckets = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.s3ListBuckets()
      if (result.success && result.data) {
        setBuckets(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBuckets()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadBuckets()
    } finally {
      setRefreshing(false)
    }
  }

  const handleBucketCreated = async (name: string) => {
    setShowCreateModal(false)
    await loadBuckets()
    const found = buckets.find((b) => b.name === name)
    if (found) setSelectedBucket(found)
  }

  const handleBucketDeleted = async () => {
    setSelectedBucket(null)
    await loadBuckets()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex shrink-0" style={{ width: sidebarWidth }}>
          <S3Sidebar
            buckets={buckets}
            selectedBucket={selectedBucket}
            onSelectBucket={setSelectedBucket}
            onCreateBucket={() => setShowCreateModal(true)}
            loading={loading}
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
          {selectedBucket ? (
            <BucketDetail
              key={selectedBucket.name}
              bucket={selectedBucket}
              endpoint={settings.endpoint}
              region={settings.region}
              onDeleted={handleBucketDeleted}
            />
          ) : (
            <S3EmptyState onCreateBucket={() => setShowCreateModal(true)} />
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateBucketModal
          region={settings.region}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBucketCreated}
        />
      )}
    </div>
  )
}

function S3EmptyState({ onCreateBucket }: { onCreateBucket: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div
        className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
      >
        <HardDrive size={32} className="text-4" />
      </div>
      <h3 className="text-base font-semibold text-2 mb-2">Select a bucket to get started</h3>
      <p className="text-sm text-3 mb-6 max-w-xs leading-relaxed">
        Choose a bucket from the sidebar to browse and manage its objects.
      </p>
      <button
        onClick={onCreateBucket}
        className="btn-primary gap-2"
        style={{ backgroundColor: 'rgb(16 185 129)' }}
      >
        <Plus size={15} />
        Create New Bucket
      </button>
    </div>
  )
}
