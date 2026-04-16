import { useState, useEffect } from 'react'
import { ArrowUpRight, Copy, CheckCircle2, RefreshCw, PackageOpen, Loader2, Filter, X } from 'lucide-react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors" title="Copy">
      {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  )
}

// Extract stack name from stack ARN like arn:aws:cloudformation:us-east-1:000000000000:stack/my-stack/uuid
function stackNameFromId(stackId: string): string {
  const parts = stackId.split(':stack/')
  if (parts.length > 1) return parts[1].split('/')[0]
  return stackId.split('/')[1] ?? stackId
}

export default function CloudFormationExportsView() {
  const [exports, setExports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    const res = await window.electronAPI.cfnListExports()
    if (res.success && res.data) setExports(res.data)
    else setError(res.error ?? 'Failed to load exports')
    setLoading(false)
  }

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  const filtered = exports.filter(e =>
    [e.Name, e.Value, e.ExportingStackId].some(v =>
      typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-app h-full overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme bg-base shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shadow-sm"><ArrowUpRight size={16} /></div>
            <div>
              <h2 className="text-base font-bold text-1 leading-none">
                Exports
                {!loading && <span className="ml-2 text-xs font-mono text-orange-500">({exports.length})</span>}
              </h2>
              <p className="text-[10px] text-4 uppercase tracking-wider font-bold mt-1">Cross-Stack Exports</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter exports..."
                className="sidebar-search pl-7 w-64 !bg-raised/40"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-4 hover:text-1">
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={refresh}
              disabled={refreshing || loading}
              className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-3" />
          </div>
        ) : error ? (
          <div className="py-20 text-center bg-base rounded-3xl border border-theme border-dashed">
            <p className="text-sm text-red-500 font-semibold mb-1">Failed to load exports</p>
            <p className="text-xs text-3">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-base rounded-3xl border border-theme border-dashed">
            <PackageOpen size={40} className="mx-auto mb-3 text-4 opacity-10" />
            <p className="text-sm font-semibold text-2">
              {search ? 'No exports match your filter' : 'No exports found'}
            </p>
            <p className="text-xs text-4 max-w-sm mx-auto mt-1 leading-relaxed">
              {search
                ? 'Try a different search term.'
                : 'Exports are created when a stack outputs a value with an Export Name defined.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-theme bg-base overflow-x-auto relative">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-theme bg-raised/50 text-xs text-3 font-semibold">
                  <th className="py-2.5 px-4">Export Name</th>
                  <th className="py-2.5 px-4">Export Value</th>
                  <th className="py-2.5 px-4">Exporting Stack</th>
                  <th className="py-2.5 px-4">Stack ID</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-theme/50">
                {filtered.map((exp, i) => {
                  const stackId = exp.ExportingStackId ?? ''
                  const stackName = stackNameFromId(stackId)
                  return (
                    <tr key={i} className="hover:bg-raised transition-colors group">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold font-mono text-1">{exp.Name ?? '—'}</span>
                          {exp.Name && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <CopyButton text={exp.Name} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 max-w-[260px]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-2 truncate" title={exp.Value}>
                            {exp.Value ?? '—'}
                          </span>
                          {exp.Value && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <CopyButton text={exp.Value} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-xs text-2 font-mono">{stackName || '—'}</span>
                      </td>
                      <td className="py-2.5 px-4 max-w-[220px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-3 truncate" title={stackId}>
                            {stackId || '—'}
                          </span>
                          {stackId && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <CopyButton text={stackId} />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
