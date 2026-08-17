import { useCallback, useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import type { AppSettings, FirehoseDeliveryStream } from '../../types'
import FirehoseStreamDetail from './FirehoseStreamDetail'
import CreateFirehoseStreamModal from './CreateFirehoseStreamModal'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, statusColor, stateOf, type RailItem,
} from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function FirehoseLayout({ settings }: Props) {
  const [streams, setStreams] = useState<FirehoseDeliveryStream[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const loadStreams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.firehoseListDeliveryStreams()
      if (res.success && res.data) {
        const names: string[] = res.data
        // The list call returns names only — describe each to get status and type.
        const described = await Promise.all(
          names.map(async name => {
            const desc = await window.electronAPI.firehoseDescribeDeliveryStream(name)
            return desc.data as FirehoseDeliveryStream | undefined
          })
        )
        const list = described.filter((s): s is FirehoseDeliveryStream => Boolean(s))
        setStreams(list)
        setSelectedName(prev =>
          prev && list.some(s => s.DeliveryStreamName === prev)
            ? prev
            : (list[0]?.DeliveryStreamName ?? null)
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStreams()
  }, [loadStreams])

  const selected = streams.find(s => s.DeliveryStreamName === selectedName) ?? null

  const railItems: RailItem[] = streams.map(s => ({
    id: s.DeliveryStreamName,
    name: s.DeliveryStreamName,
    icon: Flame,
    state: stateOf(s.DeliveryStreamStatus) ?? 'warn',
    sub: s.DeliveryStreamStatus,
    meta: s.DeliveryStreamType,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="DELIVERY STREAMS"
            items={railItems}
            selectedId={selectedName}
            onSelect={item => setSelectedName(item.id)}
            icon={Flame}
            searchPlaceholder="Search streams..."
            onCreate={() => setShowCreate(true)}
            createLabel="Create Stream"
            loading={loading}
            emptyLabel="No delivery streams"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="delivery stream"
              icon={Flame}
              iconColor="#f97316"
              title={selected.DeliveryStreamName}
              subtitle={selected.DeliveryStreamType}
              rows={[
                {
                  key: 'Status',
                  value: selected.DeliveryStreamStatus,
                  color: statusColor(selected.DeliveryStreamStatus),
                },
                { key: 'Type', value: selected.DeliveryStreamType, color: 'rgb(var(--text-2))' },
                { key: 'Version', value: selected.VersionId },
                { key: 'Destinations', value: String(selected.Destinations?.length ?? 0) },
                {
                  key: 'Created',
                  value: selected.CreateTimestamp
                    ? new Date(selected.CreateTimestamp).toLocaleDateString()
                    : '—',
                  color: 'rgb(var(--text-2))',
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selected ? (
          <FirehoseStreamDetail
            key={selected.DeliveryStreamName}
            stream={selected}
            onRefresh={loadStreams}
            onDeleted={() => {
              setSelectedName(null)
              loadStreams()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Flame}
              title={loading ? 'Loading streams…' : 'Select a stream'}
              hint={
                streams.length === 0 && !loading
                  ? 'Create a delivery stream to get started.'
                  : 'Pick a stream from the rail to inspect its destinations.'
              }
              action={
                streams.length === 0 && !loading ? (
                  <button onClick={() => setShowCreate(true)} className="btn-primary">
                    Create Stream
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreate && (
        <CreateFirehoseStreamModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadStreams()
          }}
        />
      )}
    </>
  )
}
