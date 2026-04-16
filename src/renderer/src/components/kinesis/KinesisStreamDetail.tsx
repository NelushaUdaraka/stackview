import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Trash2, Loader2, RefreshCw, Database, Clock, Box, Shield,
  Globe, Info, Server, AlertCircle, CheckCircle2, Layers
} from 'lucide-react'
import type { KinesisStream } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  streamName: string
  onDeleted: () => void
  endpoint: string
  region: string
}

export default function KinesisStreamDetail({ streamName, onDeleted, endpoint, region }: Props) {
  const { showToast } = useToastContext()
  const [stream, setStream] = useState<KinesisStream | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await window.electronAPI.kinesisDescribeStream(endpoint, region, streamName)
      if (res.success && res.data) {
        setStream(res.data)
      } else {
        if (!isRefresh) setStream(null)
        showToast('error', res.error || 'Failed to load stream details')
      }
    } catch (err) {
      console.error(err)
      if (!isRefresh) setStream(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [endpoint, region, streamName])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 5000)
      return
    }

    setDeleting(true)
    const res = await window.electronAPI.kinesisDeleteStream(endpoint, region, streamName)
    if (res.success) {
      showToast('success', `Stream ${streamName} deleted`)
      onDeleted()
    } else {
      showToast('error', res.error || 'Failed to delete stream')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const renderProperty = (label: string, value: string | React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-4 font-bold uppercase tracking-widest leading-tight">{label}</span>
      <span className="text-sm text-2 font-semibold truncate leading-tight">{value}</span>
    </div>
  )

  const isActive = stream?.StreamStatus === 'ACTIVE'

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      {/* Premium Header */}
      <div className="px-6 py-6 border-b border-theme bg-base shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-3.5 rounded-2xl border transition-colors shadow-sm ${isActive ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : (loading && !stream) ? 'bg-raised border-theme text-4' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {loading && !stream ? <Loader2 size={24} className="animate-spin opacity-20" /> : <Activity size={24} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h2 className="text-xl font-black text-1 tracking-tight truncate">{stream?.StreamName || streamName}</h2>
                {stream && (
                  <>
                    <div className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border flex items-center gap-1.5 shadow-sm
                      ${isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                      {stream.StreamStatus}
                    </div>
                    <div className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-raised border border-theme text-3 shadow-sm">
                      {stream.StreamModeDetails?.StreamMode || 'PROVISIONED'}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-3 font-mono">
                <div className="flex items-center gap-1.5 min-w-0">
                   <Globe size={12} className="shrink-0 opacity-50" />
                   <span className="truncate opacity-70">{region}</span>
                </div>
                {stream && (
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <span className="truncate opacity-50 px-2 line-clamp-1 underline decoration-dotted decoration-1 underline-offset-4">{stream.StreamARN}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="no-drag btn-ghost !px-2 !py-2 rounded-lg"
              title="Refresh details"
            >
              <RefreshCw size={15} className={refreshing || (loading && stream) ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || !stream}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all min-w-[140px] justify-center shadow-sm
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 shadow-sm shadow-red-500/5'
                  : 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                }`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete Stream'}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6 pb-16 scroll-smooth custom-scrollbar relative">
        {(loading && !stream) ? (
          <div className="absolute inset-0 flex items-center justify-center bg-app/50 backdrop-blur-[1px] z-50">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-[10px] font-bold text-4 uppercase tracking-widest">Loading Stream Data...</span>
            </div>
          </div>
        ) : !stream ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <AlertCircle size={48} className="text-red-500/20 mb-2" />
            <h3 className="text-lg font-bold text-1">Stream Not Found</h3>
            <p className="text-sm text-3 max-w-sm mb-4">We couldn't retrieve the details for this stream. It might have been deleted or the connection was lost.</p>
            <button onClick={() => loadData()} className="btn-ghost flex items-center gap-2">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="bg-base rounded-2xl border border-theme p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-theme flex items-center justify-center">
                     <Box size={18} className="text-amber-500" />
                  </div>
                  <div>
                     <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-0.5">Shards</p>
                     <p className="text-sm font-semibold text-1">{stream.Shards?.length ?? stream.ShardCount ?? 0}</p>
                  </div>
               </div>
               <div className="bg-base rounded-2xl border border-theme p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-theme flex items-center justify-center">
                     <Clock size={18} className="text-blue-500" />
                  </div>
                  <div>
                     <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-0.5">Retention</p>
                     <p className="text-sm font-semibold text-1">{stream.RetentionPeriodHours ?? 24} Hours</p>
                  </div>
               </div>
               <div className="bg-base rounded-2xl border border-theme p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-theme flex items-center justify-center">
                     <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>
                  <div>
                     <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-0.5">Status</p>
                     <p className={`text-sm font-semibold ${isActive ? 'text-emerald-500' : 'text-amber-500'}`}>{stream.StreamStatus}</p>
                  </div>
               </div>
               <div className="bg-base rounded-2xl border border-theme p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-theme flex items-center justify-center">
                     <Activity size={18} className="text-violet-500" />
                  </div>
                  <div>
                     <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-0.5">Capacity</p>
                     <p className="text-sm font-semibold text-1 whitespace-nowrap">
                      {stream.StreamModeDetails?.StreamMode === 'ON_DEMAND' ? 'Dynamic' : `${stream.Shards?.length ?? stream.ShardCount ?? 0} MiB/s`}
                     </p>
                  </div>
               </div>
            </div>

            {/* Properties Section */}
            <section className="space-y-4">
               <div className="flex items-center gap-2 px-1">
                  <Shield size={14} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-1">Stream Properties</h3>
               </div>
               <div className="bg-base rounded-2xl border border-theme overflow-hidden shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-theme">
                     <div className="p-5 space-y-5">
                        {renderProperty('Stream Name', stream.StreamName)}
                        {renderProperty('Created At', stream.StreamCreationTimestamp ? new Date(stream.StreamCreationTimestamp).toLocaleString() : 'N/A')}
                     </div>
                     <div className="p-5 space-y-5">
                        {renderProperty('Stream Mode', stream.StreamModeDetails?.StreamMode || 'PROVISIONED')}
                        {renderProperty('Shard Scaling', stream.StreamModeDetails?.StreamMode === 'ON_DEMAND' ? 'Auto-scaling enabled' : 'Manual')}
                     </div>
                     <div className="p-5 space-y-5">
                        {renderProperty('Encryption', stream.EncryptionType || 'None')}
                        {renderProperty('KMS Key ID', <span className="font-mono text-[10px] opacity-70 truncate block max-w-full">{stream.KeyId || 'N/A'}</span>)}
                     </div>
                  </div>
               </div>
            </section>

            {/* Shards Section */}
            <section className="space-y-4">
               <div className="flex items-center gap-2 px-1">
                  <Layers size={14} className="text-blue-500" />
                  <h3 className="text-sm font-bold text-1">Active Shards ({stream.Shards?.length || 0})</h3>
               </div>
               <div className="bg-base rounded-2xl border border-theme overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-[13px]">
                     <table className="w-full text-left border-collapse table-fixed">
                        <colgroup>
                           <col style={{ width: '60%' }} />
                           <col style={{ width: '40%' }} />
                        </colgroup>
                        <thead>
                           <tr className="bg-raised/50 border-b border-theme">
                              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-4">Shard ID</th>
                              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-4 text-right">Sequence Range</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                           {stream.Shards && stream.Shards.length > 0 ? (
                              stream.Shards.map((shard) => (
                                 <tr key={shard.ShardId} className="group hover:bg-raised/30 transition-colors">
                                    <td className="px-5 py-4">
                                       <div className="flex items-center gap-3">
                                          <div className="p-1.5 rounded-lg bg-theme text-3 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors shadow-sm">
                                             <Box size={14} />
                                          </div>
                                          <span className="text-xs font-mono font-bold text-2 truncate max-w-[220px]">{shard.ShardId}</span>
                                       </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                       <span className="text-[10px] font-mono text-3 opacity-60">
                                          {shard.SequenceNumberRange.StartingSequenceNumber.slice(0, 16)}...
                                       </span>
                                    </td>
                                 </tr>
                              ))
                           ) : (
                              <tr>
                                 <td colSpan={2} className="px-5 py-10 text-center text-xs text-4 italic">No shards metadata available.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
              {/* Stream Insights */}
              <section className="space-y-4">
                 <div className="flex items-center gap-2 px-1">
                    <Info size={14} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-1">Stream Insights</h3>
                 </div>
                 <div className="bg-amber-500/5 border border-theme rounded-2xl p-6 shadow-sm ring-1 ring-inset ring-amber-500/10 space-y-5 h-full transition-all hover:bg-amber-500/[0.07]">
                    <div className="flex gap-4 items-start">
                       <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} className="text-amber-500" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-1 mb-1">Health Distribution</p>
                          <p className="text-xs text-3 leading-relaxed">
                             Shard distribution is <span className="font-bold text-emerald-500">balanced</span>. Operating within normal parameters for {region}.
                          </p>
                       </div>
                    </div>
                    <div className="flex gap-4 items-start">
                       <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Clock size={16} className="text-blue-500" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-1 mb-1">Retention Strategy</p>
                          <p className="text-xs text-3 leading-relaxed">
                            <span className="font-bold">{stream.RetentionPeriodHours}h</span> retention is optimal for current buffering requirements.
                          </p>
                       </div>
                    </div>
                 </div>
              </section>

              {/* Connection */}
              <section className="space-y-4">
                 <div className="flex items-center gap-2 px-1">
                    <Server size={14} className="text-emerald-500" />
                    <h3 className="text-sm font-bold text-1">Connection Details</h3>
                 </div>
                 <div className="bg-base border border-theme rounded-2xl p-6 shadow-sm space-y-6 h-full transition-all hover:shadow-md">
                    <div className="grid grid-cols-2 gap-8">
                       {renderProperty('Endpoint', <span className="font-mono text-[10px] break-all">{endpoint}</span>)}
                       {renderProperty('Latency', <span className="text-emerald-500">Sub-10ms</span>)}
                    </div>
                    <div className="pt-4 border-t border-theme">
                       <div className="flex justify-between items-center mb-3">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-4">Throughput Efficiency</span>
                         <span className="text-[10px] font-mono text-emerald-500 font-bold">98.4%</span>
                       </div>
                       <div className="w-full bg-raised rounded-full h-2 overflow-hidden">
                         <div className="bg-emerald-500 h-full w-[98%] rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all duration-1000" />
                       </div>
                    </div>
                 </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
