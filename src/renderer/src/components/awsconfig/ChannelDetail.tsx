import { useState, useCallback } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import type { ConfigDeliveryChannel } from '../../types'

interface Props {
  channel: ConfigDeliveryChannel
  onDeleted: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-mono break-all ${!value ? 'text-4' : 'text-2'}`}>{value || '—'}</p>
    </div>
  )
}

export default function ChannelDetail({ channel, onDeleted, showToast }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const res = await window.electronAPI.configDeleteChannel(channel.name)
    if (res.success) { onDeleted() }
    else { showToast('error', res.error ?? 'Delete failed'); setConfirmDelete(false) }
    setDeleting(false)
  }, [confirmDelete, channel.name, onDeleted, showToast])

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-0.5">Delivery Channel</p>
          <h2 className="text-sm font-semibold text-1">{channel.name}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
              ${confirmDelete ? 'bg-red-600 hover:bg-red-500 text-white' : 'btn-ghost text-red-400 hover:text-red-300'}`}
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {confirmDelete ? 'Confirm' : 'Delete'}
          </button>
          {confirmDelete && !deleting && (
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost text-xs px-2 py-1.5">Cancel</button>
          )}
        </div>
      </div>

      <div className="card p-4 border-theme grid grid-cols-2 gap-4">
        <InfoRow label="S3 Bucket" value={channel.s3BucketName} />
        <InfoRow label="S3 Key Prefix" value={channel.s3KeyPrefix} />
        <InfoRow label="SNS Topic ARN" value={channel.snsTopicARN} />
        <InfoRow label="Delivery Frequency" value={channel.deliveryFrequency} />
        <InfoRow label="Last Successful Delivery" value={channel.lastSuccessfulTime ? new Date(channel.lastSuccessfulTime).toLocaleString() : undefined} />
        <InfoRow label="Last Attempt" value={channel.lastAttemptTime ? new Date(channel.lastAttemptTime).toLocaleString() : undefined} />
      </div>
    </div>
  )
}
