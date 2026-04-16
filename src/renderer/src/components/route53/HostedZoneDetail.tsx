import { useState, useEffect } from 'react'
import { Trash2, Loader2, Plus, RefreshCw } from 'lucide-react'
import type { Route53HostedZone, Route53RecordSet } from '../../types'
import CreateRecordModal from './CreateRecordModal'

interface Props {
  zone: Route53HostedZone
  onDeleted: () => void
}

type Tab = 'records' | 'overview'

const RECORD_TYPE_COLORS: Record<string, string> = {
  A:      'text-blue-400 bg-blue-500/10',
  AAAA:   'text-indigo-400 bg-indigo-500/10',
  CNAME:  'text-emerald-400 bg-emerald-500/10',
  MX:     'text-orange-400 bg-orange-500/10',
  NS:     'text-purple-400 bg-purple-500/10',
  SOA:    'text-rose-400 bg-rose-500/10',
  TXT:    'text-amber-400 bg-amber-500/10',
  SRV:    'text-cyan-400 bg-cyan-500/10',
  PTR:    'text-teal-400 bg-teal-500/10',
  CAA:    'text-pink-400 bg-pink-500/10',
}

function typeColor(t: string) {
  return RECORD_TYPE_COLORS[t] ?? 'text-zinc-400 bg-zinc-500/10'
}

export default function HostedZoneDetail({ zone, onDeleted }: Props) {
  const [tab, setTab] = useState<Tab>('records')
  const [records, setRecords] = useState<Route53RecordSet[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<string | null>(null)
  const [showCreateRecord, setShowCreateRecord] = useState(false)
  const [error, setError] = useState('')

  const loadRecords = async () => {
    setLoadingRecords(true)
    setError('')
    try {
      const result = await window.electronAPI.route53ListRecordSets(zone.Id)
      if (result.success && result.data) {
        setRecords(result.data)
      } else {
        setError(result.error ?? 'Failed to load records')
      }
    } finally {
      setLoadingRecords(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [zone.Id])

  const handleDeleteZone = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const deletable = records.filter(r => r.Type !== 'SOA' && r.Type !== 'NS')
      for (const r of deletable) {
        await window.electronAPI.route53DeleteRecord(zone.Id, r)
      }
      const result = await window.electronAPI.route53DeleteHostedZone(zone.Id)
      if (result.success) {
        onDeleted()
      } else {
        setError(result.error ?? 'Failed to delete zone')
        setConfirmDelete(false)
      }
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteRecord = async (record: Route53RecordSet) => {
    const key = `${record.Name}-${record.Type}`
    if (!confirm(`Delete record ${record.Name} (${record.Type})?`)) return
    setDeletingRecord(key)
    try {
      const result = await window.electronAPI.route53DeleteRecord(zone.Id, record)
      if (result.success) {
        await loadRecords()
      } else {
        setError(result.error ?? 'Failed to delete record')
      }
    } finally {
      setDeletingRecord(null)
    }
  }

  const shortId = zone.Id.replace('/hostedzone/', '')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgb(59 130 246 / 0.1)' }}>
            <GlobeIcon size={16} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-1 truncate">{zone.Name}</h2>
            <p className="text-[10px] text-4 truncate">{shortId}</p>
          </div>
        </div>
        <button
          onClick={handleDeleteZone}
          disabled={deleting}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors shrink-0
            ${confirmDelete
              ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
              : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'
            }`}
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          {confirmDelete ? 'Confirm Delete' : 'Delete Zone'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme shrink-0 px-5 gap-4"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.2)' }}>
        {(['records', 'overview'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors capitalize
              ${tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-3 hover:text-2'}`}
          >
            {t === 'records' ? `Records${records.length > 0 ? ` (${records.length})` : ''}` : 'Overview'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-5 mt-3 text-xs text-red-500 p-3 rounded-lg bg-red-500/10 border border-red-500/20">{error}</div>
      )}

      {tab === 'records' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-2 border-b border-theme shrink-0">
            <span className="text-xs text-3">{loadingRecords ? 'Loading...' : `${records.length} record${records.length !== 1 ? 's' : ''}`}</span>
            <div className="flex gap-2">
              <button onClick={loadRecords} disabled={loadingRecords} className="btn-ghost !px-2 !py-1.5">
                <RefreshCw size={12} className={loadingRecords ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowCreateRecord(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                style={{ backgroundColor: 'rgb(59 130 246)' }}
              >
                <Plus size={12} />
                Add Record
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingRecords ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-4" />
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-sm text-3">No records found</p>
                <button onClick={() => setShowCreateRecord(true)} className="text-xs text-blue-400 hover:underline">Add a record</button>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.3)' }}>
                    <th className="text-left px-4 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Name</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Type</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">TTL</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold text-4 uppercase tracking-wider">Value</th>
                    <th className="px-3 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const key = `${r.Name}-${r.Type}-${i}`
                    const isDeleting = deletingRecord === `${r.Name}-${r.Type}`
                    const isDeletable = r.Type !== 'SOA' && !(r.Type === 'NS' && r.Name === zone.Name)
                    return (
                      <tr key={key} className="border-b border-theme hover:bg-raised/30 transition-colors">
                        <td className="px-4 py-2.5 text-2 font-mono max-w-[200px] truncate">{r.Name}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${typeColor(r.Type)}`}>{r.Type}</span>
                        </td>
                        <td className="px-3 py-2.5 text-3">{r.TTL ?? (r.AliasTarget ? 'Alias' : '—')}</td>
                        <td className="px-3 py-2.5 text-3 font-mono max-w-[300px]">
                          {r.AliasTarget
                            ? <span className="text-blue-400">{r.AliasTarget.DNSName}</span>
                            : (r.Records ?? []).join(', ') || '—'
                          }
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {isDeletable && (
                            <button
                              onClick={() => handleDeleteRecord(r)}
                              disabled={isDeleting}
                              className="text-red-500/60 hover:text-red-500 transition-colors p-1 rounded"
                            >
                              {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
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
        </div>
      )}

      {tab === 'overview' && (
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-1">
            <InfoRow label="Zone ID" value={shortId} mono />
            <InfoRow label="Zone Name" value={zone.Name} mono />
            <InfoRow label="Type" value={zone.Config?.PrivateZone ? 'Private' : 'Public'} />
            <InfoRow label="Record Count" value={zone.ResourceRecordSetCount?.toString()} />
            <InfoRow label="Comment" value={zone.Config?.Comment || undefined} />
            <InfoRow label="Caller Reference" value={zone.CallerReference} mono />
          </div>
        </div>
      )}

      {showCreateRecord && (
        <CreateRecordModal
          zoneId={zone.Id}
          zoneName={zone.Name}
          onClose={() => setShowCreateRecord(false)}
          onCreated={() => { setShowCreateRecord(false); loadRecords() }}
        />
      )}
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-theme">
      <span className="text-[10px] font-bold text-4 uppercase tracking-wider w-36 shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs text-2 break-all ${mono ? 'font-mono' : ''} ${!value ? 'text-4' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function GlobeIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
