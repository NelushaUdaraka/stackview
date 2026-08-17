import { useState } from 'react'
import { Trash2, Send, Inbox, Settings, Info, Zap, MessageSquare, RefreshCw } from 'lucide-react'
import type { QueueInfo, ActiveTab, SQSMessage } from '../../types'
import { QUEUE_ATTRIBUTE_LABELS } from '../../constants'
import MessagesPanel from './MessagesPanel'
import SendMessageModal from './SendMessageModal'
import EditAttributesModal from './EditAttributesModal'
import { useToastContext } from '../../contexts/ToastContext'
import {
  DetailHeader, SubviewTabs, FieldGrid, DataTable, ConfirmDialog, formatBytes,
  type Subview, type FieldGroup, type Column,
} from '../common/ui'

interface Props {
  queue: QueueInfo
  attributes: Record<string, string>
  loadingAttributes: boolean
  onReloadAttributes: () => Promise<void>
  onDeleted: () => void
  onPurged: () => void
}

const VIEWS: Subview<ActiveTab>[] = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'messages', label: 'Messages', icon: Inbox },
  { id: 'attributes', label: 'Attributes', icon: Settings },
]

export default function QueueDetail({
  queue,
  attributes,
  loadingAttributes,
  onReloadAttributes,
  onDeleted,
  onPurged,
}: Props) {
  const { showToast } = useToastContext()
  const [view, setView] = useState<ActiveTab>('overview')
  const [messages, setMessages] = useState<SQSMessage[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [confirm, setConfirm] = useState<'delete' | 'purge' | null>(null)
  const [busy, setBusy] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const isFifo = queue.name.endsWith('.fifo')

  const handleReceiveMessages = async (max: number, visibility: number, waitTime: number) => {
    setMessages([])
    setLoadingMsgs(true)
    try {
      const result = await window.electronAPI.receiveMessages(queue.url, max, visibility, waitTime)
      if (result.success && result.data) {
        setMessages(result.data)
        if (result.data.length === 0) showToast('success', 'No messages available in queue')
        else await onReloadAttributes()
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
      setMessages(prev => prev.filter(m => m.MessageId !== msg.MessageId))
      showToast('success', 'Message deleted')
      await onReloadAttributes()
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
    await onReloadAttributes()
  }

  const runDelete = async () => {
    setBusy(true)
    try {
      const result = await window.electronAPI.deleteQueue(queue.url)
      if (result.success) {
        setConfirm(null)
        onDeleted()
      } else {
        showToast('error', result.error ?? 'Failed to delete queue')
      }
    } finally {
      setBusy(false)
    }
  }

  const runPurge = async () => {
    setBusy(true)
    try {
      const result = await window.electronAPI.purgeQueue(queue.url)
      if (result.success) {
        setConfirm(null)
        setMessages([])
        await onReloadAttributes()
        onPurged()
        showToast('success', 'Queue purged')
      } else {
        showToast('error', result.error ?? 'Failed to purge queue')
      }
    } finally {
      setBusy(false)
    }
  }

  const available = parseInt(attributes.ApproximateNumberOfMessages ?? '0')
  const inFlight = parseInt(attributes.ApproximateNumberOfMessagesNotVisible ?? '0')
  const retentionSec = parseInt(attributes.MessageRetentionPeriod ?? '345600')

  const stamp = (raw?: string) =>
    raw ? new Date(parseInt(raw) * 1000).toLocaleString() : '—'

  const fieldGroups: FieldGroup[] = [
    {
      title: 'IDENTITY',
      fields: [
        { key: 'NAME', value: queue.name },
        { key: 'TYPE', value: isFifo ? 'FIFO' : 'Standard', color: 'rgb(var(--accent))' },
        {
          key: 'CONTENT-BASED DEDUP',
          value: isFifo ? (attributes.ContentBasedDeduplication === 'true' ? 'enabled' : 'disabled') : '—',
          color:
            isFifo && attributes.ContentBasedDeduplication === 'true'
              ? 'rgb(var(--ok))'
              : 'rgb(var(--text-2))',
        },
        { key: 'QUEUE URL', value: queue.url, full: true, wrap: true, color: 'rgb(var(--text-2))' },
        ...(attributes.QueueArn
          ? [{ key: 'ARN', value: attributes.QueueArn, full: true, wrap: true, color: 'rgb(var(--text-2))' }]
          : []),
      ],
    },
    {
      title: 'DELIVERY',
      fields: [
        { key: 'VISIBILITY TIMEOUT', value: `${attributes.VisibilityTimeout ?? '30'}s` },
        { key: 'DELIVERY DELAY', value: `${attributes.DelaySeconds ?? '0'}s` },
        { key: 'LONG-POLL WAIT', value: `${attributes.ReceiveMessageWaitTimeSeconds ?? '0'}s` },
        { key: 'MAX MESSAGE SIZE', value: formatBytes(parseInt(attributes.MaximumMessageSize ?? '262144')) },
        {
          key: 'MESSAGE RETENTION',
          value: `${(retentionSec / 86400).toFixed(1)} days`,
        },
        {
          key: 'REDRIVE POLICY',
          value: attributes.RedrivePolicy ? 'configured' : 'none',
          color: attributes.RedrivePolicy ? 'rgb(var(--accent))' : 'rgb(var(--text-2))',
        },
      ],
    },
    {
      title: 'COUNTS',
      fields: [
        { key: 'AVAILABLE', value: available.toLocaleString(), color: 'rgb(var(--ok))' },
        { key: 'IN FLIGHT', value: inFlight.toLocaleString(), color: 'rgb(var(--accent))' },
        {
          key: 'DELAYED',
          value: parseInt(attributes.ApproximateNumberOfMessagesDelayed ?? '0').toLocaleString(),
        },
      ],
    },
    {
      title: 'TIMESTAMPS',
      fields: [
        { key: 'CREATED', value: stamp(attributes.CreatedTimestamp), color: 'rgb(var(--text-2))' },
        { key: 'LAST MODIFIED', value: stamp(attributes.LastModifiedTimestamp), color: 'rgb(var(--text-2))' },
      ],
    },
  ]

  const attrRows = Object.entries(attributes).map(([key, value]) => ({ key, value }))
  const attrColumns: Column<{ key: string; value: string }>[] = [
    {
      key: 'attribute',
      label: 'ATTRIBUTE',
      width: '280px',
      sortable: true,
      value: r => QUEUE_ATTRIBUTE_LABELS[r.key] ?? r.key,
      weight: 600,
      color: () => 'rgb(var(--text-1))',
    },
    { key: 'value', label: 'VALUE', mono: true, value: r => r.value },
  ]

  return (
    <>
      <DetailHeader
        icon={MessageSquare}
        iconColor="#0ea5e9"
        title={queue.name}
        badge={isFifo ? 'FIFO' : 'STANDARD'}
        meta={queue.url}
        actions={
          <>
            <button onClick={onReloadAttributes} disabled={loadingAttributes} className="btn-icon" title="Reload">
              <RefreshCw size={13} className={loadingAttributes ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setConfirm('purge')} className="btn-secondary">
              <Zap size={12} />
              Purge
            </button>
            <button onClick={() => setConfirm('delete')} className="btn-danger">
              <Trash2 size={12} />
              Delete
            </button>
            <button onClick={() => setShowSendModal(true)} className="btn-primary">
              <Send size={12} />
              Send Message
            </button>
          </>
        }
      >
        <SubviewTabs views={VIEWS} active={view} onChange={setView} />
      </DetailHeader>

      {view === 'overview' && <FieldGrid groups={fieldGroups} />}

      {view === 'messages' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <MessagesPanel
            queue={queue}
            messages={messages}
            loading={loadingMsgs}
            onReceive={handleReceiveMessages}
            onDeleteMessage={handleDeleteMessage}
            onDeleteAll={handleDeleteAllVisible}
            onClear={async () => {
              setMessages([])
              await onReloadAttributes()
            }}
          />
        </div>
      )}

      {view === 'attributes' && (
        <DataTable
          columns={attrColumns}
          rows={attrRows}
          rowId={r => r.key}
          emptyIcon={Settings}
          emptyTitle="No attributes loaded"
          emptyHint="Reload to fetch this queue's attributes."
          toolbar={
            <div
              className="shrink-0 flex items-center justify-end px-5 py-2 border-b border-theme"
              style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.35)' }}
            >
              <button onClick={() => setShowEditModal(true)} className="chip">
                <Settings size={11} />
                Edit Attributes
              </button>
            </div>
          }
        />
      )}

      {confirm === 'delete' && (
        <ConfirmDialog
          title="Delete queue?"
          body={`${queue.name} and every message still in it will be removed. This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          busy={busy}
          onConfirm={runDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm === 'purge' && (
        <ConfirmDialog
          title="Purge queue?"
          body={`All ${available.toLocaleString()} available messages in ${queue.name} will be discarded. The queue itself stays.`}
          confirmLabel="Purge"
          destructive
          busy={busy}
          onConfirm={runPurge}
          onCancel={() => setConfirm(null)}
        />
      )}

      {showSendModal && (
        <SendMessageModal
          queue={queue}
          onClose={() => setShowSendModal(false)}
          onSent={async () => {
            setShowSendModal(false)
            showToast('success', 'Message sent')
            await onReloadAttributes()
          }}
        />
      )}

      {showEditModal && (
        <EditAttributesModal
          queue={queue}
          attributes={attributes}
          onClose={() => setShowEditModal(false)}
          onSaved={async newAttrs => {
            setShowEditModal(false)
            const result = await window.electronAPI.setQueueAttributes(queue.url, newAttrs)
            if (result.success) {
              showToast('success', 'Attributes updated')
              await onReloadAttributes()
            } else {
              showToast('error', result.error ?? 'Failed to update attributes')
            }
          }}
        />
      )}
    </>
  )
}
