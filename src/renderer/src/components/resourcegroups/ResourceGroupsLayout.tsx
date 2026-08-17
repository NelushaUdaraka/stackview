import { useState, useCallback, useEffect } from 'react'
import { Boxes, Tags } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, RgGroup } from '../../types'
import GroupDetail from './GroupDetail'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, type RailItem,
} from '../common/ui'
import TagExplorerPanel from './TagExplorerPanel'
import CreateGroupModal from './CreateGroupModal'

type SidebarMode = 'groups' | 'tagexplorer'

interface Props {
  settings: AppSettings
}

export default function ResourceGroupsLayout({ settings }: Props) {
  const [groups, setGroups] = useState<RgGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<RgGroup | null>(null)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('groups')
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

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

  const railItems: RailItem[] = [
    { id: '__tagexplorer__', name: 'Tag Explorer', icon: Tags, sub: 'ACROSS RESOURCES' },
    ...groups.map(g => ({
      id: g.groupArn,
      name: g.name,
      icon: Boxes,
      state: 'ok' as const,
      sub: 'GROUP',
      keywords: g.description,
    })),
  ]

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="RESOURCE GROUPS"
            items={railItems}
            selectedId={sidebarMode === 'tagexplorer' ? '__tagexplorer__' : (selectedGroup?.groupArn ?? null)}
            onSelect={item => {
              if (item.id === '__tagexplorer__') {
                handleModeChange('tagexplorer')
              } else {
                handleModeChange('groups')
                setSelectedGroup(groups.find(g => g.groupArn === item.id) ?? null)
              }
            }}
            icon={Boxes}
            searchPlaceholder="Search groups..."
            onCreate={() => setShowCreate(true)}
            createLabel="Create Group"
            loading={loading}
            emptyLabel="No resource groups"
          />
        }
        inspector={
          selectedGroup && sidebarMode === 'groups' ? (
            <Inspector
              kind="group"
              icon={Boxes}
              iconColor="#f97316"
              title={selectedGroup.name}
              subtitle={selectedGroup.description || 'Resource group'}
              sectionTitle="GROUP"
              rows={[
                { key: 'Region', value: settings.region, color: 'rgb(var(--accent))' },
                { key: 'ARN', value: selectedGroup.groupArn, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {sidebarMode === 'tagexplorer' ? (
          <TagExplorerPanel showToast={showToast} />
        ) : selectedGroup ? (
          <GroupDetail
            key={selectedGroup.groupArn}
            group={selectedGroup}
            showToast={showToast}
            onDeleted={handleDeleted}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Boxes}
              title={loading ? 'Loading groups\u2026' : 'Select a group'}
              hint="Pick a group from the rail, or open Tag Explorer to search across resources."
              action={
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                  Create Group
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreate && (
        <CreateGroupModal
          showToast={showToast}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadGroups()
          }}
        />
      )}
    </>
  )
}
