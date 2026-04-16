import { useState, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { MessageSquare, Plus } from 'lucide-react'
import type { AppSettings, SnsTopic } from '../../types'
import SnsSidebar from './SnsSidebar'
import TopicDetail from './TopicDetail'
import CreateTopicModal from './CreateTopicModal'

interface Props {
  settings: AppSettings
}

export default function SnsLayout({
  settings,
}: Props) {
  const [topics, setTopics] = useState<SnsTopic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<SnsTopic | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 200, max: 500 })

  const loadTopics = async () => {
    setLoading(true)
    const res = await window.electronAPI.snsListTopics()
    if (res.success && res.data) {
      const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name))
      setTopics(sorted)
      if (selectedTopic) {
        const fresh = sorted.find(t => t.arn === selectedTopic.arn)
        if (fresh) setSelectedTopic(fresh)
        else setSelectedTopic(null)
      }
    }
    setLoading(false)
  }

  useEffect(() => { loadTopics() }, [])

  const handleCreated = async (arn: string) => {
    setShowCreateModal(false)
    await loadTopics()
    const nameStr = arn.split(':').pop() || arn
    setSelectedTopic({ arn, name: nameStr })
  }

  const handleDeleted = async () => {
    setSelectedTopic(null)
    await loadTopics()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="flex shrink-0 z-10" style={{ width: sidebarWidth }}>
          <SnsSidebar
            topics={topics}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
            onCreateTopic={() => setShowCreateModal(true)}
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
          {selectedTopic ? (
            <TopicDetail
              key={selectedTopic.arn}
              topic={selectedTopic}
              onDeleted={handleDeleted}
              onUpdated={handleRefresh}
            />
          ) : (
            <TopicsEmptyState onCreate={() => setShowCreateModal(true)} />
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateTopicModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
          showToast={(type, text) => console.log(type, text)}
        />
      )}
    </div>
  )
}

function TopicsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
        <MessageSquare size={32} className="text-4" />
      </div>
      <h3 className="text-base font-semibold text-2 mb-2">Select an SNS Topic</h3>
      <p className="text-sm text-3 mb-6 max-w-xs leading-relaxed">
        Choose a topic from the sidebar to publish messages or manage its subscriptions.
      </p>
      <button
        onClick={onCreate}
        className="btn-primary gap-2"
        style={{ backgroundColor: 'rgb(219 39 119)' }} // pink-600
      >
        <Plus size={15} />
        Create Topic
      </button>
    </div>
  )
}
