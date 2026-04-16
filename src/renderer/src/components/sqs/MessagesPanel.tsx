import { useState, useEffect, useRef } from 'react'
import {
  Inbox, Trash2, RefreshCw, Copy, Check, AlertTriangle,
  ChevronRight, MessageSquare, Info, Clock, TimerOff
} from 'lucide-react'
import type { SQSMessage, QueueInfo } from '../../types'

interface Props {
  queue: QueueInfo
  messages: SQSMessage[]
  loading: boolean
  onReceive: (max: number, visibility: number, waitTime: number) => Promise<void>
  onDeleteMessage: (msg: SQSMessage) => Promise<void>
  onDeleteAll: () => Promise<void>
  onClear: () => void
}

export default function MessagesPanel({
  queue, messages, loading, onReceive, onDeleteMessage, onDeleteAll, onClear
}: Props) {
  const [maxMessages, setMaxMessages] = useState(10)
  const [visibility, setVisibility] = useState(30)
  const [waitTime, setWaitTime] = useState(0)
  const [selected, setSelected] = useState<SQSMessage | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const expiryRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onClearRef = useRef(onClear)
  useEffect(() => { onClearRef.current = onClear }, [onClear])

  const isFifo = queue.name.endsWith('.fifo')

  // Start countdown when messages arrive; auto-clear when it hits 0.
  // Subtract 1 s from the local expiry to fire slightly before LocalStack's
  // actual expiry, giving the retry calls in QueueDetail time to land after it.
  useEffect(() => {
    if (messages.length > 0 && expiryRef.current === null) {
      expiryRef.current = Date.now() + Math.max(0, visibility - 1) * 1000
      timerRef.current = setInterval(() => {
        const left = Math.ceil(((expiryRef.current ?? 0) - Date.now()) / 1000)
        if (left <= 0) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          expiryRef.current = null
          setTimeLeft(null)
          setSelected(null)
          onClearRef.current()
        } else {
          setTimeLeft(left)
        }
      }, 500)
    }
    if (messages.length === 0) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      expiryRef.current = null
      setTimeLeft(null)
    }
    return () => {}
  }, [messages.length])

  const handlePoll = () => {
    // Cancel any running countdown and clear stale messages before new poll
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    expiryRef.current = null
    setTimeLeft(null)
    setSelected(null)
    onClear()
    onReceive(maxMessages, visibility, waitTime)
  }

  const handleDelete = async (msg: SQSMessage) => {
    await onDeleteMessage(msg)
    if (selected?.MessageId === msg.MessageId) setSelected(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div
        className="px-5 py-4 border-b border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
      >
        <div className="flex items-end justify-between gap-4">
          {/* LEFT — Poll parameters */}
          <div className="flex items-end gap-3 flex-wrap">
            <LabeledControl label="Max Messages">
              <select
                value={maxMessages}
                onChange={(e) => setMaxMessages(Number(e.target.value))}
                className="input-base !py-1.5 !px-2 text-xs w-20"
              >
                {[1, 2, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </LabeledControl>

            <LabeledControl label="Visibility Timeout (s)">
              <input
                type="number" value={visibility} min={0} max={43200}
                onChange={(e) => setVisibility(Number(e.target.value))}
                className="input-base !py-1.5 !px-2 text-xs w-24"
              />
            </LabeledControl>

            {!isFifo && (
              <LabeledControl label="Long-Poll Wait (s)">
                <input
                  type="number" value={waitTime} min={0} max={20}
                  onChange={(e) => setWaitTime(Number(e.target.value))}
                  className="input-base !py-1.5 !px-2 text-xs w-20"
                />
              </LabeledControl>
            )}

            <button
              onClick={handlePoll}
              disabled={loading}
              className="btn-primary gap-1.5 py-1.5 px-4 text-xs self-end"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Poll Messages
            </button>
          </div>

          {/* RIGHT — Status / actions (pinned to right edge) */}
          <div className="flex items-center shrink-0">
            {messages.length === 0 ? (
              /* Idle hint */
              <div className="flex items-start gap-3 max-w-sm">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgb(var(--bg-overlay))' }}
                >
                  <Info size={15} className="text-3" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-2 mb-0.5">How polling works</p>
                  <p className="text-xs text-3 leading-relaxed">
                    Polled messages become <span className="font-medium text-amber-600 dark:text-amber-400">in-flight</span> and hidden
                    for the visibility timeout. Delete to acknowledge.
                  </p>
                </div>
              </div>
            ) : (
              /* Active state with stats + delete */
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: 'rgb(var(--bg-overlay) / 0.5)', borderColor: 'rgb(var(--border))' }}
                >
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-1">{messages.length} message{messages.length !== 1 ? 's' : ''} in-flight</p>
                    <p className="text-[10px] text-3 flex items-center gap-1">
                      {timeLeft !== null ? (
                        <>
                          <TimerOff size={10} className="text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            Expires in {timeLeft}s
                          </span>
                          — delete to acknowledge
                        </>
                      ) : (
                        <>
                          <Clock size={10} />
                          Hidden for {visibility}s — delete to acknowledge
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirmDeleteAll) {
                      onDeleteAll()
                      setConfirmDeleteAll(false)
                      setSelected(null)
                    } else {
                      setConfirmDeleteAll(true)
                      setTimeout(() => setConfirmDeleteAll(false), 3000)
                    }
                  }}
                  className="btn-danger gap-1.5 py-1.5 px-3 text-xs"
                >
                  <Trash2 size={12} />
                  {confirmDeleteAll ? 'Confirm Delete All' : 'Delete All'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body: list + detail pane ── */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div
            className="w-16 h-16 rounded-2xl border border-theme flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
          >
            <Inbox size={28} className="text-4" />
          </div>
          <p className="text-sm font-medium text-2 mb-1">No messages polled yet</p>
          <p className="text-xs text-3">Click "Poll Messages" to receive messages from this queue</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── Message list (left) ── */}
          <div
            className="w-80 shrink-0 flex flex-col border-r border-theme overflow-y-auto"
            style={{ backgroundColor: 'rgb(var(--bg-base))' }}
          >
            <div
              className="px-3 py-2 border-b border-theme shrink-0"
              style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.6)' }}
            >
              <span className="text-[10px] font-bold text-3 uppercase tracking-wider">
                {messages.length} Message{messages.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {messages.map((msg) => (
                <MessageListItem
                  key={msg.MessageId}
                  message={msg}
                  selected={selected?.MessageId === msg.MessageId}
                  onClick={() => setSelected(
                    selected?.MessageId === msg.MessageId ? null : msg
                  )}
                  onDelete={() => handleDelete(msg)}
                />
              ))}
            </div>
          </div>

          {/* ── Detail pane (right) ── */}
          <div className="flex-1 overflow-y-auto">
            {selected ? (
              <MessageDetail
                message={selected}
                onDelete={() => handleDelete(selected)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ChevronRight size={32} className="text-4 mb-3" />
                <p className="text-sm text-2 font-medium mb-1">Select a message</p>
                <p className="text-xs text-3">Click a message on the left to view its full details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Labeled control helper ── */
function LabeledControl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-4 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

/* ── Message list item ── */
function MessageListItem({
  message, selected, onClick, onDelete
}: {
  message: SQSMessage
  selected: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const sentAt = message.SentTimestamp
    ? new Date(parseInt(message.SentTimestamp)).toLocaleString()
    : null
  const bodyPreview = message.Body.length > 80
    ? message.Body.slice(0, 80) + '…'
    : message.Body

  return (
    <div
      className={`flex items-start gap-2 px-3 py-3 cursor-pointer border-b border-theme
        transition-colors group
        ${selected ? 'bg-brand-500/10 border-l-2 border-l-brand-500' : 'hover:bg-raised border-l-2 border-l-transparent'}`}
      onClick={onClick}
    >
      <MessageSquare
        size={13}
        className={`mt-0.5 shrink-0 ${selected ? 'text-brand-500' : 'text-4'}`}
      />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] text-3 truncate mb-0.5">{message.MessageId}</p>
        <p className={`text-xs font-mono truncate ${selected ? 'text-1' : 'text-2'}`}>
          {bodyPreview}
        </p>
        {sentAt && <p className="text-[10px] text-4 mt-0.5">{sentAt}</p>}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="shrink-0 p-1 text-4 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        title="Delete message"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

/* ── Message detail pane ── */
function MessageDetail({ message, onDelete }: { message: SQSMessage; onDelete: () => void }) {
  const [copiedBody, setCopiedBody] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const copyBody = async () => {
    await navigator.clipboard.writeText(message.Body)
    setCopiedBody(true)
    setTimeout(() => setCopiedBody(false), 2000)
  }
  const copyId = async () => {
    await navigator.clipboard.writeText(message.MessageId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const sentAt = message.SentTimestamp
    ? new Date(parseInt(message.SentTimestamp)).toLocaleString()
    : null

  return (
    <div className="p-5 space-y-4 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Message ID</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-2 truncate">{message.MessageId}</span>
            <button onClick={copyId} className="text-4 hover:text-2 shrink-0">
              {copiedId ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
          {sentAt && (
            <p className="text-[10px] text-4 mt-1">Sent: {sentAt}</p>
          )}
        </div>
        <button onClick={onDelete} className="btn-danger gap-1.5 py-1.5 px-3 text-xs shrink-0">
          <Trash2 size={12} />
          Delete
        </button>
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Message Body</p>
          <button
            onClick={copyBody}
            className="flex items-center gap-1 text-[10px] text-3 hover:text-1 transition-colors"
          >
            {copiedBody ? <Check size={11} /> : <Copy size={11} />}
            {copiedBody ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre
          className="rounded-xl p-4 text-xs font-mono text-2 overflow-x-auto whitespace-pre-wrap
            break-all max-h-72 overflow-y-auto border border-theme leading-relaxed"
          style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
        >
          {message.Body}
        </pre>
      </div>

      {/* MD5 */}
      {message.MD5OfBody && (
        <div>
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">MD5 of Body</p>
          <span className="font-mono text-xs text-3">{message.MD5OfBody}</span>
        </div>
      )}

      {/* System attributes */}
      {message.Attributes && Object.keys(message.Attributes).length > 0 && (
        <AttributeTable
          title="System Attributes"
          entries={Object.entries(message.Attributes)}
        />
      )}

      {/* Message attributes */}
      {message.MessageAttributes && Object.keys(message.MessageAttributes).length > 0 && (
        <AttributeTable
          title="Message Attributes"
          entries={Object.entries(message.MessageAttributes).map(([k, v]) => [
            `${k} (${v.DataType})`,
            v.StringValue ?? ''
          ])}
        />
      )}
    </div>
  )
}

function AttributeTable({ title, entries }: { title: string; entries: [string, string][] }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">{title}</p>
      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <tbody>
            {entries.map(([k, v], i) => (
              <tr
                key={k}
                className="border-b border-theme last:border-0"
                style={i % 2 ? { backgroundColor: 'rgb(var(--bg-raised) / 0.5)' } : undefined}
              >
                <td className="px-3 py-2 text-3 font-medium w-2/5 align-top">{k}</td>
                <td className="px-3 py-2 text-2 font-mono break-all">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
