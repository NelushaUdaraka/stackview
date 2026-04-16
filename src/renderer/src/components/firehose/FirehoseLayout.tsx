import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { Flame, Plus } from 'lucide-react'
import type { AppSettings, FirehoseDeliveryStream } from '../../types'
import FirehoseSidebar from './FirehoseSidebar'
import FirehoseStreamDetail from './FirehoseStreamDetail'
import CreateFirehoseStreamModal from './CreateFirehoseStreamModal'

interface Props {
  settings: AppSettings
}

export default function FirehoseLayout({
  settings,
}: Props) {
  const [streams, setStreams] = useState<FirehoseDeliveryStream[]>([])
  const [selectedStreamName, setSelectedStreamName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })

  const loadStreams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.firehoseListDeliveryStreams()
      if (res.success && res.data) {
        // Fetch descriptions in parallel
        const fullStreams = await Promise.all(
          res.data.map(async (name) => {
            const desc = await window.electronAPI.firehoseDescribeDeliveryStream(name)
            return desc.data as FirehoseDeliveryStream
          })
        )
        const validStreams = fullStreams.filter(Boolean) as FirehoseDeliveryStream[]
        setStreams(validStreams)

        // Select first if none selected, or keep selection
        if (!selectedStreamName) {
          if (validStreams.length > 0) setSelectedStreamName(validStreams[0].DeliveryStreamName)
        } else {
          const stillExists = validStreams.find(s => s.DeliveryStreamName === selectedStreamName)
          if (!stillExists) setSelectedStreamName(null)
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [selectedStreamName])

  useEffect(() => {
    loadStreams()
  }, [])

  const selectedStream = streams.find(s => s.DeliveryStreamName === selectedStreamName) || null

  return (
    <div className="flex flex-col h-full bg-app text-1">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10 transition-[width]">
          <FirehoseSidebar
            streams={streams}
            loading={loading}
            selectedStreamName={selectedStreamName}
            onSelectStream={setSelectedStreamName}
            onCreateStream={() => setShowCreate(true)}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20 transition-colors"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col bg-app">
          {selectedStream ? (
            <FirehoseStreamDetail
              stream={selectedStream}
              onRefresh={loadStreams}
              onDeleted={() => {
                setSelectedStreamName(null)
                loadStreams()
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 relative animate-in fade-in duration-500">
              <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <svg
                  width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-orange-500 opacity-50"
                >
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No stream selected</p>
                <p className="text-xs text-3 max-w-sm">
                  {loading ? 'Loading streams...' : streams.length === 0 ? 'Create a delivery stream to get started' : 'Select a stream from the sidebar'}
                </p>
              </div>
              {!loading && streams.length === 0 && (
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors">
                  <Plus size={14} /> Create Stream
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateFirehoseStreamModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadStreams()
          }}
        />
      )}
    </div>
  )
}
