import { useState, useEffect, useCallback } from 'react'
import { Database } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, RedshiftCluster } from '../../types'
import RedshiftClusterDetail from './RedshiftClusterDetail'
import CreateRedshiftClusterModal from './CreateRedshiftClusterModal'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, statusColor, stateOf, type RailItem,
} from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function RedshiftLayout({ settings }: Props) {
  const [loading, setLoading] = useState(false)
  const [clusters, setClusters] = useState<RedshiftCluster[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { showToast } = useToastContext()

  const loadClusters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.redshiftListClusters()
      if (res.success && res.data) {
        const list: RedshiftCluster[] = res.data
        setClusters(list)
        setSelectedId(prev =>
          prev && list.some(c => c.ClusterIdentifier === prev)
            ? prev
            : (list[0]?.ClusterIdentifier ?? null)
        )
      } else {
        showToast('error', res.error || 'Failed to list clusters')
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadClusters()
  }, [loadClusters])

  const selected = clusters.find(c => c.ClusterIdentifier === selectedId) ?? null

  // The SDK types every field as optional; a cluster with no identifier can't
  // be addressed, so it isn't listed.
  const railItems: RailItem[] = clusters
    .filter((c): c is RedshiftCluster & { ClusterIdentifier: string } => Boolean(c.ClusterIdentifier))
    .map(c => ({
      id: c.ClusterIdentifier,
      name: c.ClusterIdentifier,
      icon: Database,
      state: stateOf(c.ClusterStatus) ?? 'warn',
      sub: c.ClusterStatus?.toUpperCase(),
      meta: c.NodeType,
    }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="CLUSTERS"
            items={railItems}
            selectedId={selectedId}
            onSelect={item => setSelectedId(item.id)}
            icon={Database}
            searchPlaceholder="Search clusters..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="Create Cluster"
            loading={loading}
            emptyLabel="No clusters yet"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="cluster"
              icon={Database}
              iconColor="#ef4444"
              title={selected.ClusterIdentifier ?? 'Cluster'}
              subtitle={selected.NodeType}
              rows={[
                {
                  key: 'Status',
                  value: selected.ClusterStatus ?? '—',
                  color: statusColor(selected.ClusterStatus),
                },
                { key: 'Node type', value: selected.NodeType ?? '—', color: 'rgb(var(--text-2))' },
                { key: 'Nodes', value: String(selected.NumberOfNodes ?? '—') },
                { key: 'Database', value: selected.DBName ?? '—', color: 'rgb(var(--text-2))' },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selected ? (
          <RedshiftClusterDetail
            key={selected.ClusterIdentifier}
            cluster={selected}
            onRefresh={loadClusters}
            onDeleted={() => {
              setSelectedId(null)
              loadClusters()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Database}
              title={loading ? 'Loading clusters…' : 'Select a cluster'}
              hint="Pick a cluster from the rail to inspect its nodes and endpoint."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Cluster
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateRedshiftClusterModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            loadClusters()
          }}
        />
      )}
    </>
  )
}
