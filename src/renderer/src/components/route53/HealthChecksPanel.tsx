import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, RefreshCw, HeartPulse } from 'lucide-react'
import type { Route53HealthCheck } from '../../types'
import CreateHealthCheckModal from './CreateHealthCheckModal'

export default function HealthChecksPanel() {
  const [checks, setChecks] = useState<Route53HealthCheck[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<Route53HealthCheck | null>(null)
  const [error, setError] = useState('')

  const loadChecks = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await window.electronAPI.route53ListHealthChecks()
      if (result.success && result.data) {
        setChecks(result.data)
      } else {
        setError(result.error ?? 'Failed to load health checks')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadChecks() }, [])

  const handleDelete = async (checkId: string) => {
    if (confirmDelete !== checkId) { setConfirmDelete(checkId); return }
    setDeleting(checkId)
    setConfirmDelete(null)
    try {
      const result = await window.electronAPI.route53DeleteHealthCheck(checkId)
      if (result.success) {
        if (selected?.Id === checkId) setSelected(null)
        await loadChecks()
      } else {
        setError(result.error ?? 'Failed to delete health check')
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <div className="flex items-center gap-2.5">
          <HeartPulse size={16} className="text-blue-400" />
          <h2 className="text-sm font-bold text-1">Health Checks</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={loadChecks} disabled={loading} className="btn-ghost !px-2 !py-1.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: 'rgb(59 130 246)' }}
          >
            <Plus size={12} /> New Health Check
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 text-xs text-red-500 p-3 rounded-lg bg-red-500/10 border border-red-500/20">{error}</div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="w-72 shrink-0 border-r border-theme overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-4" />
            </div>
          ) : checks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <HeartPulse size={24} className="text-4" />
              <p className="text-xs text-3">No health checks</p>
              <button onClick={() => setShowCreate(true)} className="text-xs text-blue-400 hover:underline">Create one</button>
            </div>
          ) : (
            checks.map(hc => (
              <button
                key={hc.Id}
                onClick={() => setSelected(hc)}
                className={`w-full flex items-start gap-2.5 px-4 py-3 text-left border-b border-theme transition-colors border-l-2
                  ${selected?.Id === hc.Id ? 'bg-blue-500/10 border-l-blue-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <HeartPulse size={13} className={`shrink-0 mt-0.5 ${selected?.Id === hc.Id ? 'text-blue-400' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-2 truncate">{hc.Id}</p>
                  <p className="text-[10px] text-4 mt-0.5">
                    {hc.HealthCheckConfig?.Type ?? '—'}
                    {hc.HealthCheckConfig?.FullyQualifiedDomainName && ` · ${hc.HealthCheckConfig.FullyQualifiedDomainName}`}
                    {hc.HealthCheckConfig?.IPAddress && ` · ${hc.HealthCheckConfig.IPAddress}`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto p-5">
          {selected ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-1">Health Check Details</h3>
                <button
                  onClick={() => handleDelete(selected.Id)}
                  disabled={deleting === selected.Id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors shrink-0
                    ${confirmDelete === selected.Id
                      ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                      : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'
                    }`}
                >
                  {deleting === selected.Id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {confirmDelete === selected.Id ? 'Confirm Delete' : 'Delete'}
                </button>
              </div>
              <div className="space-y-1">
                <HcRow label="ID" value={selected.Id} mono />
                <HcRow label="Type" value={selected.HealthCheckConfig?.Type} />
                <HcRow label="IP Address" value={selected.HealthCheckConfig?.IPAddress} mono />
                <HcRow label="Port" value={selected.HealthCheckConfig?.Port?.toString()} />
                <HcRow label="Domain (FQDN)" value={selected.HealthCheckConfig?.FullyQualifiedDomainName} mono />
                <HcRow label="Resource Path" value={selected.HealthCheckConfig?.ResourcePath} mono />
                <HcRow label="Request Interval" value={selected.HealthCheckConfig?.RequestInterval ? `${selected.HealthCheckConfig.RequestInterval}s` : undefined} />
                <HcRow label="Failure Threshold" value={selected.HealthCheckConfig?.FailureThreshold?.toString()} />
                <HcRow label="Version" value={selected.HealthCheckVersion?.toString()} />
                <HcRow label="Caller Reference" value={selected.CallerReference} mono />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <HeartPulse size={28} className="text-4" />
              <p className="text-sm text-3">Select a health check to view details</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateHealthCheckModal
          onClose={() => setShowCreate(false)}
          onCreated={async (hc) => {
            setShowCreate(false)
            await loadChecks()
            setSelected(hc)
          }}
        />
      )}
    </div>
  )
}

function HcRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-theme">
      <span className="text-[10px] font-bold text-4 uppercase tracking-wider w-36 shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs break-all ${mono ? 'font-mono text-2' : 'text-2'} ${!value ? 'text-4' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}
