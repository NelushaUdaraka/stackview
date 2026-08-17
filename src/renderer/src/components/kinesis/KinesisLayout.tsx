import { useState, useEffect, useCallback } from 'react'
import { Activity } from 'lucide-react'
import KinesisStreamDetail from './KinesisStreamDetail'
import CreateKinesisStreamModal from './CreateKinesisStreamModal'
import type { AppSettings } from '../../types'
import { ServiceShell, ResourceRail, Inspector, EmptyState, type RailItem } from '../common/ui'

interface Props {
  settings: AppSettings
  showToast: (type: 'success' | 'error', text: string) => void
}

export default function KinesisLayout({ settings, showToast }: Props) {
  const [streams, setStreams] = useState<string[]>([])
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadStreams = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await window.electronAPI.kinesisListStreams(settings.endpoint, settings.region)
      if (res.success && res.data) setStreams(res.data)
      else showToast('error', res.error || 'Failed to load streams')
    } finally {
      setRefreshing(false)
    }
  }, [settings.endpoint, settings.region, showToast])

  useEffect(() => {
    window.electronAPI.kinesisReinit(settings.endpoint, settings.region)
    loadStreams()
  }, [settings.endpoint, settings.region, loadStreams])

  const railItems: RailItem[] = streams.map(name => ({
    id: name,
    name,
    icon: Activity,
    state: 'ok',
    sub: 'STREAM',
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="DATA STREAMS"
            items={railItems}
            selectedId={selectedStream}
            onSelect={item => setSelectedStream(item.id)}
            icon={Activity}
            searchPlaceholder="Search streams..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="Create Stream"
            loading={refreshing}
            emptyLabel="No data streams"
          />
        }
        inspector={
          selectedStream ? (
            <Inspector
              kind="data stream"
              icon={Activity}
              iconColor="#f59e0b"
              title={selectedStream}
              subtitle="Kinesis data stream"
              sectionTitle="STREAM"
              rows={[
                { key: 'Region', value: settings.region, color: 'rgb(var(--accent))' },
                { key: 'Endpoint', value: settings.endpoint, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selectedStream ? (
          <KinesisStreamDetail
            key={selectedStream}
            streamName={selectedStream}
            onDeleted={() => {
              setSelectedStream(null)
              loadStreams()
            }}
            endpoint={settings.endpoint}
            region={settings.region}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Activity}
              title="Select a stream"
              hint="Pick a data stream from the rail to monitor its shards and capacity."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Stream
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateKinesisStreamModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            loadStreams()
            setShowCreateModal(false)
          }}
          endpoint={settings.endpoint}
          region={settings.region}
        />
      )}
    </>
  )
}
