import { useState } from 'react'
import { X, FileText } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  domainEndpoint: string
  indexName: string
  onClose: () => void
  onIndexed: () => void
}

const DEFAULT_DOC = `{
  "title": "My Document",
  "content": "Hello, OpenSearch!",
  "tags": ["example", "localstack"]
}`

export default function IndexDocumentModal({ domainEndpoint, indexName, onClose, onIndexed }: Props) {
  const { showToast } = useToastContext()
  const [docId, setDocId] = useState('')
  const [body, setBody] = useState(DEFAULT_DOC)
  const [loading, setLoading] = useState(false)

  const handleIndex = async () => {
    let parsed: object
    try {
      parsed = JSON.parse(body)
    } catch {
      showToast('error', 'Invalid JSON')
      return
    }
    setLoading(true)
    const res = await window.electronAPI.opensearchIndexDocument(
      domainEndpoint, indexName, parsed, docId.trim() || undefined
    )
    setLoading(false)
    if (res.success) {
      showToast('success', `Document indexed (ID: ${res.data?._id ?? 'auto'})`)
      onIndexed()
    } else {
      showToast('error', res.error ?? 'Failed to index document')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-base border border-theme rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FileText size={16} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Index Document</h2>
              <p className="text-[11px] text-3">Add a document to <span className="font-mono font-bold">{indexName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-3 hover:text-1 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Document ID <span className="text-3 font-normal">(optional — auto-generated if empty)</span></label>
            <input
              type="text"
              value={docId}
              onChange={e => setDocId(e.target.value)}
              placeholder="Leave blank for auto ID"
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Document Body (JSON) <span className="text-red-400">*</span></label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              className="input-base w-full font-mono text-xs resize-none"
              rows={9}
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">Cancel</button>
          <button
            onClick={handleIndex}
            disabled={loading}
            className="btn-primary text-xs px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Indexing…' : 'Index Document'}
          </button>
        </div>
      </div>
    </div>
  )
}
