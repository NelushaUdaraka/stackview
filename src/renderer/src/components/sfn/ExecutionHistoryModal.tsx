import { useState, useEffect } from 'react'
import { X, List, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import type { SfnHistoryEvent } from '../../types'

interface Props {
  executionArn: string
  executionName: string
  onClose: () => void
}

function eventTypeColor(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('entered') || t.includes('started') || t.includes('scheduled')) return 'text-lime-500'
  if (t.includes('succeeded') || t.includes('exited')) return 'text-emerald-500'
  if (t.includes('failed') || t.includes('timed_out') || t.includes('timedout')) return 'text-red-500'
  if (t.includes('aborted') || t.includes('stopped')) return 'text-amber-500'
  if (t.includes('activity')) return 'text-blue-500'
  if (t.includes('lambda') || t.includes('task')) return 'text-violet-500'
  if (t.includes('wait')) return 'text-sky-500'
  if (t.includes('choice') || t.includes('parallel') || t.includes('map')) return 'text-fuchsia-500'
  return 'text-3'
}

function EventRow({ event }: { event: SfnHistoryEvent }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = !!event.details && event.details !== '{}'

  return (
    <div className="border-b border-theme last:border-0">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors
          ${hasDetails ? 'hover:bg-raised cursor-pointer' : 'cursor-default'}`}
      >
        <span className="text-[10px] font-mono text-4 mt-0.5 w-6 shrink-0 text-right">
          {event.id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${eventTypeColor(event.type)}`}>
              {event.type}
            </span>
            {event.timestamp && (
              <span className="text-[9px] text-4 font-mono">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            )}
            {event.previousEventId !== undefined && event.previousEventId > 0 && (
              <span className="text-[9px] text-4">← #{event.previousEventId}</span>
            )}
          </div>
        </div>
        {hasDetails && (
          <span className="text-4 shrink-0 mt-0.5">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
      </button>
      {expanded && hasDetails && (
        <div className="px-4 pb-3">
          <pre className="text-[10px] font-mono text-2 bg-app rounded-lg border border-theme p-3 overflow-x-auto whitespace-pre-wrap break-all">
            {event.details}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function ExecutionHistoryModal({ executionArn, executionName, onClose }: Props) {
  const [events, setEvents] = useState<SfnHistoryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await window.electronAPI.sfnGetExecutionHistory(executionArn)
      if (res.success && res.data) {
        setEvents(res.data)
      } else {
        setError(res.error || 'Failed to load history')
      }
      setLoading(false)
    }
    load()
  }, [executionArn])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-theme shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'rgb(var(--bg-base))', maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-lime-500/15">
              <List size={16} className="text-lime-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Execution History</h2>
              <p className="text-[10px] text-3 font-mono truncate max-w-[320px]">{executionName}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-3" />
            </div>
          ) : error ? (
            <div className="p-5 text-xs text-red-500">{error}</div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <List size={22} className="text-4 mb-2 opacity-20" />
              <p className="text-xs text-3 font-medium">No events found</p>
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
                <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
                  {events.length} event{events.length !== 1 ? 's' : ''} · click to expand details
                </span>
              </div>
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
