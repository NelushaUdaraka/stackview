import { useState } from 'react'
import {
  Workflow, Trash2, Check, Loader2,
  Copy, Settings, Send, LayoutList
} from 'lucide-react'
import type { EbBus } from '../../types'
import EbRulesList from './EbRulesList'
import EbPutEvents from './EbPutEvents'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  bus: EbBus
  onRefresh: () => void
  onDeleted: () => void
}

type Tab = 'rules' | 'events'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

export default function BusDetail({ bus, onRefresh, onDeleted }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('rules')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToastContext()

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.ebDeleteBus(bus.name)
    setDeleting(false)
    if (res.success) onDeleted()
    else showToast('error', res.error ?? 'Failed to delete event bus')
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'rules', label: 'Rules', icon: <LayoutList size={13} /> },
    { id: 'events', label: 'Send Events', icon: <Send size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(192 38 211 / 0.15)' }}>
              <Workflow size={18} className="text-fuchsia-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-1 truncate">{bus.name}</h2>
                {bus.name === 'default' && (
                   <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/10 text-[9px] font-bold text-fuchsia-600 border border-fuchsia-500/20">PRIMARY</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-3 truncate" title={bus.arn}>
                 {bus.arn.substring(0, 48)}... <CopyButton text={bus.arn} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting || bus.name === 'default'}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 shadow-sm shadow-red-500/5'
                  : 'btn-danger bg-red-500/5 hover:bg-red-500/10 border-red-500/20'
                }
                ${bus.name === 'default' ? 'opacity-40 cursor-not-allowed hidden' : ''}`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete Bus'}
            </button>
          </div>
        </div>

        <div className="flex items-center -mb-px">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${activeTab === tab.id ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400' : 'border-transparent text-3 hover:text-1'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-app">
        <div className="h-full overflow-y-auto">
          {activeTab === 'rules' && (
            <div className="p-5">
              <EbRulesList bus={bus} />
            </div>
          )}
          {activeTab === 'events' && (
            <div className="p-5">
              <EbPutEvents bus={bus} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
