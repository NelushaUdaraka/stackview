import { useState, useCallback, useEffect } from 'react'
import { Search, LineChart, Hash, Globe, Activity, Loader2, AlertCircle, Filter, X, Plus, ShieldCheck } from 'lucide-react'
import type { CloudWatchMetric } from '../../types'

// ── Put Metric Data Modal ──────────────────────────────────────────────────

function PutMetricModal({ onClose, onCreated, showToast, setLoading }: { onClose: () => void, onCreated: () => void, showToast: any, setLoading: any }) {
  const [namespace, setNamespace] = useState('Custom')
  const [metricName, setMetricName] = useState('')
  const [value, setValue] = useState('1.0')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!namespace.trim() || !metricName.trim()) return
    setSubmitting(true)
    setError('')
    
    try {
      const res = await window.electronAPI.cloudwatchPutMetricData(
        namespace.trim(),
        metricName.trim(),
        parseFloat(value)
      )
      
      if (res.success) {
        showToast('success', `Metric data put for ${metricName}`)
        onCreated()
        onClose()
      } else {
        setError(res.error || 'Failed to put metric data')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm shadow-2xl">
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden animate-in zoom-in duration-200 bg-base">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 shadow-sm"><LineChart size={16} /></div>
            <div>
              <h2 className="text-sm font-bold text-1">Put Metric Data</h2>
              <p className="text-[10px] text-3 uppercase tracking-wider font-bold">CloudWatch Metrics</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Namespace *</label>
            <input value={namespace} onChange={e => setNamespace(e.target.value)} placeholder="e.g. Custom" className="input-base w-full" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Metric Name *</label>
            <input value={metricName} onChange={e => setMetricName(e.target.value)} placeholder="e.g. MyMetric" className="input-base w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Value *</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} className="input-base w-full" />
          </div>
          {error && <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-500 flex items-start gap-2"><AlertCircle size={14} className="shrink-0 mt-0.5" />{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-ghost !px-4 !py-2 rounded-xl text-xs font-bold">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !namespace.trim() || !metricName.trim()} className="btn-primary !px-5 !py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 min-w-[100px] flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Put Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Toast {
  id: number
  type: 'success' | 'error'
  text: string
}

interface Props {
  setLoading: (loading: boolean) => void
  showPutModal?: boolean
  onClosePutModal?: () => void
  onMetricDataPut?: () => void
}

export default function CloudWatchMetricsView({ setLoading, showPutModal, onClosePutModal, onMetricDataPut }: Props) {
  const [metrics, setMetrics] = useState<CloudWatchMetric[]>([])
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, text }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const loadMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.cloudwatchListMetrics()
      if (res.success && res.data) {
        setMetrics(res.data)
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  useEffect(() => { loadMetrics() }, [loadMetrics])

  const filteredMetrics = metrics.filter(m => 
    m.MetricName?.toLowerCase().includes(search.toLowerCase()) ||
    m.Namespace?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-app h-full overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme bg-base shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 shadow-sm"><LineChart size={16} /></div>
            <div>
              <h2 className="text-base font-bold text-1 leading-none">Metrics</h2>
              <p className="text-[10px] text-4 uppercase tracking-wider font-bold mt-1">CloudWatch Metrics Browse</p>
            </div>
          </div>
          <div className="relative">
            <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter metrics..."
              className="sidebar-search pl-7 w-64 !bg-raised/40"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-4 hover:text-1"><X size={12} /></button>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredMetrics.length === 0 ? (
          <div className="py-20 text-center bg-base rounded-3xl border border-theme border-dashed">
            <LineChart size={40} className="mx-auto mb-3 text-4 opacity-10" />
            <p className="text-sm font-semibold text-2">No metrics found</p>
            <p className="text-xs text-4">Available metrics will appear here once registered</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-theme overflow-hidden bg-base shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-raised/50 border-b border-theme">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider">Namespace</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider">Metric Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider">Dimensions</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filteredMetrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-cyan-500/5 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Globe size={13} className="text-cyan-500/70" />
                        <span className="text-xs font-bold text-2">{m.Namespace}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Hash size={13} className="text-indigo-500/70" />
                        <span className="text-xs font-semibold text-1">{m.MetricName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {m.Dimensions?.map((d, dIdx) => (
                          <div key={dIdx} className="px-2 py-0.5 rounded-lg bg-raised border border-theme text-[9px] font-mono text-3">
                            <span className="text-4">{d.Name}:</span> {d.Value}
                          </div>
                        )) || <span className="text-[10px] text-4 italic">No dimensions</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="btn-ghost !p-2 rounded-lg text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Activity size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPutModal && (
        <PutMetricModal
          onClose={onClosePutModal || (() => {})}
          onCreated={() => { onMetricDataPut && onMetricDataPut(); loadMetrics() }}
          showToast={showToast}
          setLoading={setLoading}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl animate-in slide-in-from-right duration-300 pointer-events-auto
              ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {t.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
            <span className="text-xs font-bold">{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
