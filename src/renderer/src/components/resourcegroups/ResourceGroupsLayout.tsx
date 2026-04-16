import { useState, useCallback, useEffect } from 'react'
import { Boxes, Plus } from 'lucide-react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, RgGroup } from '../../types'
import ResourceGroupsSidebar from './ResourceGroupsSidebar'
import GroupDetail from './GroupDetail'
import TagExplorerPanel from './TagExplorerPanel'
import CreateGroupModal from './CreateGroupModal'

type SidebarMode = 'groups' | 'tagexplorer'

interface Props {
  settings: AppSettings
}

export default function ResourceGroupsLayout({ settings: _settings }: Props) {
  const [groups, setGroups] = useState<RgGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<RgGroup | null>(null)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('groups')
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadGroups = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.rgListGroups()
    if (res.success && res.data) {
      setGroups(res.data)
    } else if (!res.success) {
      showToast('error', res.error ?? 'Failed to load groups')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => { loadGroups() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeChange = (mode: SidebarMode) => {
    setSidebarMode(mode)
    if (mode !== 'groups') setSelectedGroup(null)
  }

  const handleDeleted = () => {
    setSelectedGroup(null)
    loadGroups()
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <ResourceGroupsSidebar
            groups={groups}
            selectedGroup={selectedGroup}
            mode={sidebarMode}
            onSelectGroup={setSelectedGroup}
            onModeChange={handleModeChange}
            onCreateGroup={() => setShowCreate(true)}
            loading={loading}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-app">
          {sidebarMode === 'tagexplorer' ? (
            <TagExplorerPanel />
          ) : selectedGroup ? (
            <GroupDetail
              key={selectedGroup.groupArn}
              group={selectedGroup}
              onDeleted={handleDeleted}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <Boxes size={40} className="text-orange-500 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No group selected</p>
                <p className="text-xs text-3">
                  {loading
                    ? 'Loading groups…'
                    : groups.length === 0
                    ? 'Create a resource group to get started'
                    : 'Select a group from the sidebar'}
                </p>
              </div>
              {!loading && groups.length === 0 && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors"
                >
                  <Plus size={14} /> Create Group
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadGroups() }}
        />
      )}
    </div>
  )
}
