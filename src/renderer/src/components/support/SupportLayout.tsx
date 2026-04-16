import { useState, useCallback, useEffect } from 'react'
import { LifeBuoy, Plus } from 'lucide-react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, SupportCase } from '../../types'
import SupportSidebar from './SupportSidebar'
import CaseDetail from './CaseDetail'
import TrustedAdvisorPanel from './TrustedAdvisorPanel'
import CreateCaseModal from './CreateCaseModal'

type SidebarMode = 'cases' | 'advisor'

interface Props {
  settings: AppSettings
}

export default function SupportLayout({ settings: _settings }: Props) {
  const [cases, setCases] = useState<SupportCase[]>([])
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('cases')
  const [includeResolved, setIncludeResolved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadCases = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.supportDescribeCases(includeResolved)
    if (res.success && res.data) {
      setCases(res.data)
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load cases')
    }
    setLoading(false)
  }, [includeResolved, showToast])

  useEffect(() => { loadCases() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (sidebarMode === 'cases') loadCases() }, [includeResolved]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeChange = (mode: SidebarMode) => {
    setSidebarMode(mode)
    if (mode !== 'cases') setSelectedCase(null)
  }

  const handleResolved = () => {
    setSelectedCase((prev) =>
      prev ? { ...prev, status: 'resolved' } : null
    )
    loadCases()
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <SupportSidebar
            cases={cases}
            selectedCase={selectedCase}
            mode={sidebarMode}
            includeResolved={includeResolved}
            onSelectCase={setSelectedCase}
            onModeChange={handleModeChange}
            onToggleResolved={() => setIncludeResolved((v) => !v)}
            onCreateCase={() => setShowCreate(true)}
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
          {sidebarMode === 'advisor' ? (
            <TrustedAdvisorPanel />
          ) : selectedCase ? (
            <CaseDetail
              key={selectedCase.caseId}
              supportCase={selectedCase}
              onResolved={handleResolved}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <LifeBuoy size={40} className="text-sky-500 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No case selected</p>
                <p className="text-xs text-3">
                  {loading
                    ? 'Loading cases…'
                    : cases.length === 0
                    ? 'Create a support case to get started'
                    : 'Select a case from the sidebar'}
                </p>
              </div>
              {!loading && cases.length === 0 && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors"
                >
                  <Plus size={14} /> Create Case
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateCaseModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadCases() }}
        />
      )}
    </div>
  )
}
