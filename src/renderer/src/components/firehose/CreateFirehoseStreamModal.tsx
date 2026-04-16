import { useState } from 'react'
import { X, Loader2, Flame, HardDrive } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateFirehoseStreamModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [bucketArn, setBucketArn] = useState('')
  const [roleArn, setRoleArn] = useState('arn:aws:iam::000000000000:role/firehose_role')
  
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { setError('Stream name is required'); return }
    if (!bucketArn.trim()) { setError('Destination S3 Bucket ARN is required'); return }
    if (!roleArn.trim()) { setError('IAM Role ARN is required'); return }

    setSaving(true)
    setError('')
    try {
      const res = await window.electronAPI.firehoseCreateDeliveryStream(name.trim(), bucketArn.trim(), roleArn.trim())
      if (res.success) {
        onCreated()
      } else {
        setError(res.error || 'Failed to create stream')
      }
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl bg-base flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme bg-base shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-500/15 border border-orange-500/20">
               <Flame size={16} className="text-orange-500" />
             </div>
             <div>
               <h2 className="text-sm font-bold text-1">Create Delivery Stream</h2>
               <p className="text-[10px] text-3">Configure source to S3 destination</p>
             </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg text-3 hover:text-1"><X size={16} /></button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-2 uppercase tracking-wide ml-1">Delivery Stream Name *</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="input-base w-full" 
              placeholder="e.g. my-s3-stream" 
              autoFocus
            />
            <p className="text-[10px] text-4 ml-1">Must be unique within region.</p>
          </div>

          <div className="pt-2 border-t border-theme/50 relative">
             <div className="absolute -top-3 left-4 bg-base px-2 text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1.5 border border-theme rounded-md pb-[1px] pt-[2px]">
               <HardDrive size={10} /> S3 Destination
             </div>
             <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-2 uppercase tracking-wide ml-1">Bucket ARN *</label>
                  <input 
                    value={bucketArn} 
                    onChange={e => setBucketArn(e.target.value)} 
                    className="input-base w-full font-mono text-sm" 
                    placeholder="arn:aws:s3:::my-bucket" 
                  />
                  <p className="text-[10px] text-4 ml-1">Format: <span className="font-mono text-3">arn:aws:s3:::bucket-name</span></p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-2 uppercase tracking-wide ml-1">IAM Role ARN *</label>
                  <input 
                    value={roleArn} 
                    onChange={e => setRoleArn(e.target.value)} 
                    className="input-base w-full font-mono text-sm" 
                  />
                  <p className="text-[10px] text-4 ml-1">Role permitting Firehose to write to S3.</p>
                </div>
             </div>
          </div>

          {error && (
            <div className="p-3 text-[11px] font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-theme bg-raised/30 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="btn-ghost text-sm font-semibold hover:bg-raised">Cancel</button>
           <button onClick={handleSave} disabled={saving} className="btn-primary px-5 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl flex items-center gap-2">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Flame size={15} />}
              {saving ? 'Creating...' : 'Create Stream'}
           </button>
        </div>

      </div>
    </div>
  )
}
