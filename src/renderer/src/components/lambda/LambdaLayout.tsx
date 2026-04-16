import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { Plus } from 'lucide-react'
import type { AppSettings, LambdaFunction } from '../../types'
import LambdaSidebar from './LambdaSidebar'
import LambdaFunctionDetail from './LambdaFunctionDetail'
import CreateLambdaFunctionModal from './CreateLambdaFunctionModal'

interface Props {
  settings: AppSettings
}

export default function LambdaLayout({
  settings,
}: Props) {
  const [functions, setFunctions] = useState<LambdaFunction[]>([])
  const [selectedFunctionName, setSelectedFunctionName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })

  const loadFunctions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.lambdaListFunctions()
      if (res.success && res.data) {
        const validFunctions = res.data as LambdaFunction[]
        setFunctions(validFunctions)

        if (!selectedFunctionName) {
          if (validFunctions.length > 0) setSelectedFunctionName(validFunctions[0].FunctionName)
        } else {
          const stillExists = validFunctions.find(f => f.FunctionName === selectedFunctionName)
          if (!stillExists) setSelectedFunctionName(null)
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [selectedFunctionName])

  useEffect(() => {
    loadFunctions()
  }, [])

  const selectedFunction = functions.find(f => f.FunctionName === selectedFunctionName) || null

  return (
    <div className="flex flex-col h-full bg-app text-1">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10 transition-[width]">
          <LambdaSidebar
            functions={functions}
            loading={loading}
            selectedFunctionName={selectedFunctionName}
            onSelectFunction={setSelectedFunctionName}
            onCreateFunction={() => setShowCreate(true)}
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
          {selectedFunction ? (
            <LambdaFunctionDetail
              lambda={selectedFunction}
              onRefresh={loadFunctions}
              onDeleted={() => {
                setSelectedFunctionName(null)
                loadFunctions()
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 relative animate-in fade-in duration-500">
              <div className="p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <svg
                  width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-violet-500 opacity-50"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <polyline points="11 3 11 11 14 8 17 11 17 3"></polyline>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No function selected</p>
                <p className="text-xs text-3 max-w-sm">
                  {loading ? 'Loading functions...' : functions.length === 0 ? 'Deploy a serverless function to get started' : 'Select a function from the sidebar'}
                </p>
              </div>
              {!loading && functions.length === 0 && (
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors">
                  <Plus size={14} /> Create Function
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateLambdaFunctionModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadFunctions()
          }}
        />
      )}
    </div>
  )
}
