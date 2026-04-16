import { useState } from 'react'
import { X, Send, AlertTriangle, Loader2, Mail } from 'lucide-react'
import type { SesIdentity } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  sourceIdentity: SesIdentity
  onClose: () => void
}

export default function SendEmailModal({ sourceIdentity, onClose }: Props) {
  const { showToast } = useToastContext()
  const [toStr, setToStr] = useState('')
  const [ccStr, setCcStr] = useState('')
  const [bccStr, setBccStr] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<'text' | 'html'>('text')

  const canSubmit = toStr.trim().length > 0 && subject.trim().length > 0 && (bodyText.trim().length > 0 || bodyHtml.trim().length > 0)

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)

    const parseAddresses = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean)
    const to = parseAddresses(toStr)
    const cc = parseAddresses(ccStr)
    const bcc = parseAddresses(bccStr)

    const res = await window.electronAPI.sesSendEmail({
      source: sourceIdentity.name,
      toAddresses: to,
      ccAddresses: cc.length > 0 ? cc : undefined,
      bccAddresses: bcc.length > 0 ? bcc : undefined,
      subject: subject.trim(),
      bodyText: bodyText.trim() || undefined,
      bodyHtml: bodyHtml.trim() || undefined,
    })

    setSubmitting(false)
    if (res.success) {
      showToast('success', 'Email sent successfully!')
      onClose()
    } else {
      setError(res.error || 'Failed to send email')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-2xl border border-theme shadow-2xl flex flex-col max-h-[90vh]" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-sky-500/15">
              <Mail size={16} className="text-sky-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Send Test Email</h2>
              <p className="text-[10px] text-3">From: <span className="font-mono text-sky-500">{sourceIdentity.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">To * <span className="text-[10px] font-normal text-4 ml-1">(comma separated)</span></label>
            <input value={toStr} onChange={e => setToStr(e.target.value)} placeholder="recipient@example.com" className="input-base w-full text-sm font-mono" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">CC <span className="text-[10px] font-normal text-4 ml-1">(comma separated)</span></label>
              <input value={ccStr} onChange={e => setCcStr(e.target.value)} placeholder="cc@example.com" className="input-base w-full text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">BCC <span className="text-[10px] font-normal text-4 ml-1">(comma separated)</span></label>
              <input value={bccStr} onChange={e => setBccStr(e.target.value)} placeholder="bcc@example.com" className="input-base w-full text-sm font-mono" />
            </div>
          </div>
          
          <div className="h-px bg-theme my-2" />

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Test Email from StackView" className="input-base w-full text-sm" />
          </div>

          <div>
            <div className="flex items-end justify-between mb-1.5">
              <label className="block text-xs font-semibold text-2">Message Body *</label>
              <div className="flex bg-raised rounded-lg p-0.5 border border-theme">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${activeTab === 'text' ? 'bg-base shadow-sm text-sky-500' : 'text-3 hover:text-2'}`}
                >
                  Plain Text
                </button>
                <button
                  onClick={() => setActiveTab('html')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${activeTab === 'html' ? 'bg-base shadow-sm text-sky-500' : 'text-3 hover:text-2'}`}
                >
                  HTML
                </button>
              </div>
            </div>
            {activeTab === 'text' ? (
              <textarea
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                placeholder="Hello,\n\nThis is a test email sent via AWS SES LocalStack.\n\nRegards,\nStackView"
                className="input-base w-full text-sm min-h-[160px] resize-y"
              />
            ) : (
              <textarea
                value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                placeholder="<h1>Hello</h1><p>This is an HTML email.</p>"
                className="input-base w-full text-sm font-mono min-h-[160px] resize-y"
              />
            )}
            <p className="text-[10px] text-4 mt-1.5">At least one body format (text or HTML) must be provided.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Send size={14} /> Send Email
          </button>
        </div>
      </div>
    </div>
  )
}
