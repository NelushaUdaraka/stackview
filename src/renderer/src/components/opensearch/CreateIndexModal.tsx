import { useState } from 'react'
import { X, Database } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  domainEndpoint: string
  onClose: () => void
  onCreated: () => void
}

const DEFAULT_SETTINGS = `{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}`

export default function CreateIndexModal({ domainEndpoint, onClose, onCreated }: Props) {
  const { showToast } = useToastContext()
  const [indexName, setIndexName] = useState('')
  const [settingsJson, setSettingsJson] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!indexName.trim()) return
    let settings: object | undefined
    try {
      settings = JSON.parse(settingsJson)
    } catch {
      showToast('error', 'Invalid JSON in settings')
      return
    }
    setLoading(true)
    const res = await window.electronAPI.opensearchCreateIndex(domainEndpoint, indexName.trim(), settings)
    setLoading(false)
    if (res.success) {
      showToast('success', `Index "${indexName}" created`)
      onCreated()
    } else {
      showToast('error', res.error ?? 'Failed to create index')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-base border border-theme rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Database size={16} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Index</h2>
              <p className="text-[11px] text-3">Add a new index to this domain</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-3 hover:text-1 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Index Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={indexName}
              onChange={e => setIndexName(e.target.value.toLowerCase())}
              placeholder="my-index"
              className="input-base w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Settings (JSON)</label>
            <textarea
              value={settingsJson}
              onChange={e => setSettingsJson(e.target.value)}
              className="input-base w-full font-mono text-xs resize-none"
              rows={8}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={loading || !indexName.trim()}
            className="btn-primary text-xs px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Index'}
          </button>
        </div>
      </div>
    </div>
  )
}
