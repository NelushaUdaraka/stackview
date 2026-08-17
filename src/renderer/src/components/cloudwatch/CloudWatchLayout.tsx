import { useState, useCallback, useEffect } from 'react'
import { FileText, Activity } from 'lucide-react'
import type { AppSettings, CloudWatchLogGroup } from '../../types'
import CloudWatchLogsView from './CloudWatchLogsView'
import {
  ServiceShell, ResourceRail, Inspector, formatBytes, type RailItem,
} from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function CloudWatchLayout({ settings }: Props) {
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [logGroups, setLogGroups] = useState<CloudWatchLogGroup[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [showCreateLogGroup, setShowCreateLogGroup] = useState(false)

  const loadLogGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.cloudwatchListLogGroups()
      if (res.success && res.data) {
        const list: CloudWatchLogGroup[] = res.data
        setLogGroups(list)
        setSelectedName(prev =>
          prev && list.some(g => g.logGroupName === prev) ? prev : (list[0]?.logGroupName ?? null)
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await window.electronAPI.cloudwatchReinit(settings.endpoint, settings.region)
      await loadLogGroups()
    }
    init()
  }, [refreshKey, settings.endpoint, settings.region, loadLogGroups])

  const selected = logGroups.find(g => g.logGroupName === selectedName) ?? null

  // `logGroupName` is optional on the SDK shape; a group without one can't be
  // selected, so it isn't listed.
  const railItems: RailItem[] = logGroups
    .filter((g): g is CloudWatchLogGroup & { logGroupName: string } => Boolean(g.logGroupName))
    .map(g => ({
      id: g.logGroupName,
      name: g.logGroupName,
      icon: FileText,
      state: 'ok' as const,
      sub: g.retentionInDays ? `${g.retentionInDays}D RETENTION` : 'NEVER EXPIRES',
      meta: g.storedBytes != null ? formatBytes(g.storedBytes) : undefined,
    }))

  return (
    <ServiceShell
      rail={
        <ResourceRail
          title="LOG GROUPS"
          items={railItems}
          selectedId={selectedName}
          onSelect={item => setSelectedName(item.id)}
          icon={FileText}
          searchPlaceholder="Search log groups..."
          onCreate={() => setShowCreateLogGroup(true)}
          createLabel="Create Log Group"
          loading={loading}
          emptyLabel="No log groups"
        />
      }
      inspector={
        selected ? (
          <Inspector
            kind="log group"
            icon={Activity}
            iconColor="#06b6d4"
            title={selected.logGroupName ?? 'Log group'}
            subtitle="CloudWatch Logs"
            rows={[
              {
                key: 'Retention',
                value: selected.retentionInDays ? `${selected.retentionInDays} days` : 'Never expires',
                color: 'rgb(var(--accent))',
              },
              {
                key: 'Stored',
                value: selected.storedBytes != null ? formatBytes(selected.storedBytes) : '—',
              },
              {
                key: 'Created',
                value: selected.creationTime ? new Date(selected.creationTime).toLocaleDateString() : '—',
                color: 'rgb(var(--text-2))',
              },
              { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
            ]}
          />
        ) : undefined
      }
    >
      <CloudWatchLogsView
        key={`logs-${selectedName ?? 'none'}-${refreshKey}`}
        selectedGroup={selected}
        loading={loading}
        setLoading={setLoading}
        onGroupDeleted={() => {
          setSelectedName(null)
          setRefreshKey(k => k + 1)
        }}
        showCreateModal={showCreateLogGroup}
        onCloseCreateModal={() => setShowCreateLogGroup(false)}
        onGroupCreated={loadLogGroups}
      />
    </ServiceShell>
  )
}
