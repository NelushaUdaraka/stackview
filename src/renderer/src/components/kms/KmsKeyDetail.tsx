import { useState } from 'react'
import { KeyRound, ShieldCheck, ShieldAlert, Loader2, Copy, Check, Clock, Edit2, Play, Square, Settings2, Trash2, Plus } from 'lucide-react'
import type { KmsKey } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  dataKey: KmsKey
  onRefresh: () => void
  onDeleted: () => void
  onEncryptDecrypt: () => void
  onCreateAlias: () => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

export default function KmsKeyDetail({ dataKey, onRefresh, onDeleted, onEncryptDecrypt, onCreateAlias }: Props) {
  const { showToast } = useToastContext()
  const [actioning, setActioning] = useState(false)

  const isEnabled = dataKey.state === 'Enabled'
  const isPendingDelete = dataKey.state === 'PendingDeletion'

  const toggleState = async () => {
    setActioning(true)
    let res
    if (isEnabled) res = await window.electronAPI.kmsDisableKey(dataKey.keyId)
    else res = await window.electronAPI.kmsEnableKey(dataKey.keyId)
    
    if (res.success) {
      showToast('success', `Key ${isEnabled ? 'disabled' : 'enabled'} successfully`)
      onRefresh()
    } else {
      showToast('error', res.error || 'Failed to toggle key state')
    }
    setActioning(false)
  }

  const toggleDelete = async () => {
    if (!isPendingDelete && !confirm('Are you sure you want to schedule this key for deletion?')) return
    
    setActioning(true)
    let res
    if (isPendingDelete) res = await window.electronAPI.kmsCancelKeyDeletion(dataKey.keyId)
    else res = await window.electronAPI.kmsScheduleKeyDeletion(dataKey.keyId, 7)
    
    if (res.success) {
      showToast('success', `Key deletion ${isPendingDelete ? 'canceled' : 'scheduled'}`)
      onRefresh()
    } else {
      showToast('error', res.error || 'Failed to toggle deletion logic')
    }
    setActioning(false)
  }

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-6 border-b border-theme bg-base shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-3 rounded-2xl border ${isEnabled ? 'bg-violet-500/10 border-violet-500/20 text-violet-500' : isPendingDelete ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
              <KeyRound size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-1 truncate">
                  {dataKey.aliases.length > 0 ? dataKey.aliases[0].aliasName : 'Custom CMK'}
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${isEnabled ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : isPendingDelete ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                  {dataKey.state}
                </span>
                {dataKey.aliases.map((a, i) => i > 0 && (
                  <span key={a.aliasName} className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-violet-500/10 text-violet-600 border border-violet-500/20 hidden sm:inline-block truncate max-w-[150px]">
                    {a.aliasName}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-3 font-mono">
                {dataKey.keyId} <CopyButton text={dataKey.keyId} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEncryptDecrypt}
              disabled={!isEnabled}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-sm
                ${isEnabled ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-raised text-4 cursor-not-allowed opacity-50'}`}
              title={!isEnabled ? 'Key must be enabled to encrypt/decrypt' : 'Test Encrypt/Decrypt'}
            >
              <Settings2 size={14} /> Encrypt/Decrypt
            </button>
            <button
              onClick={onCreateAlias}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors bg-raised hover:bg-theme text-2 border border-theme"
            >
              <Plus size={14} /> Alias
            </button>
          </div>
        </div>
      </div>

      {/* Details List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="w-full space-y-6">
          
          {dataKey.description && (
            <div className="text-sm text-2 p-4 rounded-xl bg-raised border border-theme">
              <span className="font-bold mr-2 text-3">Description:</span> {dataKey.description}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={13} className="text-violet-500" /> Key Configuration
              </h4>
              <div className="bg-base rounded-xl border border-theme p-5 space-y-4">
                <div>
                  <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-1.5">Key ARN</p>
                  <p className="text-xs text-3 font-mono flex items-center justify-between">
                    <span className="truncate mr-2">{dataKey.arn}</span>
                    <CopyButton text={dataKey.arn} />
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-1.5">Creation Date</p>
                  <p className="text-sm font-semibold">{dataKey.creationDate ? new Date(dataKey.creationDate).toLocaleString() : 'N/A'}</p>
                </div>
                {isPendingDelete && (
                  <div>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1.5">Scheduled Deletion Date</p>
                    <p className="text-sm font-bold text-red-500">{dataKey.deletionDate ? new Date(dataKey.deletionDate).toLocaleString() : 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
                <Edit2 size={13} className="text-violet-500" /> Key Actions
              </h4>
              <div className="bg-base rounded-xl border border-theme p-5 flex flex-col gap-3">
                
                <button
                  onClick={toggleState}
                  disabled={actioning || isPendingDelete}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${isPendingDelete ? 'opacity-50 cursor-not-allowed border-theme' : isEnabled ? 'hover:bg-amber-500/10 border-theme hover:border-amber-500/30' : 'hover:bg-emerald-500/10 border-theme hover:border-emerald-500/30'}`}
                >
                  <div>
                    <p className={`text-sm font-bold ${isEnabled ? 'text-amber-500' : 'text-emerald-500'}`}>{isEnabled ? 'Disable Key' : 'Enable Key'}</p>
                    <p className="text-[10px] text-4 mt-0.5">{isEnabled ? 'Prevent this key from being used' : 'Allow this key to be used for crypto ops'}</p>
                  </div>
                  {actioning ? <Loader2 size={18} className="animate-spin text-3" /> : (
                    isEnabled ? <Square size={18} className="text-amber-500 opacity-50" fill="currentColor" /> : <Play size={18} className="text-emerald-500 opacity-50" fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={toggleDelete}
                  disabled={actioning}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${isPendingDelete ? 'hover:bg-sky-500/10 border-theme hover:border-sky-500/30' : 'hover:bg-red-500/10 border-theme hover:border-red-500/30'}`}
                >
                  <div>
                    <p className={`text-sm font-bold ${isPendingDelete ? 'text-sky-500' : 'text-red-500'}`}>{isPendingDelete ? 'Cancel Deletion' : 'Schedule Deletion'}</p>
                    <p className="text-[10px] text-4 mt-0.5">{isPendingDelete ? 'Restore this key to disabled state' : 'Schedule this key for permanent deletion (7 days)'}</p>
                  </div>
                  {actioning ? <Loader2 size={18} className="animate-spin text-3" /> : (
                    isPendingDelete ? <Clock size={18} className="text-sky-500 opacity-50" /> : <Trash2 size={18} className="text-red-500 opacity-50" />
                  )}
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
