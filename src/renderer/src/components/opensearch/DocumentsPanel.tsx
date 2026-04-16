import { useState, useCallback } from 'react'
import { Search, Plus, Trash2, RefreshCw, FileText } from 'lucide-react'
import IndexDocumentModal from './IndexDocumentModal'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  domainEndpoint: string
  indexName: string
}

const DEFAULT_QUERY = `{
  "query": {
    "match_all": {}
  }
}`

export default function DocumentsPanel({ domainEndpoint, indexName }: Props) {
  const { showToast } = useToastContext()
  const [queryText, setQueryText] = useState(DEFAULT_QUERY)
  const [size, setSize] = useState(20)
  const [results, setResults] = useState<any[]>([])
  const [totalHits, setTotalHits] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showIndexModal, setShowIndexModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const search = useCallback(async () => {
    let query: object
    try {
      query = JSON.parse(queryText)
    } catch {
      showToast('error', 'Invalid JSON query')
      return
    }
    setLoading(true)
    const res = await window.electronAPI.opensearchSearchDocuments(domainEndpoint, indexName, query, size)
    setLoading(false)
    setSearched(true)
    if (res.success && res.data) {
      const hits = res.data.hits?.hits ?? []
      const total = res.data.hits?.total?.value ?? res.data.hits?.total ?? hits.length
      setResults(hits)
      setTotalHits(total)
    } else {
      showToast('error', res.error ?? 'Search failed')
    }
  }, [domainEndpoint, indexName, queryText, size])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const res = await window.electronAPI.opensearchDeleteDocument(domainEndpoint, indexName, id)
    setDeletingId(null)
    if (res.success) {
      showToast('success', `Document deleted`)
      setResults(prev => prev.filter(d => d._id !== id))
    } else {
      showToast('error', res.error ?? 'Failed to delete document')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search controls */}
      <div className="p-4 border-b border-theme space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-purple-400" />
            <span className="text-xs font-bold text-1">Search Documents</span>
            <span className="text-[10px] text-3 font-mono">{indexName}</span>
          </div>
          <button
            onClick={() => setShowIndexModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors active:scale-[0.98]"
          >
            <Plus size={12} />
            Index Document
          </button>
        </div>

        <textarea
          value={queryText}
          onChange={e => setQueryText(e.target.value)}
          className="input-base w-full font-mono text-xs resize-none"
          rows={5}
          spellCheck={false}
          placeholder="OpenSearch Query DSL (JSON)"
        />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-3">Size:</label>
            <input
              type="number"
              min={1}
              max={200}
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              className="input-base w-20 text-xs py-1"
            />
          </div>
          <button
            onClick={search}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
            {loading ? 'Searching…' : 'Search'}
          </button>
          {totalHits !== null && (
            <span className="text-[11px] text-3">
              Showing {results.length} of <span className="font-bold text-purple-400">{totalHits}</span> hits
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!searched && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <FileText size={28} className="text-4 opacity-20 mb-2" />
            <p className="text-xs text-3">Run a search to see documents</p>
          </div>
        )}

        {searched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Search size={24} className="text-4 opacity-20 mb-2" />
            <p className="text-xs text-3">No documents found</p>
          </div>
        )}

        {results.map(hit => {
          const isExpanded = expandedId === hit._id
          const isDeleting = deletingId === hit._id
          return (
            <div key={hit._id} className="border-b border-theme">
              <div className="flex items-start gap-2 px-4 py-2.5 hover:bg-raised transition-colors">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : hit._id)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-purple-400 font-mono truncate">{hit._id}</span>
                    {hit._score !== undefined && (
                      <span className="text-[9px] text-4 font-mono">score: {hit._score?.toFixed(3)}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-3 font-mono truncate">
                    {JSON.stringify(hit._source).slice(0, 120)}
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(hit._id)}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg text-3 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Delete document"
                >
                  {isDeleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              </div>

              {isExpanded && (
                <div className="px-4 pb-3">
                  <pre className="text-[11px] font-mono text-2 bg-raised rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(hit._source, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showIndexModal && (
        <IndexDocumentModal
          domainEndpoint={domainEndpoint}
          indexName={indexName}
          onClose={() => setShowIndexModal(false)}
          onIndexed={() => { setShowIndexModal(false); search() }}
        />
      )}
    </div>
  )
}
