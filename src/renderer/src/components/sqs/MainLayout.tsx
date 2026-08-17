import { useState, useCallback, useEffect } from 'react'
import { Layers, MessageSquare } from 'lucide-react'
import type { AppSettings, QueueInfo } from '../../types'
import QueueDetail from './QueueDetail'
import CreateQueueModal from './CreateQueueModal'
import {
  ServiceShell, ResourceRail, Inspector, InspectorSection, MeterRow, EmptyState,
  type RailItem,
} from '../common/ui'

interface Props {
  settings: AppSettings
  queues: QueueInfo[]
  selectedQueue: QueueInfo | null
  onSelectQueue: (q: QueueInfo | null) => void
  onQueuesChanged: () => void
}

export default function MainLayout({
  queues,
  selectedQueue,
  onSelectQueue,
  onQueuesChanged,
}: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [attributes, setAttributes] = useState<Record<string, string>>({})
  const [loadingAttrs, setLoadingAttrs] = useState(false)

  // The queue list lives in App state (it is shared with the region handlers),
  // and nothing populates it on connect — so pull it once on mount, the way
  // every other service loads its own resources.
  useEffect(() => {
    onQueuesChanged()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Attributes live here rather than in the detail view because the inspector
   * renders beside it, not inside it — both need the same snapshot.
   */
  const loadAttributes = useCallback(async () => {
    if (!selectedQueue) return
    setLoadingAttrs(true)
    try {
      const result = await window.electronAPI.getQueueAttributes(selectedQueue.url)
      setAttributes(result.success && result.data ? result.data : {})
    } finally {
      setLoadingAttrs(false)
    }
  }, [selectedQueue])

  useEffect(() => {
    setAttributes({})
    loadAttributes()
  }, [loadAttributes])

  const railItems: RailItem[] = queues.map(q => {
    const isFifo = q.name.endsWith('.fifo')
    const count = q.attributes?.ApproximateNumberOfMessages
    return {
      id: q.url,
      name: q.name,
      icon: MessageSquare,
      state: count && count !== '0' ? 'ok' : 'idle',
      sub: isFifo ? 'FIFO' : 'STANDARD',
      meta: count && count !== '0' ? `${parseInt(count).toLocaleString()} msg` : undefined,
    }
  })

  const available = parseInt(attributes.ApproximateNumberOfMessages ?? '0')
  const inFlight = parseInt(attributes.ApproximateNumberOfMessagesNotVisible ?? '0')
  const delayed = parseInt(attributes.ApproximateNumberOfMessagesDelayed ?? '0')
  const total = Math.max(1, available + inFlight + delayed)

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="QUEUES"
            items={railItems}
            selectedId={selectedQueue?.url ?? null}
            onSelect={item => onSelectQueue(queues.find(q => q.url === item.id) ?? null)}
            icon={Layers}
            searchPlaceholder="Search queues..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="New Queue"
            emptyLabel="No queues yet"
          />
        }
        inspector={
          selectedQueue ? (
            <Inspector
              kind={selectedQueue.name.endsWith('.fifo') ? 'fifo queue' : 'queue'}
              icon={MessageSquare}
              iconColor="#0ea5e9"
              title={selectedQueue.name}
              subtitle={selectedQueue.name.endsWith('.fifo') ? 'FIFO queue' : 'Standard queue'}
              rows={[
                { key: 'Available', value: available.toLocaleString(), color: 'rgb(var(--ok))' },
                { key: 'In flight', value: inFlight.toLocaleString(), color: 'rgb(var(--accent))' },
                { key: 'Delayed', value: delayed.toLocaleString(), color: 'rgb(var(--text-2))' },
                { key: 'Visibility', value: `${attributes.VisibilityTimeout ?? '30'}s` },
                { key: 'Long poll', value: `${attributes.ReceiveMessageWaitTimeSeconds ?? '0'}s` },
                { key: 'Delivery delay', value: `${attributes.DelaySeconds ?? '0'}s` },
                {
                  key: 'Retention',
                  value: `${(parseInt(attributes.MessageRetentionPeriod ?? '345600') / 86400).toFixed(1)}d`,
                },
              ]}
            >
              <InspectorSection title="MESSAGE BREAKDOWN">
                <MeterRow label="Available" value={available.toLocaleString()} fraction={available / total} />
                <MeterRow label="In flight" value={inFlight.toLocaleString()} fraction={inFlight / total} />
                <MeterRow label="Delayed" value={delayed.toLocaleString()} fraction={delayed / total} />
              </InspectorSection>
            </Inspector>
          ) : undefined
        }
      >
        {selectedQueue ? (
          <QueueDetail
            key={selectedQueue.url}
            queue={selectedQueue}
            attributes={attributes}
            loadingAttributes={loadingAttrs}
            onReloadAttributes={loadAttributes}
            onDeleted={async () => {
              await onQueuesChanged()
              onSelectQueue(null)
            }}
            onPurged={loadAttributes}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Layers}
              title="Select a queue"
              hint="Pick a queue from the rail to read its messages and attributes."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  New Queue
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateQueueModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async () => {
            setShowCreateModal(false)
            await onQueuesChanged()
          }}
        />
      )}
    </>
  )
}
