import { useState, useEffect, useCallback } from 'react'
import { Search, Plus } from 'lucide-react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import OpenSearchSidebar from './OpenSearchSidebar'
import DomainDetail from './DomainDetail'
import CreateDomainModal from './CreateDomainModal'
import type { AppSettings } from '../../types'

interface Props {
  settings: AppSettings
}

interface Toast {
  id: number
  type: 'success' | 'error'
  text: string
}

let toastId = 0

export default function OpenSearchLayout({
  settings,
}: Props) {
  const [domains, setDomains] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 200, max: 480 })

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, type, text }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const loadDomains = useCallback(async () => {
    setRefreshing(true)
    const res = await window.electronAPI.opensearchListDomains(settings.endpoint, settings.region)
    if (res.success && res.data) {
      setDomains(res.data)
    } else {
      showToast('error', res.error ?? 'Failed to list domains')
    }
    setRefreshing(false)
  }, [settings.endpoint, settings.region, showToast])

  useEffect(() => {
    window.electronAPI.opensearchReinit(settings.endpoint, settings.region)
    loadDomains()
  }, [settings.endpoint, settings.region, loadDomains])

  const handleCreated = () => {
    setShowCreateModal(false)
    loadDomains()
  }

  const handleDeleted = () => {
    setSelectedDomain(null)
    loadDomains()
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-app text-1 select-none">
      <div className="flex flex-1 overflow-hidden relative">
        <OpenSearchSidebar
          domains={domains}
          selectedDomain={selectedDomain}
          onSelectDomain={setSelectedDomain}
          onCreateDomain={() => setShowCreateModal(true)}
          refreshing={refreshing}
          sidebarWidth={sidebarWidth}
        />

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20 transition-colors"
          style={{ backgroundColor: 'rgb(var(--border))', left: 0 }}
        />

        <main className="flex-1 overflow-hidden bg-app relative mt-0.5">
          {selectedDomain ? (
            <DomainDetail
              key={selectedDomain}
              domainName={selectedDomain}
              endpoint={settings.endpoint}
              region={settings.region}
              onDeleted={handleDeleted}
              showToast={showToast}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-app animate-in fade-in duration-500">
              <div className="w-20 h-20 rounded-3xl bg-purple-500/5 flex items-center justify-center text-purple-500/20 mb-6 ring-1 ring-purple-500/10 shadow-inner">
                <Search size={40} />
              </div>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-black text-1 tracking-tight">No Domain Selected</h3>
                <p className="text-sm text-3 max-w-xs leading-relaxed">
                  Select an OpenSearch domain from the sidebar to manage indices, search documents, and monitor cluster health.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-purple-500/20 active:scale-95 group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                Create New Domain
              </button>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateDomainModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
          showToast={showToast}
          endpoint={settings.endpoint}
          region={settings.region}
        />
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200 ${
              t.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
