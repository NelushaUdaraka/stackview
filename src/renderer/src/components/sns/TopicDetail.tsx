import { useState, useEffect } from 'react'
import {
  MessageSquare, Trash2, Check, AlertTriangle, Loader2,
  Copy, Send, Radio, Settings, Users, Link as LinkIcon
} from 'lucide-react'
import type { SnsTopic, SnsSubscription } from '../../types'
import CreateSubscriptionModal from './CreateSubscriptionModal'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  topic: SnsTopic
  onDeleted: () => void
  onUpdated: () => void
}

type Tab = 'publish' | 'subscriptions'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

function PublishTab({ topic }: { topic: SnsTopic }) {
  const { showToast } = useToastContext()
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    setPublishing(true)
    const res = await window.electronAPI.snsPublish(topic.arn, message.trim(), subject.trim() || undefined)
    setPublishing(false)
    if (res.success) {
      showToast('success', 'Message published successfully')
      setMessage('')
      setSubject('')
    } else {
      showToast('error', res.error ?? 'Failed to publish message')
    }
  }

  return (
    <div className="p-5 h-full overflow-auto space-y-6">
      <div className="card p-5 space-y-4">
        <h3 className="text-xs font-bold text-2 flex items-center gap-2 uppercase tracking-wider">
          <Settings size={14} className="text-pink-500" /> Topic Details
        </h3>
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider w-24 shrink-0">ARN</p>
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono text-xs text-1 break-all">{topic.arn}</span>
            <CopyButton text={topic.arn} />
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-5 border-pink-500/20 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgb(236 72 153), transparent 40%)' }} />
        <h3 className="text-xs font-bold text-2 flex items-center gap-2 uppercase tracking-wider relative">
          <Send size={14} className="text-pink-500" /> Publish Message to Topic
        </h3>

        <div className="relative">
          <label className="block text-[11px] font-bold text-3 mb-1.5 ml-1">Subject <span className="font-normal">(optional)</span></label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Notification subject..."
            className="input-base w-full text-sm font-medium"
          />
        </div>

        <div className="relative">
          <label className="block text-[11px] font-bold text-3 mb-1.5 ml-1">Message Body *</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Enter the payload or text strictly formatted..."
            rows={8}
            className="input-base w-full text-sm font-mono resize-none leading-relaxed"
          />
        </div>

        <div className="flex justify-end relative">
          <button
            onClick={handlePublish}
            disabled={publishing || !message.trim()}
            className="btn-primary gap-2 bg-pink-600 hover:bg-pink-500 text-white shadow-sm disabled:opacity-50"
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publish Message
          </button>
        </div>
      </div>
    </div>
  )
}

function SubscriptionsTab({ topic }: { topic: SnsTopic }) {
  const { showToast } = useToastContext()
  const [subs, setSubs] = useState<SnsSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deletingList, setDeletingList] = useState<string[]>([])

  const loadSubs = async () => {
    setLoading(true)
    const res = await window.electronAPI.snsListSubscriptionsByTopic(topic.arn)
    if (res.success && res.data) setSubs(res.data)
    setLoading(false)
  }

  useEffect(() => { loadSubs() }, [topic.arn])

  const handleDelete = async (arn: string) => {
    if (arn === 'PendingConfirmation') {
      showToast('error', 'Cannot explicitly delete a PendingConfirmation subscription.')
      return
    }
    setDeletingList(prev => [...prev, arn])
    const res = await window.electronAPI.snsUnsubscribe(arn)
    setDeletingList(prev => prev.filter(a => a !== arn))
    if (res.success) {
      showToast('success', 'Subscription removed')
      loadSubs()
    } else {
      showToast('error', res.error ?? 'Failed to remove subscription')
    }
  }

  return (
    <div className="flex flex-col h-full bg-app relative">
      <div className="px-5 py-4 border-b border-theme flex items-center justify-between shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <h3 className="text-sm font-bold text-1 flex items-center gap-2">
          <Users size={16} className="text-pink-500" /> Topic Subscriptions
          <span className="ml-2 px-2 py-0.5 rounded-full bg-raised text-[10px] font-bold text-3">{subs.length}</span>
        </h3>
        <button onClick={() => setShowModal(true)} className="btn-secondary text-xs py-1.5 gap-1.5 border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/5 text-pink-600 dark:text-pink-400">
          <LinkIcon size={12} /> Create Subscription
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center p-12 text-3"><Loader2 size={24} className="animate-spin" /></div>
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-3 h-full">
            <Radio size={32} className="opacity-20 mb-4" />
            <p className="text-sm font-medium text-2">No subscriptions found</p>
            <p className="text-xs mt-1 max-w-xs leading-relaxed">Create a subscription to receive messages published to this topic via SQS, HTTP, Email, or Lambda.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme">Protocol</th>
                <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme">Endpoint</th>
                <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme">Subscription ARN</th>
                <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {subs.map((s, i) => {
                const isPending = s.subscriptionArn === 'PendingConfirmation'
                return (
                  <tr key={i} className="hover:bg-raised/30 transition-colors group">
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 rounded bg-raised text-[10px] font-bold uppercase tracking-wider text-2 border border-theme">
                        {s.protocol}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-1 break-all max-w-[300px]">{s.endpoint}</td>
                    <td className="px-5 py-3 text-[11px] font-mono text-3 break-all max-w-[300px]">
                      {isPending ? (
                        <span className="text-amber-500 dark:text-amber-400 font-semibold flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded w-max border border-amber-500/20">
                          <AlertTriangle size={12} /> Pending Confirmation
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 group-hover:text-2 transition-colors">
                          {s.subscriptionArn.split(':').pop()?.substring(0, 16)}...
                          <CopyButton text={s.subscriptionArn} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isPending && (
                       <button
                         onClick={() => handleDelete(s.subscriptionArn)}
                         disabled={deletingList.includes(s.subscriptionArn)}
                         className="btn-ghost !p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                         title="Unsubscribe"
                       >
                         {deletingList.includes(s.subscriptionArn) ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                       </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CreateSubscriptionModal
          topicArn={topic.arn}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); loadSubs(); showToast('success', 'Subscription created successfully') }}
        />
      )}
    </div>
  )
}

export default function TopicDetail({ topic, onDeleted, onUpdated }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<Tab>('publish')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.snsDeleteTopic(topic.arn)
    setDeleting(false)
    if (res.success) onDeleted()
    else showToast('error', res.error ?? 'Failed to delete topic')
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'publish', label: 'Overview & Publish', icon: <Send size={13} /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Users size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(236 72 153 / 0.15)' }}>
              <MessageSquare size={18} style={{ color: 'rgb(236 72 153)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-1 truncate mb-0.5">{topic.name}</h2>
              <div className="flex items-center gap-2 text-[10px] font-mono text-3 truncate" title={topic.arn}>
                 {topic.arn.substring(0, 32)}... <CopyButton text={topic.arn} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleDelete} disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmDelete ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30' : 'btn-ghost text-red-500 hover:bg-red-500/10'}`}>
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete Topic'}
            </button>
          </div>
        </div>

        <div className="flex items-center -mb-px">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${activeTab === tab.id ? 'border-pink-500 text-pink-600 dark:text-pink-400' : 'border-transparent text-3 hover:text-1'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'publish' && <PublishTab topic={topic} />}
        {activeTab === 'subscriptions' && <SubscriptionsTab topic={topic} />}
      </div>
    </div>
  )
}
