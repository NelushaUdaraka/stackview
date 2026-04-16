import { useState, useCallback, useEffect } from 'react'
import { Database, Plus, Trash2, RefreshCw, ChevronRight, Code } from 'lucide-react'
import CreateIndexModal from './CreateIndexModal'
import DocumentsPanel from './DocumentsPanel'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  domainEndpoint: string
}

function HealthDot({ health }: { health: string }) {
  const cls =
    health === 'green' ? 'bg-emerald-400' :
    health === 'yellow' ? 'bg-amber-400' :
    health === 'red' ? 'bg-red-400' :
    'bg-slate-400'
  return <span className={`w-2 h-2 rounded-full shrink-0 ${cls}`} />
}

type View = 'indices' | 'documents' | 'mapping'

export default function IndicesPanel({ domainEndpoint }: Props) {
  const { showToast } = useToastContext()
  const [indices, setIndices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null)
  const [view, setView] = useState<View>('indices')
  const [mappingData, setMappingData] = useState<string | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<string | null>(null)

  const loadIndices = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.opensearchListIndices(domainEndpoint)
    setLoading(false)
    if (res.success && res.data) {
      const filtered = (res.data as any[]).filter(i => !i.index?.startsWith('.'))
      setIndices(filtered)
    } else {
      showToast('error', res.error ?? 'Failed to load indices')
    }
  }, [domainEndpoint])

  useEffect(() => { loadIndices() }, [loadIndices])

  const handleDeleteIndex = async (indexName: string) => {
    if (!confirm(`Delete index "${indexName}"? This cannot be undone.`)) return
    setDeletingIndex(indexName)
    const res = await window.electronAPI.opensearchDeleteIndex(domainEndpoint, indexName)
    setDeletingIndex(null)
    if (res.success) {
      showToast('success', `Index "${indexName}" deleted`)
      if (selectedIndex === indexName) { setSelectedIndex(null); setView('indices') }
      loadIndices()
    } else {
      showToast('error', res.error ?? 'Failed to delete index')
    }
  }

  const handleViewMapping = async (indexName: string) => {
    setSelectedIndex(indexName)
    setView('mapping')
    const res = await window.electronAPI.opensearchGetMapping(domainEndpoint, indexName)
    if (res.success && res.data) {
      setMappingData(JSON.stringify(res.data, null, 2))
    } else {
      setMappingData(null)
      showToast('error', res.error ?? 'Failed to load mapping')
    }
  }

  if (view === 'documents' && selectedIndex) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-theme shrink-0">
          <button onClick={() => { setView('indices'); setSelectedIndex(null) }}
            className="text-xs text-3 hover:text-1 transition-colors flex items-center gap-1">
            Indices
          </button>
          <ChevronRight size={12} className="text-4" />
          <span className="text-xs font-semibold text-1 font-mono">{selectedIndex}</span>
          <span className="text-[10px] text-3 ml-1">/ Documents</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <DocumentsPanel domainEndpoint={domainEndpoint} indexName={selectedIndex} />
        </div>
      </div>
    )
  }

  if (view === 'mapping' && selectedIndex) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-theme shrink-0">
          <button onClick={() => { setView('indices'); setSelectedIndex(null) }}
            className="text-xs text-3 hover:text-1 transition-colors">Indices</button>
          <ChevronRight size={12} className="text-4" />
          <span className="text-xs font-semibold text-1 font-mono">{selectedIndex}</span>
          <span className="text-[10px] text-3 ml-1">/ Mapping</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {mappingData ? (
            <pre className="text-[11px] font-mono text-2 bg-raised rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all">
              {mappingData}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-32 text-3">
              <RefreshCw size={16} className="animate-spin mr-2" /> Loading…
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-theme shrink-0">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-purple-400" />
          <span className="text-xs font-bold text-1">Indices</span>
          {!loading && <span className="text-[10px] text-4">({indices.length})</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadIndices} className="p-1.5 rounded-lg hover:bg-raised text-3 hover:text-1 transition-colors" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors active:scale-[0.98]"
          >
            <Plus size={12} />
            Create Index
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading && indices.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-3">
            <RefreshCw size={16} className="animate-spin mr-2" /> Loading indices…
          </div>
        ) : indices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6">
            <Database size={32} className="text-4 opacity-20 mb-3" />
            <p className="text-xs text-3 font-medium">No indices found</p>
            <p className="text-[10px] text-4 mt-1">Create an index to store and search documents</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Health</th>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Index</th>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Docs</th>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Size</th>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {indices.map(idx => {
                const isDeleting = deletingIndex === idx.index
                return (
                  <tr key={idx.index} className="border-b border-theme hover:bg-raised transition-colors group">
                    <td className="px-4 py-2.5">
                      <HealthDot health={idx.health} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-semibold text-1">{idx.index}</span>
                    </td>
                    <td className="px-4 py-2.5 text-2 tabular-nums">{idx['docs.count'] ?? idx.docsCount ?? '—'}</td>
                    <td className="px-4 py-2.5 text-2">{idx['store.size'] ?? idx.storeSize ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-semibold text-3 uppercase">{idx.status}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setSelectedIndex(idx.index); setView('documents') }}
                          className="p-1.5 rounded-lg text-3 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                          title="Browse documents"
                        >
                          <Database size={12} />
                        </button>
                        <button
                          onClick={() => handleViewMapping(idx.index)}
                          className="p-1.5 rounded-lg text-3 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                          title="View mapping"
                        >
                          <Code size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteIndex(idx.index)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-3 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete index"
                        >
                          {isDeleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CreateIndexModal
          domainEndpoint={domainEndpoint}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadIndices() }}
        />
      )}
    </div>
  )
}
