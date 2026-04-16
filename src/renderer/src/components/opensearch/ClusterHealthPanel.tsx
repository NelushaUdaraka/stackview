import { useEffect, useState, useCallback } from 'react'
import { Heart, RefreshCw } from 'lucide-react'

interface Props {
  domainEndpoint: string
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  const cls =
    s === 'green' ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' :
    s === 'yellow' ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20' :
    'bg-red-500/10 text-red-400 ring-red-500/20'
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ring-1 ring-inset ${cls}`}>
      <span className={`w-2 h-2 rounded-full ${s === 'green' ? 'bg-emerald-400' : s === 'yellow' ? 'bg-amber-400' : 'bg-red-400'}`} />
      {status?.toUpperCase() ?? 'UNKNOWN'}
    </span>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4 rounded-xl">
      <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-1 tabular-nums">{value}</p>
    </div>
  )
}

export default function ClusterHealthPanel({ domainEndpoint }: Props) {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await window.electronAPI.opensearchGetClusterHealth(domainEndpoint)
    if (res.success && res.data) {
      setHealth(res.data)
    } else {
      setError(res.error ?? 'Failed to fetch cluster health')
    }
    setLoading(false)
  }, [domainEndpoint])

  useEffect(() => { load() }, [load])

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-48 text-3">
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading cluster health…
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button onClick={load} className="btn-secondary text-xs px-4 py-2">Retry</button>
      </div>
    )
  }

  if (!health) return null

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart size={16} className="text-purple-400" />
          <span className="text-sm font-bold text-1">Cluster Health</span>
          {health.cluster_name && (
            <span className="text-[11px] text-3 font-mono">{health.cluster_name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {health.status && <StatusBadge status={health.status} />}
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-raised text-3 hover:text-1 transition-colors" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Nodes" value={health.number_of_nodes ?? 0} />
        <StatCard label="Data Nodes" value={health.number_of_data_nodes ?? 0} />
        <StatCard label="Active Shards" value={health.active_shards ?? 0} />
        <StatCard label="Primary Shards" value={health.active_primary_shards ?? 0} />
        <StatCard label="Relocating Shards" value={health.relocating_shards ?? 0} />
        <StatCard label="Unassigned Shards" value={health.unassigned_shards ?? 0} />
      </div>

      {(health.initializing_shards > 0 || health.delayed_unassigned_shards > 0) && (
        <div className="card p-3 rounded-xl space-y-1">
          {health.initializing_shards > 0 && (
            <p className="text-xs text-amber-400">Initializing shards: {health.initializing_shards}</p>
          )}
          {health.delayed_unassigned_shards > 0 && (
            <p className="text-xs text-amber-400">Delayed unassigned: {health.delayed_unassigned_shards}</p>
          )}
        </div>
      )}
    </div>
  )
}
