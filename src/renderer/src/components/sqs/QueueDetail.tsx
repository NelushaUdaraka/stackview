import { useState, useEffect, useCallback } from 'react'
import {
  Trash2, RefreshCw, Send, Inbox, Settings, Info,
  AlertTriangle, Copy, Check, Loader2, Zap,
  Clock, MessageSquare, Archive, Hash, Gauge
} from 'lucide-react'
import type { QueueInfo, SQSMessage, ActiveTab } from '../../types'
import { QUEUE_ATTRIBUTE_LABELS } from '../../constants'
import MessagesPanel from './MessagesPanel'
import SendMessageModal from './SendMessageModal'
import EditAttributesModal from './EditAttributesModal'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  queue: QueueInfo
  onDeleted: () => void
  onPurged: () => void
  onRefreshAttributes: (url: string) => Promise<Record<string, string>>
}

export default function QueueDetail({ queue, onDeleted, onPurged, onRefreshAttributes }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [attributes, setAttributes] = useState<Record<string, string>>(queue.attributes ?? {})
  const [messages, setMessages] = useState<SQSMessage[]>([])
  const [loadingAttrs, setLoadingAttrs] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [copiedArn, setCopiedArn] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const isFifo = queue.name.endsWith('.fifo')

  const loadAttributes = useCallback(async () => {
    setLoadingAttrs(true)
    try {
      const attrs = await onRefreshAttributes(queue.url)
      setAttributes(attrs)
    } finally {
      setLoadingAttrs(false)
    }
  }, [queue.url, onRefreshAttributes])

  useEffect(() => {
    loadAttributes()
    setMessages([])
    setActiveTab('overview')
    setConfirmDelete(false)
    setConfirmPurge(false)
  }, [queue.url])

  // While on the Messages tab, poll attributes every 4 s so the Available /
  // In-Flight chips stay live regardless of visibility-timeout timing.
  useEffect(() => {
    if (activeTab !== 'messages') return
    const id = setInterval(() => loadAttributes(), 4000)
    return () => clearInterval(id)
  }, [activeTab, loadAttributes])

  const handleReceiveMessages = async (max: number, visibility: number, waitTime: number) => {
    setMessages([])
    setLoadingMsgs(true)
    try {
      const result = await window.electronAPI.receiveMessages(queue.url, max, visibility, waitTime)
      if (result.success && result.data) {
        setMessages(result.data)
        if (result.data.length === 0) {
          showToast('success', 'No messages available in queue')
        } else {
          // Refresh stats so in-flight count updates immediately
          loadAttributes()
        }
      } else {
        showToast('error', result.error ?? 'Failed to receive messages')
      }
    } finally {
      setLoadingMsgs(false)
    }
  }

  const handleDeleteMessage = async (msg: SQSMessage) => {
    const result = await window.electronAPI.deleteMessage(queue.url, msg.ReceiptHandle)
    if (result.success) {
      setMessages((prev) => prev.filter((m) => m.MessageId !== msg.MessageId))
      showToast('success', 'Message deleted')
      loadAttributes()
    } else {
      showToast('error', result.error ?? 'Failed to delete message')
    }
  }

  const handleDeleteAllVisible = async () => {
    let deleted = 0
    for (const msg of messages) {
      const result = await window.electronAPI.deleteMessage(queue.url, msg.ReceiptHandle)
      if (result.success) deleted++
    }
    setMessages([])
    showToast('success', `Deleted ${deleted} message${deleted !== 1 ? 's' : ''}`)
    loadAttributes()
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    const result = await window.electronAPI.deleteQueue(queue.url)
    if (result.success) onDeleted()
    else showToast('error', result.error ?? 'Failed to delete queue')
  }

  const handlePurge = async () => {
    if (!confirmPurge) {
      setConfirmPurge(true)
      setTimeout(() => setConfirmPurge(false), 4000)
      return
    }
    const result = await window.electronAPI.purgeQueue(queue.url)
    if (result.success) {
      setConfirmPurge(false)
      setMessages([])
      await loadAttributes()
      onPurged()
      showToast('success', 'Queue purged successfully')
    } else {
      showToast('error', result.error ?? 'Failed to purge queue')
    }
  }

  const copyArn = async () => {
    await navigator.clipboard.writeText(attributes.QueueArn ?? '')
    setCopiedArn(true)
    setTimeout(() => setCopiedArn(false), 2000)
  }

  const copyUrl = async () => {
    await navigator.clipboard.writeText(queue.url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const msgAvailable = parseInt(attributes.ApproximateNumberOfMessages ?? '0')
  const msgInFlight = parseInt(attributes.ApproximateNumberOfMessagesNotVisible ?? '0')
  const msgDelayed = parseInt(attributes.ApproximateNumberOfMessagesDelayed ?? '0')

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Info size={13} /> },
    { id: 'messages', label: 'Messages', icon: <Inbox size={13} /> },
    { id: 'attributes', label: 'Attributes', icon: <Settings size={13} /> }
  ]

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div
        className="px-5 pt-4 pb-0 border-b border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-1 truncate">{queue.name}</h2>
              {isFifo && <span className="badge badge-blue">FIFO</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-3 truncate max-w-[400px]">{queue.url}</span>
              <button
                onClick={copyUrl}
                className="text-4 hover:text-2 transition-colors shrink-0"
                title="Copy URL"
              >
                {copiedUrl ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <button onClick={() => setShowSendModal(true)} className="btn-primary gap-1.5 py-1.5 px-3 text-xs">
              <Send size={13} />
              Send Message
            </button>
            <button
              onClick={handlePurge}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmPurge
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                  : 'btn-ghost text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                }`}
            >
              <Zap size={13} />
              {confirmPurge ? 'Confirm Purge' : 'Purge'}
            </button>
            <button
              onClick={handleDelete}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                  : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'
                }`}
            >
              <Trash2 size={13} />
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
            <button onClick={loadAttributes} disabled={loadingAttrs} className="btn-ghost !px-2 !py-1.5">
              {loadingAttrs ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-3 mb-3">
          <StatChip icon={<MessageSquare size={12} />} label="Available" value={msgAvailable} color="emerald" />
          <StatChip icon={<Gauge size={12} />} label="In-flight" value={msgInFlight} color="amber" />
          <StatChip icon={<Clock size={12} />} label="Delayed" value={msgDelayed} color="slate" />
        </div>

        {/* Tabs */}
        <div className="flex items-center -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-300'
                  : 'border-transparent text-3 hover:text-1'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <OverviewTab
            queue={queue}
            attributes={attributes}
            isFifo={isFifo}
            copiedArn={copiedArn}
            onCopyArn={copyArn}
            onEdit={() => setShowEditModal(true)}
          />
        )}
        {activeTab === 'messages' && (
          <MessagesPanel
            queue={queue}
            messages={messages}
            loading={loadingMsgs}
            onReceive={handleReceiveMessages}
            onDeleteMessage={handleDeleteMessage}
            onDeleteAll={handleDeleteAllVisible}
            onClear={() => { setMessages([]); loadAttributes() }}
          />
        )}
        {activeTab === 'attributes' && (
          <AttributesTab
            attributes={attributes}
            onEdit={() => setShowEditModal(true)}
          />
        )}
      </div>

      {showSendModal && (
        <SendMessageModal
          queue={queue}
          onClose={() => setShowSendModal(false)}
          onSent={() => {
            setShowSendModal(false)
            showToast('success', 'Message sent successfully')
            loadAttributes()
          }}
        />
      )}
      {showEditModal && (
        <EditAttributesModal
          queue={queue}
          attributes={attributes}
          onClose={() => setShowEditModal(false)}
          onSaved={async (newAttrs) => {
            setShowEditModal(false)
            const result = await window.electronAPI.setQueueAttributes(queue.url, newAttrs)
            if (result.success) {
              showToast('success', 'Attributes updated')
              await loadAttributes()
            } else {
              showToast('error', result.error ?? 'Failed to update attributes')
            }
          }}
        />
      )}
    </div>
  )
}

/* ── Overview Tab ── */
function OverviewTab({
  queue,
  attributes,
  isFifo,
  copiedArn,
  onCopyArn,
  onEdit
}: {
  queue: QueueInfo
  attributes: Record<string, string>
  isFifo: boolean
  copiedArn: boolean
  onCopyArn: () => void
  onEdit: () => void
}) {
  const retentionSec = parseInt(attributes.MessageRetentionPeriod ?? '345600')
  const maxSizeBytes = parseInt(attributes.MaximumMessageSize ?? '262144')

  const createdAt = attributes.CreatedTimestamp
    ? new Date(parseInt(attributes.CreatedTimestamp) * 1000).toLocaleString()
    : '—'
  const modifiedAt = attributes.LastModifiedTimestamp
    ? new Date(parseInt(attributes.LastModifiedTimestamp) * 1000).toLocaleString()
    : '—'

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Identity card (spans 2 cols on xl) ── */}
        <div className="xl:col-span-2 card p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-3 uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={12} />
              Identity
            </h3>
          </div>

          {/* ARN */}
          {attributes.QueueArn && (
            <div>
              <p className="text-[10px] font-semibold text-4 uppercase tracking-wider mb-1">Queue ARN</p>
              <div
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-theme"
                style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
              >
                <span className="font-mono text-xs text-2 break-all">{attributes.QueueArn}</span>
                <button
                  onClick={onCopyArn}
                  className="btn-ghost !px-1.5 !py-1 shrink-0 text-3"
                  title="Copy ARN"
                >
                  {copiedArn ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          )}

          {/* URL */}
          <div>
            <p className="text-[10px] font-semibold text-4 uppercase tracking-wider mb-1">Queue URL</p>
            <div
              className="px-3 py-2 rounded-lg border border-theme"
              style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
            >
              <span className="font-mono text-xs text-2 break-all">{queue.url}</span>
            </div>
          </div>

          {/* Type */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-semibold text-4 uppercase tracking-wider mb-1">Type</p>
              <span className={`badge ${isFifo ? 'badge-blue' : 'badge-gray'}`}>
                {isFifo ? 'FIFO' : 'Standard'}
              </span>
            </div>
            {isFifo && (
              <div>
                <p className="text-[10px] font-semibold text-4 uppercase tracking-wider mb-1">
                  Content-Based Deduplication
                </p>
                <span
                  className={`badge ${
                    attributes.ContentBasedDeduplication === 'true' ? 'badge-green' : 'badge-gray'
                  }`}
                >
                  {attributes.ContentBasedDeduplication === 'true' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Timing card ── */}
        <div className="card p-4">
          <h3 className="text-xs font-bold text-3 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Clock size={12} />
            Timestamps
          </h3>
          <div className="space-y-3">
            <InfoItem label="Created" value={createdAt} />
            <InfoItem label="Last Modified" value={modifiedAt} />
          </div>
        </div>

        {/* ── Message config card ── */}
        <div className="xl:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-3 uppercase tracking-wider flex items-center gap-1.5">
              <Archive size={12} />
              Message Configuration
            </h3>
            <button onClick={onEdit} className="btn-ghost !px-2 !py-1 text-xs gap-1">
              <Settings size={12} />
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoItem
              label="Visibility Timeout"
              value={`${attributes.VisibilityTimeout ?? '30'}s`}
            />
            <InfoItem
              label="Delivery Delay"
              value={`${attributes.DelaySeconds ?? '0'}s`}
            />
            <InfoItem
              label="Long-Poll Wait"
              value={`${attributes.ReceiveMessageWaitTimeSeconds ?? '0'}s`}
            />
            <InfoItem
              label="Max Message Size"
              value={formatBytes(maxSizeBytes)}
            />
            <InfoItem
              label="Message Retention"
              value={`${retentionSec.toLocaleString()}s  (${(retentionSec / 86400).toFixed(1)} days)`}
              wide
            />
          </div>
        </div>

        {/* ── Message counts card ── */}
        <div className="card p-4">
          <h3 className="text-xs font-bold text-3 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <MessageSquare size={12} />
            Message Counts
          </h3>
          <div className="space-y-3">
            <CountRow
              label="Available"
              value={attributes.ApproximateNumberOfMessages ?? '0'}
              color="emerald"
            />
            <CountRow
              label="In-flight"
              value={attributes.ApproximateNumberOfMessagesNotVisible ?? '0'}
              color="amber"
            />
            <CountRow
              label="Delayed"
              value={attributes.ApproximateNumberOfMessagesDelayed ?? '0'}
              color="slate"
            />
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── Attributes Tab ── */
function AttributesTab({
  attributes,
  onEdit
}: {
  attributes: Record<string, string>
  onEdit: () => void
}) {
  return (
    <div className="p-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-1">Raw Queue Attributes</h3>
        <button onClick={onEdit} className="btn-secondary text-xs gap-1.5">
          <Settings size={13} />
          Edit Attributes
        </button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
              <th className="text-left px-4 py-2.5 text-2 font-semibold w-2/5">Attribute</th>
              <th className="text-left px-4 py-2.5 text-2 font-semibold w-3/5">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(attributes).map(([k, v], i) => (
              <tr
                key={k}
                className="border-b border-theme last:border-0"
                style={i % 2 ? { backgroundColor: 'rgb(var(--bg-raised) / 0.5)' } : undefined}
              >
                <td className="px-4 py-2.5 text-2">{QUEUE_ATTRIBUTE_LABELS[k] ?? k}</td>
                <td className="px-4 py-2.5 text-1 font-mono break-all">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Helpers ── */
function StatChip({
  icon, label, value, color
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'emerald' | 'amber' | 'slate'
}) {
  const cls = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20',
    slate: 'border-theme text-2'
  }
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${cls[color]}`}
      style={color === 'slate' ? { backgroundColor: 'rgb(var(--bg-raised))' } : undefined}
    >
      {icon}
      <span className="font-bold font-mono text-sm">{value.toLocaleString()}</span>
      <span className="opacity-70">{label}</span>
    </div>
  )
}

function InfoItem({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-[10px] font-semibold text-4 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-1 font-medium">{value}</p>
    </div>
  )
}

function CountRow({ label, value, color }: { label: string; value: string; color: string }) {
  const dot = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-400'
  }[color] ?? 'bg-slate-400'
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
        <span className="text-xs text-2">{label}</span>
      </div>
      <span className="font-mono font-bold text-sm text-1">{parseInt(value).toLocaleString()}</span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}
