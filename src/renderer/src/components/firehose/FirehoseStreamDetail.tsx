import { useState } from 'react'
import { Trash2, Loader2, Workflow, Database, Play, Settings, Send, HardDrive } from 'lucide-react'
import type { FirehoseDeliveryStream } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  stream: FirehoseDeliveryStream
  onRefresh: () => void
  onDeleted: () => void
}

type Tab = 'overview' | 'test'

export default function FirehoseStreamDetail({ stream, onRefresh, onDeleted }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Put Record state
  const [recordData, setRecordData] = useState('{\n  "ticker": "AAPL",\n  "price": 150.25\n}')
  const [sending, setSending] = useState(false)
  
  const { showToast } = useToastContext()

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.firehoseDeleteDeliveryStream(stream.DeliveryStreamName)
    setDeleting(false)
    if (res.success) onDeleted()
    else showToast('error', res.error ?? 'Failed to delete stream')
  }

  const handleSendRecord = async () => {
    try {
      if (recordData.trim()) JSON.parse(recordData) // Pre-validation check
    } catch {
      showToast('error', 'Record payload must be a valid JSON object/string.')
      return
    }

    setSending(true)
    const res = await window.electronAPI.firehosePutRecord(stream.DeliveryStreamName, recordData.trim())
    if (res.success && res.data) {
      showToast('success', `Record Sent: ${res.data}`)
      // Optional: auto-refresh to update timestamps
      onRefresh()
    } else {
      showToast('error', res.error || 'Failed to send record')
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full relative bg-app animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-6 border-b border-theme bg-base shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
             <div className="p-3 rounded-2xl border bg-orange-500/10 border-orange-500/20 text-orange-500">
               <Workflow size={24} />
             </div>
             <div>
               <h1 className="text-xl font-bold text-1 mb-1 truncate tracking-tight">{stream.DeliveryStreamName}</h1>
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider
                   bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   {stream.DeliveryStreamStatus}
                 </div>
                 <span className="text-[11px] text-4 font-mono select-all truncate max-w-[400px]">
                   {stream.DeliveryStreamARN}
                 </span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-colors
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 shadow-sm shadow-red-500/5'
                  : 'btn-danger bg-red-500/5 hover:bg-red-500/10 border-red-500/20'
                }`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete Stream'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 pt-6 -mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-semibold transition-colors
              ${activeTab === 'overview' ? 'border-orange-500 text-orange-500' : 'border-transparent text-3 hover:text-2'}`}
          >
            <Settings size={13} />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-semibold transition-colors
              ${activeTab === 'test' ? 'border-orange-500 text-orange-500' : 'border-transparent text-3 hover:text-2'}`}
          >
            <Play size={13} />
            Test Events
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-app">
         <div className="w-full">

           {activeTab === 'overview' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <div className="bg-base rounded-2xl border border-theme p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <Database size={64} />
                  </div>
                  <h3 className="text-xs font-bold text-2 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Settings size={14} className="text-orange-500" />
                     Delivery Configuration
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                     <div>
                       <label className="text-[10px] font-bold text-4 uppercase tracking-widest block mb-1">Creation Date</label>
                       <div className="text-sm font-medium text-1">
                         {stream.CreateTimestamp ? new Date(stream.CreateTimestamp).toLocaleString() : '-'}
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-4 uppercase tracking-widest block mb-1">Last Updated</label>
                       <div className="text-sm font-medium text-1">
                         {stream.LastUpdateTimestamp ? new Date(stream.LastUpdateTimestamp).toLocaleString() : '-'}
                       </div>
                     </div>
                  </div>

                  {stream.Destinations && stream.Destinations.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-theme">
                       <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3">S3 Destinations</h4>
                       <div className="space-y-3">
                         {stream.Destinations.map((dest: any, idx: number) => {
                           const s3Dest = dest.S3DestinationDescription || dest.ExtendedS3DestinationDescription
                           return (
                             <div key={dest.DestinationId || idx} className="p-4 rounded-xl bg-raised/30 border border-theme flex flex-col gap-2">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <HardDrive size={14} className="text-orange-500" />
                                    <span className="text-xs font-bold text-1">{dest.DestinationId}</span>
                                  </div>
                               </div>
                               {s3Dest && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div className="p-2.5 rounded-lg bg-base border border-theme/50">
                                       <span className="block text-[9px] text-4 font-bold uppercase mb-0.5">Bucket ARN</span>
                                       <span className="font-mono text-[11px] text-2 break-all">{s3Dest.BucketARN}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-base border border-theme/50">
                                       <span className="block text-[9px] text-4 font-bold uppercase mb-0.5">Role ARN</span>
                                       <span className="font-mono text-[11px] text-2 break-all">{s3Dest.RoleARN}</span>
                                    </div>
                                 </div>
                               )}
                             </div>
                           )
                         })}
                       </div>
                    </div>
                  )}
               </div>
             </div>
           )}

           {activeTab === 'test' && (
             <div className="space-y-4 animate-in fade-in duration-300">
               <div className="bg-base rounded-2xl border border-theme p-6 shadow-sm">
                 <h3 className="text-xs font-bold text-2 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Send size={14} className="text-orange-500" />
                   Put Record
                 </h3>
                 <p className="text-xs text-3 mb-4 leading-relaxed max-w-2xl">
                   Simulate data ingestion by putting a direct record into this Firehose stream. Firehose will apply its buffering rules before emitting it to the destination mapping.
                 </p>

                 <div className="mb-4">
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-[10px] font-bold text-4 uppercase tracking-widest ml-1">Record Data (JSON)</label>
                     <button
                       onClick={() => {
                         try {
                           const formatted = JSON.stringify(JSON.parse(recordData), null, 2)
                           setRecordData(formatted)
                         } catch {
                           showToast('error', 'Invalid JSON - Cannot format')
                         }
                       }}
                       className="text-[10px] text-orange-500 hover:text-orange-400 font-bold uppercase transition-colors"
                     >
                       Format JSON
                     </button>
                   </div>
                   <textarea
                     value={recordData}
                     onChange={e => setRecordData(e.target.value)}
                     className="input-base w-full h-48 font-mono text-xs leading-relaxed resize-y"
                     spellCheck={false}
                   />
                 </div>

                 <div className="flex justify-end">
                    <button
                      onClick={handleSendRecord}
                      disabled={sending || !recordData.trim()}
                      className="btn-primary px-6 py-2 bg-orange-600 hover:bg-orange-500 font-bold text-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                      Send Record
                    </button>
                 </div>
               </div>
             </div>
           )}

         </div>
      </div>
    </div>
  )
}
