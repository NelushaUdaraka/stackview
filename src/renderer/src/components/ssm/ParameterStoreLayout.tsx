import { useState, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { SlidersHorizontal, Plus } from 'lucide-react'
import type { AppSettings, SsmParameter } from '../../types'
import ParameterStoreSidebar from './ParameterStoreSidebar'
import ParameterDetail from './ParameterDetail'
import CreateParameterModal from './CreateParameterModal'

interface Props {
  settings: AppSettings
}

export default function ParameterStoreLayout({
  settings,
}: Props) {
  const [parameters, setParameters] = useState<SsmParameter[]>([])
  const [selectedParam, setSelectedParam] = useState<SsmParameter | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 180, max: 480 })

  const loadParams = async () => {
    setLoading(true)
    const res = await window.electronAPI.ssmListParameters()
    if (res.success && res.data) {
      // Sort alphabetically by name
      const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name))
      setParameters(sorted)
      // If a parameter is currently selected, update its reference to the fresh object
      if (selectedParam) {
        const fresh = sorted.find(p => p.name === selectedParam.name)
        if (fresh) setSelectedParam(fresh)
        else setSelectedParam(null)
      }
    }
    setLoading(false)
  }

  useEffect(() => { loadParams() }, [])

  const handleRefresh = async () => {
    await loadParams()
  }

  const handleCreated = async (name: string) => {
    setShowCreateModal(false)
    await loadParams()
    const found = parameters.find(p => p.name === name) || { name, type: 'String' } // fallback if re-fetch race
    setSelectedParam(found as SsmParameter)
  }

  const handleDeleted = async () => {
    setSelectedParam(null)
    await loadParams()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="flex shrink-0 z-10" style={{ width: sidebarWidth }}>
          <ParameterStoreSidebar
            parameters={parameters}
            selectedParam={selectedParam}
            onSelectParam={setSelectedParam}
            onCreateParam={() => setShowCreateModal(true)}
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
          {selectedParam ? (
            <ParameterDetail
              key={selectedParam.name}
              param={selectedParam}
              onDeleted={handleDeleted}
              onUpdated={handleRefresh}
            />
          ) : (
            <ParametersEmptyState onCreate={() => setShowCreateModal(true)} />
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateParameterModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
          showToast={(type, text) => console.log(type, text) /* layout level toast or let modal handle its own */}
        />
      )}
    </div>
  )
}

function ParametersEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
        <SlidersHorizontal size={32} className="text-4" />
      </div>
      <h3 className="text-base font-semibold text-2 mb-2">Select a parameter to view</h3>
      <p className="text-sm text-3 mb-6 max-w-xs leading-relaxed">
        Choose a parameter from the sidebar to view its value, history, and metadata.
      </p>
      <button
        onClick={onCreate}
        className="btn-primary gap-2"
        style={{ backgroundColor: 'rgb(13 148 136)' }} // teal-600
      >
        <Plus size={15} />
        Create Parameter
      </button>
    </div>
  )
}
