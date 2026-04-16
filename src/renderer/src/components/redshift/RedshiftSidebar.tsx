import { useState } from 'react'
import { Search, Plus, Database, ShieldAlert, Loader2, Box } from 'lucide-react'
import type { RedshiftCluster } from '../../types'

interface Props {
  clusters: RedshiftCluster[]
  selectedCluster: RedshiftCluster | null
  onSelectCluster: (cluster: RedshiftCluster) => void
  onCreateCluster: () => void
  loading?: boolean
}

export default function RedshiftSidebar({ clusters, selectedCluster, onSelectCluster, onCreateCluster, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = clusters.filter(c =>
    c.ClusterIdentifier?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Clusters {!loading && clusters.length > 0 && `(${clusters.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clusters..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : clusters.length === 0 ? (
              <>
                <ShieldAlert size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No clusters found</p>
                <p className="text-[10px] text-4 mt-1">Create a new cluster to get started</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((cluster) => {
            const isSelected = selectedCluster?.ClusterIdentifier === cluster.ClusterIdentifier
            const status = cluster.ClusterStatus || 'unknown'
            const isAvailable = status.toLowerCase() === 'available'
            const isModifying = status.toLowerCase().includes('modifying') || status.toLowerCase().includes('creating')
            
            return (
              <button
                key={cluster.ClusterIdentifier}
                onClick={() => onSelectCluster(cluster)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-red-500/10 border-l-red-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <Database size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-red-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${isSelected ? 'text-1' : 'text-2'}`}>
                    {cluster.ClusterIdentifier}
                  </p>
                  <div className="flex items-center gap-1.5 min-w-0">
                     <span className={`text-[9px] font-bold uppercase tracking-widest truncate ${
                       isAvailable ? 'text-emerald-500' : isModifying ? 'text-amber-500' : 'text-red-500'
                     }`}>
                       {status}
                     </span>
                     <span className="text-[10px] text-4">·</span>
                     <span className="text-[10px] text-4 truncate font-mono uppercase tracking-tight">{cluster.NodeType}</span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateCluster}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-sm active:scale-[0.98]"
        >
          <Plus size={13} />
          Create Cluster
        </button>
      </div>
    </div>
  )
}
