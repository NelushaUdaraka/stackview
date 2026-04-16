import { useState } from 'react'
import { X, FileJson, Trash2, Copy, CheckCircle2 } from 'lucide-react'
import type { DynamoItem } from '../../types'

interface Props {
  item: DynamoItem
  onClose: () => void
  onDelete?: () => void
}

type ViewMode = 'standard' | 'dynamodb'

function marshallValue(value: any): any {
  if (value === null || value === undefined) return { NULL: true }
  if (typeof value === 'string') return { S: value }
  if (typeof value === 'number') return { N: String(value) }
  if (typeof value === 'boolean') return { BOOL: value }
  if (Array.isArray(value)) return { L: value.map(marshallValue) }
  if (typeof value === 'object') {
    const m: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      m[k] = marshallValue(v)
    }
    return { M: m }
  }
  return { S: String(value) }
}

function marshallItem(item: DynamoItem): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(item)) {
    result[key] = marshallValue(value)
  }
  return result
}

export default function ViewItemModal({ item, onClose, onDelete }: Props) {
  const [mode, setMode] = useState<ViewMode>('standard')
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const displayJSON = mode === 'standard'
    ? JSON.stringify(item, null, 2)
    : JSON.stringify(marshallItem(item), null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(displayJSON)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    onDelete?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div
          className="relative w-full max-w-2xl rounded-2xl shadow-2xl border border-theme p-6 my-auto"
          style={{ backgroundColor: 'rgb(var(--bg-base))' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(139 92 246 / 0.1)' }}>
                <FileJson size={15} style={{ color: 'rgb(139 92 246)' }} />
              </div>
              <h2 className="text-sm font-bold text-1">Item Viewer</h2>
            </div>
            <button onClick={onClose} className="btn-ghost !px-2 !py-2">
              <X size={15} />
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex bg-raised rounded-lg p-1 border border-theme">
              <button
                onClick={() => setMode('standard')}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${mode === 'standard' ? 'bg-base shadow-sm text-1' : 'text-3 hover:text-2'}`}
              >
                JSON
              </button>
              <button
                onClick={() => setMode('dynamodb')}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${mode === 'dynamodb' ? 'bg-base shadow-sm text-1' : 'text-3 hover:text-2'}`}
              >
                DynamoDB JSON
              </button>
            </div>
            <button
              onClick={handleCopy}
              className="btn-ghost text-xs py-1 px-2 gap-1.5 ml-auto"
              title="Copy JSON"
            >
              {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="mb-5">
            <pre className="input-base font-mono text-xs w-full min-h-[250px] max-h-[450px] overflow-auto select-text break-all whitespace-pre-wrap leading-relaxed p-4">
              {displayJSON}
            </pre>
          </div>

          <div className="flex gap-3 justify-between items-center pt-4 border-t border-theme">
            {onDelete ? (
              <button
                onClick={handleDelete}
                className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-medium transition-colors
                  ${confirmDelete
                    ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                    : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'
                  }`}
              >
                <Trash2 size={13} />
                {confirmDelete ? 'Confirm Delete' : 'Delete Item'}
              </button>
            ) : <div />}
            <button onClick={onClose} className="btn-primary text-xs py-1.5 px-4 gap-1.5 text-white" style={{ backgroundColor: 'rgb(139 92 246)' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
