import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { FileText } from 'lucide-react'
import type { AppSettings, CloudWatchLogGroup } from '../../types'
import CloudWatchSidebar from './CloudWatchSidebar'
import CloudWatchLogsView from './CloudWatchLogsView'

interface Props {
  settings: AppSettings
}

export default function CloudWatchLayout({
  settings,
}: Props) {
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Resources state
  const [logGroups, setLogGroups] = useState<CloudWatchLogGroup[]>([])
  const [selectedLogGroup, setSelectedLogGroup] = useState<CloudWatchLogGroup | null>(null)
  const [showCreateLogGroup, setShowCreateLogGroup] = useState(false)

  const loadLogGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.cloudwatchListLogGroups()
      if (res.success && res.data) {
        setLogGroups(res.data)
        if (!selectedLogGroup && res.data.length > 0) {
          setSelectedLogGroup(res.data[0])
        }
      }
    } finally {
      setLoading(false)
    }
  }, [selectedLogGroup])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        await window.electronAPI.cloudwatchReinit(settings.endpoint, settings.region)
        await loadLogGroups()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [refreshKey, settings.endpoint, settings.region, loadLogGroups])

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <div className="flex flex-col h-full bg-app overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative">
        {/* Unified Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <CloudWatchSidebar
            logGroups={logGroups}
            selectedLogGroup={selectedLogGroup}
            onSelectLogGroup={setSelectedLogGroup}
            onCreateLogGroup={() => setShowCreateLogGroup(true)}
            loading={loading}
          />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        {/* Content Area */}
        <div className="flex-1 h-full overflow-hidden bg-app">
          <CloudWatchLogsView
            key={`logs-${selectedLogGroup?.logGroupName || 'none'}-${refreshKey}`}
            selectedGroup={selectedLogGroup}
            loading={loading}
            setLoading={setLoading}
            onGroupDeleted={() => { setSelectedLogGroup(null); loadLogGroups() }}
            showCreateModal={showCreateLogGroup}
            onCloseCreateModal={() => setShowCreateLogGroup(false)}
            onGroupCreated={loadLogGroups}
          />
        </div>
      </div>
    </div>
  )
}
