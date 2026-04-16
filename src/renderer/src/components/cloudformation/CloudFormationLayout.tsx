import { useState, useEffect, useRef } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { LayoutTemplate, Plus, ArrowUpRight } from 'lucide-react'
import type { AppSettings } from '../../types'
import CloudFormationSidebar from './CloudFormationSidebar'
import StackDetail from './StackDetail'
import CreateStackModal from './CreateStackModal'
import CloudFormationExportsView from './CloudFormationExportsView'

type MainView = 'stacks' | 'exports'

interface Props {
  settings: AppSettings
}

export default function CloudFormationLayout({
  settings,
}: Props) {
  const [mainView, setMainView] = useState<MainView>('stacks')
  const [stacks, setStacks] = useState<any[]>([])
  const [selectedStack, setSelectedStack] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const statusFilterRef = useRef<string[]>([])
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 200, max: 500 })

  useEffect(() => { statusFilterRef.current = statusFilter }, [statusFilter])

  const loadStacks = async (filter?: string[]) => {
    setLoading(true)
    try {
      const result = await window.electronAPI.cfnListStacks(filter ?? statusFilterRef.current)
      if (result.success && result.data) setStacks(result.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStacks() }, [])

  // Auto-poll every 5 seconds while any stack is IN_PROGRESS
  useEffect(() => {
    const hasInProgress = stacks.some(s =>
      typeof s.StackStatus === 'string' && s.StackStatus.includes('IN_PROGRESS')
    )
    if (!hasInProgress) return
    const timer = setInterval(async () => {
      const result = await window.electronAPI.cfnListStacks(statusFilterRef.current)
      if (result.success && result.data) setStacks(result.data)
    }, 5000)
    return () => clearInterval(timer)
  }, [stacks])

  const handleFilterChange = (filter: string[]) => {
    setStatusFilter(filter)
    loadStacks(filter)
  }

  const handleStackCreated = async () => {
    setShowCreateModal(false)
    await loadStacks()
  }

  const handleStackDeleted = async () => {
    setSelectedStack(null)
    await loadStacks()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Nav tabs: Stacks | Exports */}
      <div className="flex items-center gap-0 shrink-0 border-b border-theme px-4" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <button
          onClick={() => setMainView('stacks')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
            ${mainView === 'stacks' ? 'border-orange-500 text-orange-600 dark:text-orange-300' : 'border-transparent text-3 hover:text-1'}`}
        >
          <LayoutTemplate size={13} /> Stacks
        </button>
        <button
          onClick={() => setMainView('exports')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
            ${mainView === 'exports' ? 'border-orange-500 text-orange-600 dark:text-orange-300' : 'border-transparent text-3 hover:text-1'}`}
        >
          <ArrowUpRight size={13} /> Exports
        </button>
      </div>

      {mainView === 'exports' ? (
        <div className="flex-1 overflow-hidden">
          <CloudFormationExportsView />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex shrink-0" style={{ width: sidebarWidth }}>
            <CloudFormationSidebar
              stacks={stacks}
              selectedStack={selectedStack}
              onSelectStack={setSelectedStack}
              onCreateStack={() => setShowCreateModal(true)}
              onFilterChange={handleFilterChange}
              statusFilter={statusFilter}
              loading={loading}
            />
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className="w-1 shrink-0 cursor-col-resize relative select-none"
            style={{ backgroundColor: 'rgb(var(--border))' }}
            title="Drag to resize"
          />

          <main className="flex-1 overflow-hidden bg-app">
            {selectedStack ? (
              <StackDetail
                key={selectedStack}
                stackName={selectedStack}
                onDeleted={handleStackDeleted}
                onUpdated={loadStacks}
              />
            ) : (
              <CfnEmptyState onCreateStack={() => setShowCreateModal(true)} />
            )}
          </main>
        </div>
      )}

      {showCreateModal && (
        <CreateStackModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleStackCreated}
        />
      )}
    </div>
  )
}

function CfnEmptyState({ onCreateStack }: { onCreateStack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div
        className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
      >
        <LayoutTemplate size={32} className="text-4" />
      </div>
      <h3 className="text-base font-semibold text-2 mb-2">Select a stack to get started</h3>
      <p className="text-sm text-3 mb-6 max-w-xs leading-relaxed">
        Choose a stack from the sidebar to view its resources, events, and template.
      </p>
      <button
        onClick={onCreateStack}
        className="btn-primary gap-2 text-white"
        style={{ backgroundColor: 'rgb(249 115 22)' }}
      >
        <Plus size={15} />
        Create New Stack
      </button>
    </div>
  )
}
