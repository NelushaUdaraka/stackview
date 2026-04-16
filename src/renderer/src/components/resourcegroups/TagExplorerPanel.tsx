import { useState, useCallback, useEffect } from 'react'
import { Tag, RefreshCw, Loader2, ChevronDown, ChevronRight, Search, X, Plus } from 'lucide-react'
import type { RgTaggedResource } from '../../types'

interface Props {
  showToast: (type: 'success' | 'error', text: string) => void
}

interface TagFilter { key: string; values: string }

function ResourceRow({ resource }: { resource: RgTaggedResource }) {
  const [expanded, setExpanded] = useState(false)
  const parts = resource.resourceArn.split(':')
  const service = parts[2] ?? '?'
  const resourceType = parts[5]?.split('/')[0] ?? parts[5] ?? '?'

  return (
    <div className="border-b border-theme last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-raised transition-colors"
      >
        {expanded ? <ChevronDown size={12} className="text-4 shrink-0" /> : <ChevronRight size={12} className="text-4 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-theme bg-raised text-3 shrink-0">{service}</span>
            <span className="text-[9px] font-bold text-3 shrink-0">{resourceType}</span>
          </div>
          <p className="text-[10px] font-mono text-2 truncate mt-0.5">{resource.resourceArn}</p>
        </div>
        <div className="flex flex-wrap gap-1 max-w-[180px] shrink-0 justify-end">
          {Object.entries(resource.tags ?? {}).slice(0, 3).map(([k, v]) => (
            <span key={k} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20 whitespace-nowrap">
              {k}={v}
            </span>
          ))}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">Tags</p>
          {!resource.tags || Object.keys(resource.tags).length === 0 ? (
            <p className="text-xs text-4">No tags</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(resource.tags).map(([k, v]) => (
                <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {k}: {v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TagExplorerPanel({ showToast }: Props) {
  const [tagKeys, setTagKeys] = useState<string[]>([])
  const [resources, setResources] = useState<RgTaggedResource[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingKeys, setLoadingKeys] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TagFilter[]>([{ key: '', values: '' }])
  const [hasSearched, setHasSearched] = useState(false)

  const loadTagKeys = useCallback(async () => {
    setLoadingKeys(true)
    const res = await window.electronAPI.rgGetTagKeys()
    if (res.success && res.data) setTagKeys(res.data)
    setLoadingKeys(false)
  }, [])

  useEffect(() => { loadTagKeys() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setHasSearched(true)
    const activeFilters = filters.filter((f) => f.key.trim())
    const tagFilters = activeFilters.map((f) => ({
      key: f.key.trim(),
      values: f.values.split(',').map((v) => v.trim()).filter(Boolean),
    }))
    const res = await window.electronAPI.rgGetResources(tagFilters.length > 0 ? tagFilters : undefined)
    setLoading(false)
    if (res.success && res.data) setResources(res.data)
    else showToast('error', res.error ?? 'Failed to get resources')
  }, [filters, showToast])

  const addFilter = () => setFilters((prev) => [...prev, { key: '', values: '' }])
  const removeFilter = (i: number) => setFilters((prev) => prev.filter((_, idx) => idx !== i))
  const updateFilter = (i: number, field: keyof TagFilter, value: string) =>
    setFilters((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f))

  const filtered = resources.filter((r) =>
    !search || r.resourceArn.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-orange-500/20 bg-orange-500/10">
              <Tag size={20} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Tag Explorer</h2>
              <p className="text-xs text-3">
                {loadingKeys ? 'Loading tag keys…' : `${tagKeys.length} tag key${tagKeys.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>
          <button onClick={loadTagKeys} disabled={loadingKeys} className="btn-ghost !px-2 !py-1.5">
            <RefreshCw size={14} className={loadingKeys ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tag filters */}
        <div className="space-y-2 mb-3">
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  list={`tag-keys-${i}`}
                  value={f.key}
                  onChange={(e) => updateFilter(i, 'key', e.target.value)}
                  placeholder="Tag key…"
                  className="input-base w-full text-xs py-1.5"
                />
                <datalist id={`tag-keys-${i}`}>
                  {tagKeys.map((k) => <option key={k} value={k} />)}
                </datalist>
              </div>
              <span className="text-xs text-4">=</span>
              <div className="flex-1">
                <input
                  value={f.values}
                  onChange={(e) => updateFilter(i, 'values', e.target.value)}
                  placeholder="Values (comma-separated)"
                  className="input-base w-full text-xs py-1.5"
                />
              </div>
              {filters.length > 1 && (
                <button onClick={() => removeFilter(i)} className="btn-ghost !p-1.5 text-red-400 hover:text-red-300">
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={addFilter} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3">
            <Plus size={12} /> Add Filter
          </button>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            Search Resources
          </button>
          {hasSearched && (
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter results…"
                className="input-base w-full text-xs py-1.5 pl-7"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <Tag size={32} className="text-orange-500 opacity-50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-2">Find tagged resources</p>
              <p className="text-xs text-3 mt-1">Add tag filters and click Search to find matching resources</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-3" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Tag size={24} className="text-4 mb-2 opacity-20" />
            <p className="text-xs text-3 font-medium">No resources found</p>
            <p className="text-[10px] text-4 mt-1">Try different tag filters or leave them empty to list all tagged resources</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
            <div className="px-4 py-2 border-b border-theme">
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider">{filtered.length} resource{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            {filtered.map((r) => <ResourceRow key={r.resourceArn} resource={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}
