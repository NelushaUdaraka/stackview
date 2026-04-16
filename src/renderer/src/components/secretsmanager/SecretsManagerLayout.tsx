import { useState, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { Shield, Plus } from 'lucide-react'
import type { AppSettings, SecretInfo } from '../../types'
import SecretsManagerSidebar from './SecretsManagerSidebar'
import SecretDetail from './SecretDetail'
import CreateSecretModal from './CreateSecretModal'

interface Props {
  settings: AppSettings
}

export default function SecretsManagerLayout({
  settings,
}: Props) {
  const [secrets, setSecrets] = useState<SecretInfo[]>([])
  const [selectedSecret, setSelectedSecret] = useState<SecretInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 180, max: 480 })

  const loadSecrets = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.secretsManagerListSecrets()
      if (result.success && result.data) {
        setSecrets(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSecrets()
  }, [])

  const handleSecretCreated = async (name: string) => {
    setShowCreateModal(false)
    await loadSecrets()
    const found = secrets.find((s) => s.name === name)
    if (found) setSelectedSecret(found)
  }

  const handleSecretDeleted = async () => {
    setSelectedSecret(null)
    await loadSecrets()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex shrink-0" style={{ width: sidebarWidth }}>
          <SecretsManagerSidebar
            secrets={secrets}
            selectedSecret={selectedSecret}
            onSelectSecret={setSelectedSecret}
            onCreateSecret={() => setShowCreateModal(true)}
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

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-app">
          {selectedSecret ? (
            <SecretDetail
              key={selectedSecret.name}
              secret={selectedSecret}
              onDeleted={handleSecretDeleted}
            />
          ) : (
            <SecretsEmptyState onCreateSecret={() => setShowCreateModal(true)} />
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateSecretModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleSecretCreated}
        />
      )}
    </div>
  )
}

function SecretsEmptyState({ onCreateSecret }: { onCreateSecret: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div
        className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
      >
        <Shield size={32} className="text-4" />
      </div>
      <h3 className="text-base font-semibold text-2 mb-2">Select a secret to get started</h3>
      <p className="text-sm text-3 mb-6 max-w-xs leading-relaxed">
        Choose a secret from the sidebar to view or manage its value and attributes.
      </p>
      <button
        onClick={onCreateSecret}
        className="btn-primary gap-2"
        style={{ backgroundColor: 'rgb(99 102 241)' }}
      >
        <Plus size={15} />
        Create New Secret
      </button>
    </div>
  )
}
