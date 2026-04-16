import { useState, useCallback, useEffect } from 'react'
import { Share2, Plus } from 'lucide-react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, SfnStateMachine } from '../../types'
import SfnSidebar from './SfnSidebar'
import StateMachineDetail from './StateMachineDetail'
import CreateStateMachineModal from './CreateStateMachineModal'

interface Props {
  settings: AppSettings
}

export default function SfnLayout({ settings: _settings }: Props) {
  const [stateMachines, setStateMachines] = useState<SfnStateMachine[]>([])
  const [selectedMachine, setSelectedMachine] = useState<SfnStateMachine | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadStateMachines = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.sfnListStateMachines()
    if (res.success && res.data) {
      setStateMachines(res.data)
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load state machines')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => { loadStateMachines() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMachineDeleted = () => {
    setSelectedMachine(null)
    loadStateMachines()
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <SfnSidebar
            stateMachines={stateMachines}
            selectedMachine={selectedMachine}
            onSelectMachine={setSelectedMachine}
            onCreateMachine={() => setShowCreate(true)}
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
          {selectedMachine ? (
            <StateMachineDetail
              key={selectedMachine.stateMachineArn}
              machine={selectedMachine}
              onDeleted={handleMachineDeleted}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-5 rounded-2xl bg-lime-500/10 border border-lime-500/20">
                <Share2 size={40} className="text-lime-500 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No state machine selected</p>
                <p className="text-xs text-3">
                  {loading
                    ? 'Loading state machines…'
                    : stateMachines.length === 0
                    ? 'Create a state machine to get started'
                    : 'Select a state machine from the sidebar'}
                </p>
              </div>
              {!loading && stateMachines.length === 0 && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-lime-600 hover:bg-lime-500 text-white rounded-xl transition-colors"
                >
                  <Plus size={14} /> Create State Machine
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateStateMachineModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadStateMachines() }}
        />
      )}
    </div>
  )
}
