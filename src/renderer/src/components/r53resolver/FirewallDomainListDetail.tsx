import { useState, useEffect, useCallback } from 'react'
import { Trash2, Loader2, Plus, X, List } from 'lucide-react'
import type { R53FirewallDomainList } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  domainList: R53FirewallDomainList
  onDeleted: () => void
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-theme/40 last:border-0">
      <span className="text-[10px] font-bold text-4 uppercase tracking-wider w-36 flex-shrink-0">{label}</span>
      <span className={`text-xs font-mono break-all ${value == null || value === '' ? 'text-4' : 'text-2'}`}>
        {value == null || value === '' ? '—' : String(value)}
      </span>
    </div>
  )
}

export default function FirewallDomainListDetail({ domainList, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [tab, setTab] = useState<'info' | 'domains'>('info')
  const [domains, setDomains] = useState<string[]>([])
  const [loadingDomains, setLoadingDomains] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingAdd, setPendingAdd] = useState<string[]>([])
  const [pendingRemove, setPendingRemove] = useState<Set<string>>(new Set())

  const loadDomains = useCallback(async () => {
    setLoadingDomains(true)
    const res = await window.electronAPI.r53rListFwDomains(domainList.id)
    if (res.success && res.data) setDomains(res.data as string[])
    setLoadingDomains(false)
  }, [domainList.id])

  useEffect(() => { if (tab === 'domains') loadDomains() }, [tab, loadDomains])

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.r53rDeleteFwDomainList(domainList.id)
    if (res.success) onDeleted()
    else showToast('error', res.error ?? 'Failed to delete domain list')
    setDeleting(false)
  }

  const addPending = () => {
    const d = newDomain.trim()
    if (!d || pendingAdd.includes(d)) return
    setPendingAdd(prev => [...prev, d])
    setNewDomain('')
  }

  const toggleRemove = (domain: string) => {
    setPendingRemove(prev => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain); else next.add(domain)
      return next
    })
  }

  const handleSaveChanges = async () => {
    const toAdd = pendingAdd
    const toRemove = Array.from(pendingRemove)
    if (toAdd.length === 0 && toRemove.length === 0) return
    setSaving(true)
    const ops: Promise<unknown>[] = []
    if (toAdd.length > 0)    ops.push(window.electronAPI.r53rUpdateFwDomains(domainList.id, 'ADD', toAdd))
    if (toRemove.length > 0) ops.push(window.electronAPI.r53rUpdateFwDomains(domainList.id, 'REMOVE', toRemove))
    await Promise.allSettled(ops)
    showToast('success', 'Domains updated')
    setPendingAdd([]); setPendingRemove(new Set())
    setSaving(false)
    loadDomains()
  }

  const hasChanges = pendingAdd.length > 0 || pendingRemove.size > 0

  const tabs = [
    { id: 'info'    as const, label: 'Info' },
    { id: 'domains' as const, label: 'Domains' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
              <List size={18} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-1 truncate">{domainList.name}</h2>
              <p className="text-xs text-3 font-mono truncate">{domainList.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'btn-ghost text-red-400 hover:bg-red-500/10'}`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>
        <div className="flex items-center -mb-px">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${tab === t.id ? 'border-blue-400 text-blue-400' : 'border-transparent text-3 hover:text-1'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="flex-1 overflow-auto p-5">
        {tab === 'info' ? (
          <div className="card p-4">
            <InfoRow label="List ID"      value={domainList.id} />
            <InfoRow label="Name"         value={domainList.name} />
            <InfoRow label="Status"       value={domainList.status} />
            <InfoRow label="Domain Count" value={domainList.domainCount} />
            <InfoRow label="ARN"          value={domainList.arn} />
            <InfoRow label="Created"      value={domainList.creationTime} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider">
                Domains {!loadingDomains && (domains.length + pendingAdd.length - pendingRemove.size) > 0
                  ? `(${domains.length + pendingAdd.length - pendingRemove.size})` : ''}
              </p>
              {hasChanges && (
                <button onClick={handleSaveChanges} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                  {saving && <Loader2 size={12} className="animate-spin" />} Save Changes
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text" placeholder="example.com or *.example.com"
                value={newDomain} onChange={e => setNewDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPending()}
                className="input-base flex-1 text-sm font-mono"
              />
              <button onClick={addPending} disabled={!newDomain.trim()}
                className="btn-ghost !px-3 disabled:opacity-50">
                <Plus size={14} />
              </button>
            </div>

            {loadingDomains ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-3" /></div>
            ) : (domains.length === 0 && pendingAdd.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <List size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No domains</p>
                <p className="text-[10px] text-4 mt-1">Type a domain above and press Enter to add</p>
              </div>
            ) : (
              <div className="card divide-y divide-theme/40 max-h-96 overflow-y-auto">
                {pendingAdd.map(d => (
                  <div key={`add-${d}`} className="flex items-center justify-between px-4 py-2 bg-emerald-500/5">
                    <p className="text-sm font-mono text-emerald-400">{d}</p>
                    <button onClick={() => setPendingAdd(prev => prev.filter(x => x !== d))}
                      className="text-4 hover:text-2 transition-colors ml-3"><X size={14} /></button>
                  </div>
                ))}
                {domains.filter(d => !pendingRemove.has(d)).map(d => (
                  <div key={d} className="flex items-center justify-between px-4 py-2">
                    <p className="text-sm font-mono text-2">{d}</p>
                    <button onClick={() => toggleRemove(d)}
                      className="text-4 hover:text-red-400 transition-colors ml-3"><X size={14} /></button>
                  </div>
                ))}
                {Array.from(pendingRemove).map(d => (
                  <div key={`rm-${d}`} className="flex items-center justify-between px-4 py-2 bg-red-500/5">
                    <p className="text-sm font-mono text-red-400 line-through opacity-50">{d}</p>
                    <button onClick={() => toggleRemove(d)}
                      className="text-4 hover:text-2 transition-colors ml-3"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
