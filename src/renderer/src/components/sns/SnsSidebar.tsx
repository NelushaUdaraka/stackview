import { useState } from 'react'
import { Search, Plus, MessageSquare, Loader2 } from 'lucide-react'
import type { SnsTopic } from '../../types'

interface Props {
  topics: SnsTopic[]
  selectedTopic: SnsTopic | null
  onSelectTopic: (topic: SnsTopic) => void
  onCreateTopic: () => void
  loading?: boolean
}

export default function SnsSidebar({ topics, selectedTopic, onSelectTopic, onCreateTopic, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = topics.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.arn.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Topics {!loading && topics.length > 0 && `(${topics.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : topics.length === 0 ? (
              <>
                <MessageSquare size={22} className="text-4 mb-2" />
                <p className="text-xs text-3">No topics yet</p>
                <p className="text-[10px] text-4 mt-1">Create one below</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((topic) => {
            const isSelected = selectedTopic?.arn === topic.arn
            return (
              <button
                key={topic.arn}
                onClick={() => onSelectTopic(topic)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-pink-500/10 border-l-pink-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <MessageSquare size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-pink-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug ${isSelected ? 'text-1' : 'text-2'}`}>
                    {topic.name}
                  </p>
                  <p className="text-[9px] text-4 font-mono truncate leading-none mt-1">
                    {topic.arn.substring(0, 32)}...
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateTopic}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors"
        >
          <Plus size={13} />
          New Topic
        </button>
      </div>
    </div>
  )
}
