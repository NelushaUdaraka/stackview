import { useState } from 'react'
import { Trash2, Database, Loader2, RefreshCw, CheckCircle2, Copy, Check, Info, Server, Cpu, Clock, Shield, Globe } from 'lucide-react'
import type { RedshiftCluster } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  cluster: RedshiftCluster
  onRefresh: () => Promise<void>
  onDeleted: () => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

export default function RedshiftClusterDetail({ cluster, onRefresh, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const status = cluster.ClusterStatus || 'unknown'
  const isAvailable = status.toLowerCase() === 'available'
  const isModifying = status.toLowerCase().includes('modifying') || status.toLowerCase().includes('creating')

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 5000)
      return
    }
    setDeleting(true)
    const res = await window.electronAPI.redshiftDeleteCluster(cluster.ClusterIdentifier!)
    if (res.success) {
      showToast('success', `Cluster ${cluster.ClusterIdentifier} deletion initiated`)
      onDeleted()
    } else {
      showToast('error', res.error || 'Failed to delete cluster')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  const renderProperty = (label: string, value: string | React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-4 font-bold uppercase tracking-widest">{label}</span>
      <span className="text-sm text-2 font-medium truncate">{value}</span>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      {/* Premium Header */}
      <div className="px-6 py-6 border-b border-theme bg-base shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-3.5 rounded-2xl border ${isAvailable ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : isModifying ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              <Database size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <h2 className="text-xl font-bold text-1 truncate tracking-tight">{cluster.ClusterIdentifier}</h2>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                    isAvailable ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    isModifying ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                    'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {status}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-500/10 text-red-500 border border-red-500/20">
                    {cluster.NodeType}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-3 font-mono">
                <div className="flex items-center gap-1.5 min-w-0">
                   <Globe size={12} className="shrink-0 opacity-50" />
                   <span className="truncate">{cluster.Endpoint?.Address || 'No Endpoint'}</span>
                   <CopyButton text={cluster.Endpoint?.Address || ''} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="no-drag btn-ghost !px-2 !py-2 rounded-lg"
              title="Refresh details"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all min-w-[140px] justify-center shadow-sm
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 shadow-sm shadow-red-500/5'
                  : 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                }`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete Cluster'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-8">
          {/* Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-base rounded-2xl border border-theme p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-theme flex items-center justify-center">
                   <Cpu size={18} className="text-2" />
                </div>
                <div>
                   <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-0.5">Compute</p>
                   <p className="text-sm font-semibold text-1">{cluster.NodeType}</p>
                   <p className="text-[10px] text-3 capitalize">{cluster.NumberOfNodes} Nodes</p>
                </div>
             </div>
             <div className="bg-base rounded-2xl border border-theme p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-theme flex items-center justify-center">
                   <Shield size={18} className="text-2" />
                </div>
                <div>
                   <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-0.5">Admin</p>
                   <p className="text-sm font-semibold text-1">{cluster.MasterUsername}</p>
                </div>
             </div>
             <div className="bg-base rounded-2xl border border-theme p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-theme flex items-center justify-center">
                   <Clock size={18} className="text-2" />
                </div>
                <div>
                   <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-0.5">Maintenance</p>
                   <p className="text-sm font-semibold text-1">Active</p>
                </div>
             </div>
          </div>

          {/* Properties Section */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 px-1">
                <Info size={14} className="text-red-500" />
                <h3 className="text-sm font-bold text-1">Cluster Properties</h3>
             </div>
             <div className="bg-base rounded-2xl border border-theme overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-theme">
                   <div className="p-5 space-y-4">
                      {renderProperty('Database Name', cluster.DBName || 'N/A')}
                      {renderProperty('Master Username', cluster.MasterUsername || 'N/A')}
                      {renderProperty('Port', cluster.Endpoint?.Port?.toString() || '5439')}
                      {renderProperty('Cluster Version', cluster.ClusterVersion || 'N/A')}
                      {renderProperty('Created At', cluster.ClusterCreateTime?.toLocaleString() || 'N/A')}
                   </div>
                   <div className="p-5 space-y-4">
                      {renderProperty('VPC ID', cluster.VpcId || 'N/A')}
                      {renderProperty('Availability Zone', cluster.AvailabilityZone || 'N/A')}
                      {renderProperty('Publicly Accessible', cluster.PubliclyAccessible ? 'Yes' : 'No')}
                      {renderProperty('Encrypted', cluster.Encrypted ? 'Yes' : 'No')}
                      {renderProperty('Identifier', cluster.ClusterIdentifier || 'N/A')}
                   </div>
                </div>
             </div>
          </section>

          {/* Networking Section */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 px-1">
                <Server size={14} className="text-red-500" />
                <h3 className="text-sm font-bold text-1">Network & Security</h3>
             </div>
             <div className="bg-base rounded-2xl border border-theme p-5 shadow-sm space-y-5">
                <div className="space-y-2">
                   <p className="text-[10px] text-4 font-bold uppercase tracking-widest">Endpoint Address</p>
                   <div className="flex items-center gap-3 p-3 bg-raised rounded-xl border border-theme font-mono text-sm group">
                      <span className="text-2 flex-1 truncate">{cluster.Endpoint?.Address || 'No Endpoint'}</span>
                      <CopyButton text={cluster.Endpoint?.Address || ''} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   {renderProperty('Subnet Group', cluster.ClusterSubnetGroupName || 'N/A')}
                   <div>
                      <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-1.5">Security Groups</p>
                      <div className="flex flex-wrap gap-2">
                         {cluster.VpcSecurityGroups?.map(sg => (
                            <span key={sg.VpcSecurityGroupId} className="px-2 py-0.5 rounded-md bg-theme text-[10px] text-2 font-mono border border-theme">
                               {sg.VpcSecurityGroupId}
                            </span>
                         )) || <span className="text-sm text-3 italic">None</span>}
                      </div>
                   </div>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  )
}
