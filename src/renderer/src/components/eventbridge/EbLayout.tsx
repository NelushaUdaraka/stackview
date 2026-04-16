import { useState, useEffect, useCallback } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { Plus, X, AlertTriangle, Loader2 } from 'lucide-react'
import type { AppSettings, EbBus } from '../../types'
import EbSidebar from './EbSidebar'
import BusDetail from './BusDetail'

interface EbLayoutProps {
  settings: AppSettings
}

export default function EbLayout({
  settings,
}: EbLayoutProps) {
  const [buses, setBuses] = useState<EbBus[]>([])
  const [selectedBus, setSelectedBus] = useState<EbBus | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 240, max: 520 })

  const loadBuses = useCallback(async () => {
    setRefreshing(true)
    const result = await window.electronAPI.ebListBuses()
    if (result.success && result.data) {
      setBuses(result.data)
      if (result.data.length > 0 && !selectedBus) {
        const defaultBus = result.data.find(b => b.name === 'default')
        setSelectedBus(defaultBus || result.data[0])
      } else if (selectedBus) {
        const stillExists = result.data.find(b => b.name === selectedBus.name)
        if (!stillExists) setSelectedBus(null)
      }
    }
    setRefreshing(false)
  }, [selectedBus])

  useEffect(() => {
    loadBuses()
  }, [])

  const handleCreateBus = async (name: string) => {
    const res = await window.electronAPI.ebCreateBus(name)
    if (res.success) {
      setShowCreateModal(false)
      await loadBuses()
      // Select the newly created bus
      const result = await window.electronAPI.ebListBuses()
      if (result.success && result.data) {
        const newBus = result.data.find(b => b.name === name)
        if (newBus) setSelectedBus(newBus)
      }
    }
    return res
  }

  return (
    <div className="flex flex-col h-full bg-app text-1">
      <div className="flex flex-1 overflow-hidden relative">
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <EbSidebar
            buses={buses}
            selectedBus={selectedBus}
            onSelectBus={setSelectedBus}
            onCreateBus={() => setShowCreateModal(true)}
            loading={refreshing}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        <main className="flex-1 overflow-hidden bg-app">
          {selectedBus ? (
             <BusDetail
               key={selectedBus.arn}
               bus={selectedBus}
               onRefresh={loadBuses}
               onDeleted={() => { setSelectedBus(null); loadBuses() }}
             />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
                <WorkflowIcon size={32} className="text-4" />
              </div>
              <h3 className="text-base font-semibold text-2 mb-2">Select an Event Bus</h3>
              <p className="text-sm text-3 max-w-xs leading-relaxed mb-6">
                Choose a bus from the sidebar to view its rules, schedules, and send test events.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
              >
                <Plus size={15} />
                Create Event Bus
              </button>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateBusModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreateBus}
        />
      )}
    </div>
  )
}

function CreateBusModal({
  onClose,
  onCreated
}: {
  onClose: () => void
  onCreated: (name: string) => Promise<any>
}) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const nameError = name && !name.match(/^[a-zA-Z0-9_.-]+$/)
    ? 'Name can only contain letters, numbers, hyphens, dots, and underscores.'
    : ''

  const canSubmit = name.trim().length > 0 && !nameError

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const res = await onCreated(name.trim())
    setSubmitting(false)
    if (!res.success) {
      setError(res.error ?? 'Failed to create event bus')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgb(192 38 211 / 0.15)' }}>
              <Plus size={16} style={{ color: 'rgb(192 38 211)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Event Bus</h2>
              <p className="text-[10px] text-3">Custom EventBridge event bus</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Bus Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-custom-event-bus"
              className="input-base w-full text-sm font-mono"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleSubmit() }}
            />
            {nameError ? (
              <p className="text-[11px] text-red-500 mt-1">{nameError}</p>
            ) : (
              <p className="text-[10px] text-3 mt-1">Alphanumeric characters, hyphens, dots, and underscores only.</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Create Bus
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkflowIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>
    </svg>
  )
}
