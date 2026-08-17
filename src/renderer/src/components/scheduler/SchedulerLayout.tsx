import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, Plus, Loader2, AlertTriangle } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, EbScheduleGroup } from '../../types'
import SchedulerGroupDetail from './SchedulerGroupDetail'
import CreateScheduleModal from './CreateScheduleModal'
import {
  ServiceShell, ResourceRail, Inspector, InspectorSection, EmptyState, Modal, statusColor, stateOf,
  type RailItem,
} from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function SchedulerLayout({ settings }: Props) {
  const { showToast } = useToastContext()
  const [groups, setGroups] = useState<EbScheduleGroup[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  // Bumped to force the detail view to refetch its schedules after a create.
  const [detailKey, setDetailKey] = useState(0)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.schedulerListGroups()
      if (res.success && res.data) {
        const list = res.data as EbScheduleGroup[]
        setGroups(list)
        setSelectedName(prev => {
          if (prev && list.some(g => g.name === prev)) return prev
          return list.find(g => g.name === 'default')?.name ?? list[0]?.name ?? null
        })
      } else if (!res.success) {
        showToast('error', res.error || 'Failed to load schedule groups')
      }
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const selected = groups.find(g => g.name === selectedName) ?? null

  const railItems: RailItem[] = groups.map(g => ({
    id: g.name,
    name: g.name,
    icon: CalendarClock,
    state: stateOf(g.state) ?? 'ok',
    sub: g.name === 'default' ? 'MANAGED' : (g.state ?? 'ACTIVE').toUpperCase(),
    meta: g.creationDate ? new Date(g.creationDate).toLocaleDateString() : undefined,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="SCHEDULE GROUPS"
            items={railItems}
            selectedId={selectedName}
            onSelect={item => setSelectedName(item.id)}
            icon={CalendarClock}
            searchPlaceholder="Search groups..."
            onCreate={() => setShowCreateGroup(true)}
            createLabel="Create Group"
            loading={loading}
            emptyLabel="No schedule groups"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="group"
              icon={CalendarClock}
              iconColor="#f59e0b"
              title={selected.name}
              subtitle={selected.name === 'default' ? 'Managed default group' : 'Custom schedule group'}
              sectionTitle="GROUP"
              rows={[
                { key: 'State', value: selected.state ?? 'ACTIVE', color: statusColor(selected.state) },
                {
                  key: 'Created',
                  value: selected.creationDate ? new Date(selected.creationDate).toLocaleDateString() : '—',
                  color: 'rgb(var(--text-2))',
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
                { key: 'ARN', value: selected.arn, color: 'rgb(var(--text-2))' },
              ]}
            >
              <InspectorSection title="ACTIONS">
                <button onClick={() => setShowCreateSchedule(true)} className="btn-primary w-full">
                  <Plus size={12} />
                  New Schedule
                </button>
              </InspectorSection>
            </Inspector>
          ) : undefined
        }
      >
        {selected ? (
          <SchedulerGroupDetail
            key={`${selected.name}-${detailKey}`}
            group={selected}
            onRefresh={loadGroups}
            onDeleted={() => {
              showToast('success', 'Group deleted')
              setSelectedName(null)
              loadGroups()
            }}
            onCreateSchedule={() => setShowCreateSchedule(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={CalendarClock}
              title={loading ? 'Loading groups…' : 'Select a group'}
              hint={
                groups.length === 0 && !loading
                  ? 'Create a schedule group to get started.'
                  : 'Pick a group from the rail to manage its schedules.'
              }
              action={
                groups.length === 0 && !loading ? (
                  <button onClick={() => setShowCreateGroup(true)} className="btn-primary">
                    <Plus size={12} />
                    Create Group
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={group => {
            showToast('success', `Group "${group.name}" created`)
            setShowCreateGroup(false)
            loadGroups()
            setSelectedName(group.name)
          }}
        />
      )}
      {showCreateSchedule && (
        <CreateScheduleModal
          groups={groups}
          defaultGroup={selected}
          onClose={() => setShowCreateSchedule(false)}
          onCreated={() => {
            setShowCreateSchedule(false)
            setDetailKey(k => k + 1)
            loadGroups()
          }}
        />
      )}
    </>
  )
}

function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (group: EbScheduleGroup) => void
}) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!name.trim()) return
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.schedulerCreateGroup(name.trim())
    setSubmitting(false)
    if (res.success) onCreated({ name: name.trim(), arn: res.data || '', state: 'ACTIVE' })
    else setError(res.error || 'Failed to create group')
  }

  return (
    <Modal
      title="Create Schedule Group"
      onClose={onClose}
      width={420}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={!name.trim() || submitting} className="btn-primary">
            {submitting && <Loader2 size={13} className="animate-spin" />}
            Create Group
          </button>
        </>
      }
    >
      <div className="p-4">
        <div className="ui-label mb-2">GROUP NAME</div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && submit()}
          placeholder="nightly-jobs"
          className="input-base"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
        />
        <p className="text-[11px] text-4 mt-1.5">Groups organise schedules and can be deleted together.</p>

        {error && (
          <div
            className="mt-3 flex items-center gap-2 rounded-[7px] px-2.5 py-2 text-[11.5px]"
            style={{
              backgroundColor: 'rgb(var(--danger) / 0.10)',
              border: '1px solid rgb(var(--danger) / 0.35)',
              color: 'rgb(var(--danger))',
            }}
          >
            <AlertTriangle size={13} className="shrink-0" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
