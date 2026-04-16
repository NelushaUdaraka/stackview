import { useState } from 'react'
import { Search, Plus, Layers, ChevronRight, MessageSquare } from 'lucide-react'
import type { QueueInfo } from '../../types'

interface Props {
  queues: QueueInfo[]
  selectedQueue: QueueInfo | null
  onSelectQueue: (queue: QueueInfo) => void
  onCreateQueue: () => void
  loading: boolean
}

export default function Sidebar({
  queues,
  selectedQueue,
  onSelectQueue,
  onCreateQueue,
  loading
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = queues.filter((q) =>
    q.name.toLowerCase().includes(search.toLowerCase())
  )
  const fifoQueues = filtered.filter((q) => q.name.endsWith('.fifo'))
  const standardQueues = filtered.filter((q) => !q.name.endsWith('.fifo'))

  return (
    <div
      className="w-full flex flex-col border-r border-theme h-full"
      style={{ backgroundColor: 'rgb(var(--bg-base))' }}
    >
      {/* Header */}
      <div className="px-3 py-3 border-b border-theme shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-3 uppercase tracking-wider">Queues</span>
          <span className="badge-gray">{queues.length}</span>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4" />
          <input
            type="text"
            placeholder="Search queues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sidebar-search pl-8"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <div className="inline-block w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-2" />
            <p className="text-xs text-3">Loading queues...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Layers size={24} className="text-4 mx-auto mb-2" />
            <p className="text-xs text-3">
              {search ? 'No matching queues' : 'No queues found'}
            </p>
          </div>
        ) : (
          <>
            {standardQueues.length > 0 && (
              <QueueGroup
                label="Standard"
                queues={standardQueues}
                selectedQueue={selectedQueue}
                onSelectQueue={onSelectQueue}
              />
            )}
            {fifoQueues.length > 0 && (
              <QueueGroup
                label="FIFO"
                queues={fifoQueues}
                selectedQueue={selectedQueue}
                onSelectQueue={onSelectQueue}
              />
            )}
          </>
        )}
      </div>

      {/* New queue */}
      <div className="p-3 border-t border-theme shrink-0">
        <button
          onClick={onCreateQueue}
          className="w-full flex items-center justify-center gap-2 px-3 py-2
            bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30
            text-brand-600 dark:text-brand-300 text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={14} />
          New Queue
        </button>
      </div>
    </div>
  )
}

function QueueGroup({
  label,
  queues,
  selectedQueue,
  onSelectQueue
}: {
  label: string
  queues: QueueInfo[]
  selectedQueue: QueueInfo | null
  onSelectQueue: (q: QueueInfo) => void
}) {
  return (
    <div className="mb-1">
      <div className="px-3 py-1">
        <span className="text-[10px] font-bold text-4 uppercase tracking-widest">{label}</span>
      </div>
      {queues.map((queue) => {
        const isSelected = selectedQueue?.url === queue.url
        const msgCount = queue.attributes?.ApproximateNumberOfMessages
        return (
          <button
            key={queue.url}
            onClick={() => onSelectQueue(queue)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors group
              border-r-2
              ${isSelected
                ? 'bg-brand-500/10 border-brand-500'
                : 'border-transparent hover:bg-raised'
              }`}
          >
            <MessageSquare
              size={13}
              className={`shrink-0 ${
                isSelected ? 'text-brand-500' : 'text-4 group-hover:text-3'
              }`}
            />
            <span
              className={`flex-1 text-xs truncate ${
                isSelected ? 'text-1 font-medium' : 'text-2 group-hover:text-1'
              }`}
            >
              {queue.name}
            </span>
            {msgCount && msgCount !== '0' && (
              <span className="badge badge-blue text-[10px] shrink-0">
                {parseInt(msgCount).toLocaleString()}
              </span>
            )}
            <ChevronRight
              size={11}
              className={`shrink-0 transition-opacity ${
                isSelected ? 'text-brand-500 opacity-100' : 'text-4 opacity-0 group-hover:opacity-100'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
