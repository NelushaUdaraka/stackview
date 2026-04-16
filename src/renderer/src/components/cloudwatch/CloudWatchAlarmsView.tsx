import { useState, useCallback, useEffect } from 'react'
import { Bell, Activity, Trash2, ShieldCheck, Clock, CheckCircle2, XCircle, Info, MoreVertical, Filter, X, Plus, Loader2, AlertCircle, ShieldCheck as ShieldCheckIcon } from 'lucide-react'
import type { CloudWatchAlarm } from '../../types'

// ── Create Alarm Modal ──────────────────────────────────────────────────────

function CreateAlarmModal({ onClose, onCreated, showToast, setLoading }: { onClose: () => void, onCreated: () => void, showToast: any, setLoading: any }) {
  const [name, setName] = useState('')
  const [metricName, setMetricName] = useState('')
  const [threshold, setThreshold] = useState('10')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim() || !metricName.trim()) return
    setSubmitting(true)
    setError('')
    const res = await window.electronAPI.cloudwatchPutMetricAlarm({
      AlarmName: name.trim(),
      MetricName: metricName.trim(),
      Namespace: 'AWS/Lambda',
      Threshold: parseFloat(threshold),
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: 1,
      Period: 60,
      Statistic: 'Average'
    })
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Alarm '${name}' created`)
      onCreated()
      onClose()
    } else {
      setError(res.error || 'Failed to create alarm')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm shadow-2xl">
      <div className="w-full max-w-sm rounded-2xl border border-theme shadow-2xl overflow-hidden animate-in zoom-in duration-200 bg-base">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shadow-sm"><Bell size={16} /></div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Alarm</h2>
              <p className="text-[10px] text-3 uppercase tracking-wider font-bold">CloudWatch Monitoring</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Alarm Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. LambdaErrors" className="input-base w-full" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Metric Name *</label>
            <input value={metricName} onChange={e => setMetricName(e.target.value)} placeholder="e.g. Errors" className="input-base w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Threshold (Value) *</label>
            <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="input-base w-full" />
          </div>
          {error && <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-500 flex items-start gap-2"><AlertCircle size={14} className="shrink-0 mt-0.5" />{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-ghost !px-4 !py-2 rounded-xl text-xs font-bold">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !name.trim() || !metricName.trim()} className="btn-primary !px-5 !py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 min-w-[100px] flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Create Alarm'}
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
  showCreateModal?: boolean
  onCloseCreateModal?: () => void
  onAlarmCreated?: () => void
}

export default function CloudWatchAlarmsView({ setLoading, showCreateModal, onCloseCreateModal, onAlarmCreated }: Props) {
  const [alarms, setAlarms] = useState<CloudWatchAlarm[]>([])
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, text }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const loadAlarms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.cloudwatchListAlarms()
      if (res.success && res.data) {
        const metricAlarms = Array.isArray(res.data.metricAlarms) ? res.data.metricAlarms : []
        const compositeAlarms = Array.isArray(res.data.compositeAlarms) ? res.data.compositeAlarms : []
        setAlarms([...metricAlarms, ...compositeAlarms])
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  useEffect(() => { loadAlarms() }, [loadAlarms])

  const filteredAlarms = alarms.filter(a => 
    a.AlarmName?.toLowerCase().includes(search.toLowerCase()) ||
    a.MetricName?.toLowerCase().includes(search.toLowerCase())
  )

  const getStateColor = (state?: string) => {
    switch (state) {
      case 'OK': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      case 'ALARM': return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
      case 'INSUFFICIENT_DATA': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      default: return 'text-4 bg-raised border-theme'
    }
  }

  const getStateIcon = (state?: string) => {
    switch (state) {
      case 'OK': return <CheckCircle2 size={13} />
      case 'ALARM': return <XCircle size={13} />
      case 'INSUFFICIENT_DATA': return <Info size={13} />
      default: return <AlertCircle size={13} />
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-app h-full overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme bg-base shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 shadow-sm"><Bell size={16} /></div>
            <div>
              <h2 className="text-base font-bold text-1 leading-none">Alarms</h2>
              <p className="text-[10px] text-4 uppercase tracking-wider font-bold mt-1">CloudWatch Alarms Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter alarms..."
                className="sidebar-search pl-7 w-64 !bg-raised/40"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-4 hover:text-1"><X size={12} /></button>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredAlarms.length === 0 ? (
          <div className="py-20 text-center bg-base rounded-3xl border border-theme border-dashed">
            <Bell size={40} className="mx-auto mb-3 text-4 opacity-10" />
            <p className="text-sm font-semibold text-2">No alarms found</p>
            <p className="text-xs text-4">Create an alarm to start monitoring your resources</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredAlarms.map((alarm, idx) => (
              <div key={idx} className="flex flex-col bg-base rounded-2xl border border-theme hover:border-rose-500/30 transition-all hover:shadow-lg group overflow-hidden">
                <div className="p-5 border-b border-theme/60 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-xl bg-raised border border-theme text-4 transform group-hover:scale-110 transition-transform">
                      <Bell size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-1 mb-1 truncate max-w-[220px]">{alarm.AlarmName}</h3>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getStateColor(alarm.StateValue)}`}>
                        {getStateIcon(alarm.StateValue)} {alarm.StateValue || 'UNKNOWN'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button className="btn-ghost !p-1.5 rounded-lg opacity-40 hover:opacity-100"><MoreVertical size={14} /></button>
                    <div className="flex items-center gap-1.5 text-[10px] text-4 font-mono font-bold">
                       <Clock size={11} />
                       {alarm.StateUpdatedTimestamp ? new Date(alarm.StateUpdatedTimestamp).toLocaleTimeString() : '--:--'}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-raised/20 grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-bold text-4 uppercase tracking-widest mb-1.5 grayscale opacity-70">Metric</span>
                    <div className="flex items-center gap-2">
                      <Activity size={12} className="text-cyan-500/70" />
                      <span className="text-xs font-bold text-2 truncate">{alarm.MetricName}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-4 uppercase tracking-widest mb-1.5 grayscale opacity-70">Threshold</span>
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon size={12} className="text-indigo-500/70" />
                      <span className="text-xs font-bold text-2">
                        {alarm.ComparisonOperator?.includes('GreaterThan') ? '>' : '<'} {alarm.Threshold}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-theme/60 flex items-center justify-between bg-raised/40">
                  <span className="text-[10px] text-3 italic truncate max-w-[280px]">{alarm.StateReason || 'No state reason available'}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        if (window.confirm(`Delete alarm ${alarm.AlarmName}?`)) {
                          setLoading(true)
                          try {
                            const res = await window.electronAPI.cloudwatchDeleteAlarms([alarm.AlarmName])
                            if (res.success) {
                              showToast('success', `Alarm deleted`)
                              loadAlarms()
                            } else {
                              showToast('error', res.error || 'Failed to delete alarm')
                            }
                          } finally {
                            setLoading(false)
                          }
                        }
                      }}
                      className="btn-ghost !p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateAlarmModal
          onClose={onCloseCreateModal || (() => {})}
          onCreated={() => { onAlarmCreated && onAlarmCreated(); loadAlarms() }}
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
            {t.type === 'success' ? <ShieldCheckIcon size={18} /> : <AlertCircle size={18} />}
            <span className="text-xs font-bold">{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
