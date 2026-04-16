import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import { AlertTriangle, X, Plus, Loader2, Network } from 'lucide-react'
import type { AppSettings, ApigwRestApi } from '../../types'
import ApigwSidebar from './ApigwSidebar'
import ApigwApisList from './ApigwApisList'
import ApigwApiDetail from './ApigwApiDetail'

const MODAL_OVERLAY = { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }

function CreateApiModal({ onClose, onCreated }: any) {
  const { showToast } = useToastContext()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) return
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.apigwCreateRestApi(name.trim(), description.trim() || undefined)
    setSubmitting(false)
    if (res.success) {
      showToast('success', `API created successfully`)
      onCreated()
    } else {
      setError(res.error || 'Failed to create API')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={MODAL_OVERLAY}>
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden bg-base">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-500/15">
              <Network size={16} className="text-violet-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create REST API</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">API name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. MyServiceAPI"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Description (Optional)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Main gateway for v1"
              className="input-base w-full text-sm"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Create API
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  settings: AppSettings
}

export default function ApigwLayout({ settings }: Props) {
  const [activeTab, setActiveTab] = useState<'APIs' | 'CustomDomains' | 'UsagePlans' | 'ApiKeys'>('APIs')
  const [apis, setApis] = useState<ApigwRestApi[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateApi, setShowCreateApi] = useState(false)
  const [selectedApi, setSelectedApi] = useState<ApigwRestApi | null>(null)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadApis = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.apigwListRestApis()
    if (res.success && res.data) setApis(res.data)
    else if (!res.success) showToast('error', res.error || 'Failed to load APIs')
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    if (activeTab === 'APIs') loadApis()
  }, [activeTab])

  const handleDeleteApi = useCallback(async (id: string) => {
    const res = await window.electronAPI.apigwDeleteRestApi(id)
    if (res.success) {
      showToast('success', 'API deleted')
      if (selectedApi?.id === id) setSelectedApi(null)
      loadApis()
    } else {
      showToast('error', res.error || 'Failed to delete API')
    }
  }, [showToast, selectedApi, loadApis])

  return (
    <div className="flex flex-col h-full bg-app text-1">
      <div className="flex flex-1 overflow-hidden relative">
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10 transition-[width]">
          <ApigwSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            counts={{ apis: apis.length }}
          />
        </div>

        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20 transition-colors"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'APIs' && !selectedApi && (
            <ApigwApisList
              apis={apis}
              loading={loading}
              onCreateClick={() => setShowCreateApi(true)}
              onDelete={handleDeleteApi}
              onSelect={api => setSelectedApi(api)}
            />
          )}

          {activeTab === 'APIs' && selectedApi && (
            <ApigwApiDetail
              api={selectedApi}
              onBack={() => { setSelectedApi(null); loadApis() }}
            />
          )}

          {activeTab !== 'APIs' && (
             <div className="flex-1 flex flex-col items-center justify-center text-3 gap-3">
               <span className="text-sm font-medium">This feature is not yet available in the local viewer.</span>
             </div>
          )}
        </main>
      </div>

      {showCreateApi && (
        <CreateApiModal
          onClose={() => setShowCreateApi(false)}
          onCreated={() => { setShowCreateApi(false); loadApis() }}
        />
      )}
    </div>
  )
}
