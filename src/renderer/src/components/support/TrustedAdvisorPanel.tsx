import { useState, useCallback, useEffect } from 'react'
import { ShieldCheck, RefreshCw, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import type { TrustedAdvisorCheck } from '../../types'

interface Props {
  showToast: (type: 'success' | 'error', text: string) => void
}

const CATEGORY_COLOR: Record<string, string> = {
  cost_optimizing: 'text-amber-500',
  performance: 'text-blue-500',
  security: 'text-red-500',
  fault_tolerance: 'text-orange-500',
  service_limits: 'text-violet-500',
}

/** Parse AWS Trusted Advisor HTML descriptions into sections split by <b>...</b> headings. */
function parseAdvisorHtml(html: string): { heading: string | null; body: string }[] {
  // Split on <b>Heading</b> markers — AWS uses these for section labels
  const parts = html.split(/(<b>[^<]*<\/b>)/i)
  const sections: { heading: string | null; body: string }[] = []
  let i = 0
  // Text before the first heading (main summary)
  if (parts[0] && !/^<b>/i.test(parts[0])) {
    const body = parts[0].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
    if (body) sections.push({ heading: null, body })
    i = 1
  }
  while (i < parts.length) {
    const heading = parts[i]?.replace(/<\/?b>/gi, '').trim() ?? ''
    const body = (parts[i + 1] ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (heading) sections.push({ heading, body })
    i += 2
  }
  return sections
}

function CheckDescription({ html }: { html: string }) {
  const sections = parseAdvisorHtml(html)
  return (
    <div className="space-y-2.5">
      {sections.map((s, i) =>
        s.heading ? (
          <div key={i}>
            <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">{s.heading}</p>
            <p className="text-xs text-3 leading-relaxed whitespace-pre-line">{s.body}</p>
          </div>
        ) : (
          <p key={i} className="text-xs text-3 leading-relaxed whitespace-pre-line">{s.body}</p>
        )
      )}
    </div>
  )
}

function CheckRow({
  check,
  showToast,
}: {
  check: TrustedAdvisorCheck
  showToast: (type: 'success' | 'error', text: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastStatus, setLastStatus] = useState<string | null>(null)

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setRefreshing(true)
    const res = await window.electronAPI.supportRefreshTrustedAdvisorCheck(check.id)
    setRefreshing(false)
    if (res.success) {
      setLastStatus(res.data || 'enqueued')
      showToast('success', `Check "${check.name}" refresh ${res.data || 'enqueued'}`)
    } else {
      showToast('error', res.error || 'Failed to refresh check')
    }
  }

  const catColor = CATEGORY_COLOR[check.category.toLowerCase()] ?? 'text-3'

  return (
    <div className="border-b border-theme last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-raised transition-colors"
      >
        <span className="mt-0.5 text-4 shrink-0">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-1">{check.name}</span>
            <span className={`text-[8px] font-bold uppercase ${catColor}`}>{check.category}</span>
            {lastStatus && (
              <span className="text-[8px] font-bold uppercase text-emerald-500">{lastStatus}</span>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-ghost !px-2 !py-1 shrink-0"
          title="Refresh check"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          <CheckDescription html={check.description} />
          {check.metadata.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Metadata columns</p>
              <div className="flex flex-wrap gap-1">
                {check.metadata.map((m, i) => (
                  <span key={i} className="text-[10px] font-mono bg-raised px-1.5 py-0.5 rounded border border-theme text-3">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] font-mono text-4">ID: {check.id}</p>
        </div>
      )}
    </div>
  )
}

export default function TrustedAdvisorPanel({ showToast }: Props) {
  const [checks, setChecks] = useState<TrustedAdvisorCheck[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.supportDescribeTrustedAdvisorChecks()
    if (res.success && res.data) {
      setChecks(res.data)
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load Trusted Advisor checks')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const categories = ['all', ...Array.from(new Set(checks.map((c) => c.category.toLowerCase())))]

  const filtered = checks.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || c.category.toLowerCase() === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-sky-500/20 bg-sky-500/10">
              <ShieldCheck size={20} className="text-sky-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Trusted Advisor Checks</h2>
              <p className="text-xs text-3">
                {loading ? 'Loading…' : `${filtered.length} check${filtered.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="btn-ghost !px-2 !py-1.5">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search checks…"
              className="input-base w-full text-xs py-1.5 pl-3"
            />
          </div>
          {categories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-base text-xs py-1.5 capitalize shrink-0 w-36"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat === 'all' ? 'All categories' : cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-3" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck size={24} className="text-4 mb-2 opacity-20" />
            <p className="text-xs text-3 font-medium">No checks found</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
            {filtered.map((check) => (
              <CheckRow key={check.id} check={check} showToast={showToast} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
