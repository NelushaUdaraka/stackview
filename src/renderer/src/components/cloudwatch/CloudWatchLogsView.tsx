import { useState, useCallback, useEffect } from 'react'
import { FileText, ChevronRight, Hash, Clock, Trash2, Loader2, AlertCircle, Terminal, Filter, X, Plus, XCircle } from 'lucide-react'
import type { CloudWatchLogGroup, CloudWatchLogStream, CloudWatchLogEvent } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

// ── Create Log Group Modal ──────────────────────────────────────────────────

function CreateLogGroupModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const { showToast } = useToastContext()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    setError('')
    const res = await window.electronAPI.cloudwatchCreateLogGroup(name.trim())
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Log group '${name}' created`)
      onCreated()
    } else {
      setError(res.error || 'Failed to create log group')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 shadow-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden animate-in zoom-in duration-200" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/15">
              <Plus size={16} className="text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Log Group</h2>
              <p className="text-[10px] text-3 uppercase tracking-wider font-bold">CloudWatch Logs</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Log Group Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. /aws/lambda/my-function"
              className="input-base w-full"
              autoFocus
            />
          </div>
          {error && <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-500 flex items-start gap-2"><AlertCircle size={14} className="shrink-0 mt-0.5" />{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-ghost !px-4 !py-2 rounded-xl text-xs font-bold">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !name.trim()} className="btn-primary !px-5 !py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 min-w-[100px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Create Log Stream Modal ─────────────────────────────────────────────────

function CreateLogStreamModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden bg-base p-8 text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-amber-500 opacity-50" />
        <h2 className="text-sm font-bold text-1">Create Log Stream</h2>
        <p className="text-xs text-3 leading-relaxed">Streams are usually created automatically by Log Producers. Manual creation is rarely needed.</p>
        <div className="flex flex-col gap-2 pt-2">
           <button onClick={onClose} className="btn-ghost !py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-widest bg-raised">Close</button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  selectedGroup: CloudWatchLogGroup | null
  loading: boolean
  setLoading: (loading: boolean) => void
  onGroupDeleted: () => void
  showCreateModal: boolean
  onCloseCreateModal: () => void
  onGroupCreated: () => void
}

export default function CloudWatchLogsView({ 
  selectedGroup, 
  loading,
  setLoading, 
  onGroupDeleted, 
  showCreateModal, 
  onCloseCreateModal,
  onGroupCreated
}: Props) {
  const [logStreams, setLogStreams] = useState<CloudWatchLogStream[]>([])
  const [selectedStream, setSelectedStream] = useState<CloudWatchLogStream | null>(null)
  const [events, setEvents] = useState<CloudWatchLogEvent[]>([])
  const [eventFilter, setEventFilter] = useState('')
  const [showCreateStream, setShowCreateStream] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { showToast } = useToastContext()

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    
    setLoading(true)
    try {
      const res = await window.electronAPI.cloudwatchDeleteLogGroup(selectedGroup!.logGroupName!)
      if (res.success) {
        showToast('success', `Log group deleted`)
        onGroupDeleted()
      } else {
        showToast('error', res.error || 'Failed to delete group')
      }
    } finally {
      setLoading(false)
      setConfirmDelete(false)
    }
  }

  const loadLogStreams = useCallback(async (groupName: string) => {
    setLoading(true)
    try {
      const res = await window.electronAPI.cloudwatchListLogStreams(groupName)
      if (res.success && res.data) {
        setLogStreams(res.data)
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  const loadLogEvents = useCallback(async (groupName: string, streamName: string) => {
    setLoading(true)
    try {
      const res = await window.electronAPI.cloudwatchGetLogEvents(groupName, streamName)
      if (res.success && res.data && Array.isArray(res.data.events)) {
        setEvents(res.data.events)
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  useEffect(() => {
    if (selectedGroup?.logGroupName) {
      loadLogStreams(selectedGroup.logGroupName)
      setSelectedStream(null)
      setEvents([])
    }
  }, [selectedGroup, loadLogStreams])

  useEffect(() => {
    if (selectedGroup?.logGroupName && selectedStream?.logStreamName) {
      loadLogEvents(selectedGroup.logGroupName, selectedStream.logStreamName)
    }
  }, [selectedStream, selectedGroup, loadLogEvents])

  const filteredEvents = events.filter(e => 
    e.message?.toLowerCase().includes(eventFilter.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-app h-full">
      {!selectedGroup ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center opacity-70">
          <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"><FileText size={40} className="text-indigo-500" /></div>
          <div>
            <p className="text-sm font-semibold text-1 mb-1">No Log Group Selected</p>
            <p className="text-xs text-3">Select a group from the sidebar to view its contents</p>
          </div>
        </div>
      ) : !selectedStream ? (
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-theme bg-base shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shadow-sm"><FileText size={16} /></div>
                  <h2 className="text-base font-bold text-1 truncate leading-none">{selectedGroup.logGroupName}</h2>
                </div>
                <p className="text-[10px] text-4 font-mono truncate px-0.5">{selectedGroup.arn}</p>
              </div>
              <button
                onClick={handleDelete}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all shrink-0
                  ${confirmDelete
                    ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                    : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'
                  }`}
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {confirmDelete ? 'Confirm Delete' : 'Delete Group'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-cyan-500" />
                <h3 className="text-xs font-bold text-2 uppercase tracking-wider">Log Streams</h3>
              </div>
              <button 
                onClick={() => setShowCreateStream(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors shadow-sm"
              >
                <Plus size={13} /> Create Stream
              </button>
            </div>

            <div className="rounded-2xl border border-theme overflow-x-auto bg-base shadow-sm min-h-0 flex flex-col">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-raised/50 border-b border-theme sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider">Log Stream Name</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider min-w-[180px]">Last Event</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {logStreams.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-20 text-center">
                        <Hash size={32} className="mx-auto mb-2 text-4 opacity-20" />
                        <p className="text-xs text-3 font-medium">No log streams found</p>
                      </td>
                    </tr>
                  ) : (
                    logStreams.map(stream => (
                      <tr 
                        key={stream.logStreamName}
                        onClick={() => setSelectedStream(stream)}
                        className="hover:bg-cyan-500/5 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 shrink-0"><Hash size={13} /></div>
                            <span className="text-xs font-bold text-1 truncate max-w-[500px]">{stream.logStreamName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 min-w-[180px]">
                          <div className="flex items-center gap-2 text-[10px] text-3 font-medium">
                            <Clock size={11} className="shrink-0 text-4" />
                            {stream.lastEventTimestamp ? new Date(stream.lastEventTimestamp).toLocaleString() : 'Never'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right pr-6">
                           <div className="flex items-center justify-end gap-2">
                             <ChevronRight size={14} className="text-4 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-theme bg-base shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <button 
                  onClick={() => setSelectedStream(null)} 
                  className="flex items-center gap-1 text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5 hover:text-cyan-400 transition-all group"
                >
                  <ChevronRight size={10} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" /> Back to Streams
                </button>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500"><Hash size={16} /></div>
                  <h2 className="text-base font-bold text-1 truncate leading-none">{selectedStream.logStreamName}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => setEvents([])}
                  className="btn-ghost !p-1.5 rounded-lg text-4 hover:text-cyan-500 transition-all"
                  title="Clear Console"
                >
                  <XCircle size={14} />
                </button>
                 <div className="relative">
                  <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4" />
                  <input
                    type="text"
                    value={eventFilter}
                    onChange={e => setEventFilter(e.target.value)}
                    placeholder="Filter events..."
                    className="sidebar-search pl-7 w-56 !bg-raised/40"
                  />
                  {eventFilter && <button onClick={() => setEventFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-4 hover:text-1"><X size={12} /></button>}
                </div>
              </div>
            </div>
          </div>

          {/* Console */}
          <div className="flex-1 p-0 overflow-y-auto bg-[#0d1117] font-mono subpixel-antialiased min-h-0 border-t border-theme">
            <div className="min-h-full">
              {filteredEvents.length === 0 ? (
                <div className="py-20 text-center text-[#484f58] bg-[#0d1117]"><Terminal size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No events found in this stream</p></div>
              ) : (
                filteredEvents.map((event, idx) => {
                  const msg = event.message || '';
                  let levelColor = 'text-[#c9d1d9]';
                  if (msg.includes('ERROR') || msg.includes('FAIL')) levelColor = 'text-rose-400 font-bold';
                  else if (msg.includes('WARN')) levelColor = 'text-amber-400 font-bold';
                  else if (msg.includes('INFO')) levelColor = 'text-sky-400';
                  
                  return (
                    <div key={idx} className="flex gap-4 group hover:bg-white/5 px-4 py-1 transition-colors text-[12px] leading-relaxed border-b border-white/[0.03]">
                      <div className="flex shrink-0 select-none gap-2 min-w-[140px] text-[#484f58] font-bold">
                        <span className="opacity-40">{idx + 1}</span>
                        <span className="uppercase tracking-tighter">
                          {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '??:??:??'}
                        </span>
                      </div>
                      <span className={`${levelColor} whitespace-pre-wrap break-all flex-1`}>{msg}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateLogGroupModal
          onClose={onCloseCreateModal}
          onCreated={() => { onGroupCreated(); onCloseCreateModal() }}
        />
      ) }

      {showCreateStream && (
        <CreateLogStreamModal onClose={() => setShowCreateStream(false)} />
      )}
    </div>
  )
}
