import { useCallback, useEffect, useState } from 'react'
import { HardDrive } from 'lucide-react'
import type { AppSettings, S3BucketInfo } from '../../types'
import BucketDetail from './BucketDetail'
import CreateBucketModal from './CreateBucketModal'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, type RailItem,
} from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function S3Layout({ settings }: Props) {
  const [buckets, setBuckets] = useState<S3BucketInfo[]>([])
  const [selected, setSelected] = useState<S3BucketInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadBuckets = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.s3ListBuckets()
      if (result.success && result.data) setBuckets(result.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBuckets()
  }, [loadBuckets])

  const railItems: RailItem[] = buckets.map(b => ({
    id: b.name,
    name: b.name,
    icon: HardDrive,
    state: 'ok',
    sub: 'BUCKET',
    meta: b.creationDate ? new Date(b.creationDate).toLocaleDateString() : undefined,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="BUCKETS"
            items={railItems}
            selectedId={selected?.name ?? null}
            onSelect={item => setSelected(buckets.find(b => b.name === item.id) ?? null)}
            icon={HardDrive}
            searchPlaceholder="Search buckets..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="New Bucket"
            loading={loading}
            emptyLabel="No buckets yet"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="bucket"
              icon={HardDrive}
              iconColor="#10b981"
              title={selected.name}
              subtitle={settings.region}
              sectionTitle="BUCKET"
              rows={[
                { key: 'Region', value: settings.region, color: 'rgb(var(--accent))' },
                {
                  key: 'Created',
                  value: selected.creationDate ? new Date(selected.creationDate).toLocaleDateString() : '—',
                  color: 'rgb(var(--text-2))',
                },
                { key: 'Endpoint', value: settings.endpoint, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selected ? (
          <BucketDetail
            key={selected.name}
            bucket={selected}
            endpoint={settings.endpoint}
            region={settings.region}
            onDeleted={async () => {
              setSelected(null)
              await loadBuckets()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={HardDrive}
              title="Select a bucket"
              hint="Pick a bucket from the rail to browse and manage its objects."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  New Bucket
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateBucketModal
          region={settings.region}
          onClose={() => setShowCreateModal(false)}
          onCreated={async (name: string) => {
            setShowCreateModal(false)
            await loadBuckets()
            setSelected({ name })
          }}
        />
      )}
    </>
  )
}
