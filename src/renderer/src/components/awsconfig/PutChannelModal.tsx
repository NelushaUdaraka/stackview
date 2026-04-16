import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface Props {
  onSaved: () => void
  onClose: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

const FREQUENCIES = ['One_Hour', 'Three_Hours', 'Six_Hours', 'Twelve_Hours', 'TwentyFour_Hours']

export default function PutChannelModal({ onSaved, onClose, showToast }: Props) {
  const [name, setName] = useState('default')
  const [s3Bucket, setS3Bucket] = useState('')
  const [s3Prefix, setS3Prefix] = useState('')
  const [snsTopic, setSnsTopic] = useState('')
  const [frequency, setFrequency] = useState('TwentyFour_Hours')
  const [loading, setLoading] = useState(false)
  const [touchedBucket, setTouchedBucket] = useState(false)

  const isValid = name.trim().length > 0 && s3Bucket.trim().length > 0

  const handleSave = async () => {
    setLoading(true)
    const res = await window.electronAPI.configPutChannel(
      name.trim(), s3Bucket.trim(),
      s3Prefix.trim() || undefined,
      snsTopic.trim() || undefined,
      frequency
    )
    if (res.success) { onSaved() }
    else { showToast('error', res.error ?? 'Save failed') }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-base border border-theme rounded-xl shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h2 className="text-sm font-semibold text-1">Add Delivery Channel</h2>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">Channel Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-base w-full text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">S3 Bucket Name <span className="text-red-400">*</span></label>
            <input type="text" value={s3Bucket} onChange={e => setS3Bucket(e.target.value)} onBlur={() => setTouchedBucket(true)} placeholder="my-config-bucket" className={`input-base w-full text-sm font-mono ${touchedBucket && s3Bucket.trim() === '' ? 'border-red-500/50' : ''}`} />
            {touchedBucket && s3Bucket.trim() === '' && <p className="text-[10px] text-red-400 mt-1">S3 bucket is required</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">S3 Key Prefix</label>
            <input type="text" value={s3Prefix} onChange={e => setS3Prefix(e.target.value)} placeholder="config/" className="input-base w-full text-sm font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">SNS Topic ARN</label>
            <input type="text" value={snsTopic} onChange={e => setSnsTopic(e.target.value)} placeholder="arn:aws:sns:us-east-1:000000000000:config-topic" className="input-base w-full text-sm font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-4 uppercase tracking-wider block mb-1">Delivery Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)} className="input-base w-full text-sm">
              {FREQUENCIES.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading || !isValid}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 size={13} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  )
}
