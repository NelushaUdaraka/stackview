import { useCallback, useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import type { AppSettings, SnsTopic } from '../../types'
import TopicDetail from './TopicDetail'
import CreateTopicModal from './CreateTopicModal'
import { ServiceShell, ResourceRail, Inspector, EmptyState, type RailItem } from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function SnsLayout({ settings }: Props) {
  const [topics, setTopics] = useState<SnsTopic[]>([])
  const [selectedArn, setSelectedArn] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadTopics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.snsListTopics()
      if (res.success && res.data) {
        const sorted = [...res.data].sort((a, b) => a.name.localeCompare(b.name))
        setTopics(sorted)
        setSelectedArn(prev => (prev && sorted.some(t => t.arn === prev) ? prev : null))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  const selected = topics.find(t => t.arn === selectedArn) ?? null

  const railItems: RailItem[] = topics.map(t => ({
    id: t.arn,
    name: t.name,
    icon: MessageSquare,
    state: 'ok',
    sub: t.name.endsWith('.fifo') ? 'FIFO' : 'STANDARD',
    keywords: t.arn,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="TOPICS"
            items={railItems}
            selectedId={selectedArn}
            onSelect={item => setSelectedArn(item.id)}
            icon={MessageSquare}
            searchPlaceholder="Search topics..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="Create Topic"
            loading={loading}
            emptyLabel="No topics yet"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="topic"
              icon={MessageSquare}
              iconColor="#ec4899"
              title={selected.name}
              subtitle={selected.name.endsWith('.fifo') ? 'FIFO topic' : 'Standard topic'}
              sectionTitle="TOPIC"
              rows={[
                {
                  key: 'Type',
                  value: selected.name.endsWith('.fifo') ? 'FIFO' : 'Standard',
                  color: 'rgb(var(--accent))',
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
                { key: 'ARN', value: selected.arn, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selected ? (
          <TopicDetail
            key={selected.arn}
            topic={selected}
            onDeleted={async () => {
              setSelectedArn(null)
              await loadTopics()
            }}
            onUpdated={loadTopics}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Select a topic"
              hint="Pick a topic from the rail to publish messages or manage subscriptions."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Topic
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateTopicModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async (arn: string) => {
            setShowCreateModal(false)
            await loadTopics()
            setSelectedArn(arn)
          }}
        />
      )}
    </>
  )
}
