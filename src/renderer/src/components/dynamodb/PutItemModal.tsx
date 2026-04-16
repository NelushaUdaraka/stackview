import { useState } from 'react'
import { X, FileJson, Loader2 } from 'lucide-react'

interface Props {
  tableName: string
  onClose: () => void
  onCreated: () => void
}

export default function PutItemModal({ tableName, onClose, onCreated }: Props) {
  const [jsonStr, setJsonStr] = useState('{\n  "id": "123",\n  "attribute": "value"\n}')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePut = async () => {
    setLoading(true)
    setError('')
    
    let parsedItem: Record<string, any>
    try {
      parsedItem = JSON.parse(jsonStr)
      if (!parsedItem || typeof parsedItem !== 'object' || Array.isArray(parsedItem)) {
        throw new Error('Item must be a JSON object')
      }
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`)
      setLoading(false)
      return
    }

    try {
      const result = await window.electronAPI.dynamoDbPutItem(tableName, parsedItem)
      if (result.success) {
        onCreated()
      } else {
        setError(result.error ?? 'Failed to put item')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div
          className="relative w-full max-w-xl rounded-2xl shadow-2xl border border-theme p-6 my-auto"
          style={{ backgroundColor: 'rgb(var(--bg-base))' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(139 92 246 / 0.1)' }}>
                <FileJson size={15} style={{ color: 'rgb(139 92 246)' }} />
              </div>
              <h2 className="text-sm font-bold text-1">Put Item ({tableName})</h2>
            </div>
            <button onClick={onClose} className="btn-ghost !px-2 !py-2">
              <X size={15} />
            </button>
          </div>

          <div className="mb-5">
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
              Item JSON
            </label>
            <textarea
              value={jsonStr}
              onChange={(e) => { setJsonStr(e.target.value); setError('') }}
              className="input-base font-mono text-xs w-full min-h-[250px] resize-y"
              spellCheck={false}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 break-all">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-theme">
            <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-4">
              Cancel
            </button>
            <button
              onClick={handlePut}
              disabled={loading}
              className="btn-primary text-xs py-1.5 px-4 gap-1.5 text-white"
              style={!loading ? { backgroundColor: 'rgb(139 92 246)' } : {}}
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              Save Item
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
