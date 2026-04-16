import React, { useState, useEffect, useCallback } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import { AppSettings, RedshiftCluster } from '../../types'
import RedshiftSidebar from './RedshiftSidebar'
import RedshiftClusterDetail from './RedshiftClusterDetail'
import CreateRedshiftClusterModal from './CreateRedshiftClusterModal'
import { AlertCircle } from 'lucide-react'

interface RedshiftLayoutProps {
  settings: AppSettings
}

const RedshiftLayout: React.FC<RedshiftLayoutProps> = ({
  settings,
}) => {
  const [loading, setLoading] = useState(false)
  const [clusters, setClusters] = useState<RedshiftCluster[]>([])
  const [selectedCluster, setSelectedCluster] = useState<RedshiftCluster | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadClusters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.redshiftListClusters()
      if (res.success && res.data) {
        setClusters(res.data)
        if (selectedCluster) {
          const refreshed = res.data.find(c => c.ClusterIdentifier === selectedCluster.ClusterIdentifier)
          setSelectedCluster(refreshed || null)
        } else if (res.data.length > 0 && !selectedCluster) {
          setSelectedCluster(res.data[0])
        }
      } else {
        showToast('error', res.error || 'Failed to list clusters')
      }
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedCluster, showToast])

  useEffect(() => {
    loadClusters()
  }, [])

  return (
    <div className="flex flex-col h-full bg-app overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <RedshiftSidebar
            clusters={clusters}
            selectedCluster={selectedCluster}
            onSelectCluster={setSelectedCluster}
            onCreateCluster={() => setShowCreateModal(true)}
            loading={loading}
          />
        </div>

        {/* Resize Handle */}
        <div 
          onMouseDown={handleResizeStart} 
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20" 
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        {/* Content */}
        <main className="flex-1 overflow-hidden bg-app">
          {selectedCluster ? (
            <RedshiftClusterDetail
              cluster={selectedCluster}
              onRefresh={loadClusters}
              onDeleted={() => {
                setSelectedCluster(null)
                loadClusters()
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-3 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-raised flex items-center justify-center border border-theme">
                <AlertCircle size={32} className="text-4" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-1">No Cluster Selected</h3>
                <p className="text-sm">Select a cluster from the sidebar or create a new one</p>
              </div>
              <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          Create Redshift Cluster
        </button>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateRedshiftClusterModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            loadClusters()
          }}
        />
      )}
    </div>
  )
}

export default RedshiftLayout
