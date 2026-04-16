import { useState, useCallback, useEffect } from 'react'
import { GitBranch, Plus } from 'lucide-react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, SwfDomain } from '../../types'
import SwfSidebar from './SwfSidebar'
import DomainDetail from './DomainDetail'
import RegisterDomainModal from './RegisterDomainModal'

interface Props {
  settings: AppSettings
}

export default function SwfLayout({ settings: _settings }: Props) {
  const [domains, setDomains] = useState<SwfDomain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<SwfDomain | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 200, max: 480 })
  const { showToast } = useToastContext()

  const loadDomains = useCallback(async () => {
    setLoading(true)
    const [regRes, depRes] = await Promise.all([
      window.electronAPI.swfListDomains('REGISTERED'),
      window.electronAPI.swfListDomains('DEPRECATED'),
    ])
    const all: SwfDomain[] = [
      ...(regRes.success && regRes.data ? regRes.data : []),
      ...(depRes.success && depRes.data ? depRes.data : []),
    ]
    setDomains(all)
    if (!regRes.success && !depRes.success) {
      showToast('error', regRes.error || 'Failed to load domains')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => { loadDomains() }, [])

  const handleDomainDeprecated = useCallback(() => {
    loadDomains()
    setSelectedDomain((prev) =>
      prev ? { ...prev, status: 'DEPRECATED' } : null
    )
  }, [loadDomains])

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <SwfSidebar
            domains={domains}
            selectedDomain={selectedDomain}
            onSelectDomain={setSelectedDomain}
            onRegisterDomain={() => setShowRegister(true)}
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
          {selectedDomain ? (
            <DomainDetail
              key={selectedDomain.name}
              domain={selectedDomain}
              onDeprecated={handleDomainDeprecated}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/20">
                <GitBranch size={40} className="text-green-500 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No domain selected</p>
                <p className="text-xs text-3">
                  {loading
                    ? 'Loading domains…'
                    : domains.length === 0
                    ? 'Register a domain to get started'
                    : 'Select a domain from the sidebar'}
                </p>
              </div>
              {!loading && domains.length === 0 && (
                <button
                  onClick={() => setShowRegister(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
                >
                  <Plus size={14} /> Register Domain
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showRegister && (
        <RegisterDomainModal
          onClose={() => setShowRegister(false)}
          onCreated={() => {
            setShowRegister(false)
            loadDomains()
          }}
        />
      )}
    </div>
  )
}
