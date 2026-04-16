import { useState } from 'react'
import { X, Activity, Info, Loader2, Database } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  onClose: () => void
  onCreated: () => void
  endpoint: string
  region: string
}

export default function CreateKinesisStreamModal({ onClose, onCreated, endpoint, region }: Props) {
  const { showToast } = useToastContext()
  const [streamName, setStreamName] = useState('')
  const [shardCount, setShardCount] = useState(1)
  const [streamMode, setStreamMode] = useState<'PROVISIONED' | 'ON_DEMAND'>('PROVISIONED')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!streamName) return

    setLoading(true)
    const res = await window.electronAPI.kinesisCreateStream(endpoint, region, {
      StreamName: streamName,
      ShardCount: streamMode === 'PROVISIONED' ? shardCount : undefined,
      StreamModeDetails: {
        StreamMode: streamMode
      }
    })

    if (res.success) {
      showToast('success', `Stream ${streamName} created successfully`)
      onCreated()
      onClose()
    } else {
      showToast('error', res.error || 'Failed to create stream')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-base rounded-3xl border border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-theme flex items-center justify-between bg-raised/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
               <Activity size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-1 tracking-tight">Create Data Stream</h2>
              <p className="text-[10px] text-3 font-bold uppercase tracking-widest">Kinesis Data Streams</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-theme rounded-xl transition-colors text-3 hover:text-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-2 uppercase tracking-widest mb-2">Stream Name</label>
              <input
                autoFocus
                required
                type="text"
                value={streamName}
                onChange={e => setStreamName(e.target.value)}
                placeholder="e.g. user-events-stream"
                className="input-base w-full py-3 px-4 text-sm font-bold placeholder:font-normal"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-2 uppercase tracking-widest">Capacity Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStreamMode('PROVISIONED')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center
                    ${streamMode === 'PROVISIONED' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-sm shadow-amber-500/10' 
                      : 'bg-raised/50 border-theme text-3 hover:border-theme-hover hover:bg-raised'}`}
                >
                  <Database size={18} />
                  <span className="text-xs font-bold">Provisioned</span>
                  <span className="text-[9px] opacity-60 font-medium">Specify number of shards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStreamMode('ON_DEMAND')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center
                    ${streamMode === 'ON_DEMAND' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-sm shadow-amber-500/10' 
                      : 'bg-raised/50 border-theme text-3 hover:border-theme-hover hover:bg-raised'}`}
                >
                  <Activity size={18} />
                  <span className="text-xs font-bold">On-Demand</span>
                  <span className="text-[9px] opacity-60 font-medium">Auto-scaling capacity</span>
                </button>
              </div>
            </div>

            {streamMode === 'PROVISIONED' ? (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-black text-2 uppercase tracking-widest mb-2">Provisioned Shards</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={shardCount}
                    onChange={e => setShardCount(parseInt(e.target.value) || 1)}
                    className="input-base w-32 py-3 px-4 text-sm font-bold"
                  />
                  <div className="flex-1 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                    <Info size={16} className="text-amber-500 shrink-0" />
                    <p className="text-[11px] text-2 leading-tight">1 MiB/s ingress and 2 MiB/s egress capacity per shard.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3 animate-in slide-in-from-top-2 duration-300">
                <Activity size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-500">Auto-Scaling Capacity</p>
                  <p className="text-[11px] text-3 leading-relaxed">LocalStack will automatically manage shards based on throughput. No shard count required.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold text-2 hover:bg-raised rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !streamName}
              className="flex items-center gap-2 px-8 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Stream'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
