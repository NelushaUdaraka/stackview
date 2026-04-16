import { useState, useEffect, useCallback } from 'react'
import { Globe, Trash2, RefreshCw, Database, Heart, Info } from 'lucide-react'
import IndicesPanel from './IndicesPanel'
import ClusterHealthPanel from './ClusterHealthPanel'
import type { OpenSearchDomain } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  domainName: string
  endpoint: string
  region: string
  onDeleted: () => void
}

type Tab = 'overview' | 'indices' | 'health'

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-theme last:border-0">
      <span className="text-[11px] font-semibold text-3 w-40 shrink-0 pt-0.5">{label}</span>
      <span className="text-[11px] text-1 font-mono break-all">{String(value)}</span>
    </div>
  )
}

export default function DomainDetail({ domainName, endpoint, region, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [domain, setDomain] = useState<OpenSearchDomain | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [deleting, setDeleting] = useState(false)

  const loadDomain = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.opensearchDescribeDomain(endpoint, region, domainName)
    setLoading(false)
    if (res.success && res.data) {
      setDomain(res.data)
    } else {
      showToast('error', res.error ?? 'Failed to describe domain')
    }
  }, [endpoint, region, domainName])

  useEffect(() => { loadDomain() }, [loadDomain])

  const handleDelete = async () => {
    if (!confirm(`Delete domain "${domainName}"? This cannot be undone.`)) return
    setDeleting(true)
    const res = await window.electronAPI.opensearchDeleteDomain(endpoint, region, domainName)
    setDeleting(false)
    if (res.success) {
      showToast('success', `Domain "${domainName}" deletion initiated`)
      onDeleted()
    } else {
      showToast('error', res.error ?? 'Failed to delete domain')
    }
  }

  const TABS: { id: Tab; label: string; icon: typeof Globe }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'indices', label: 'Indices', icon: Database },
    { id: 'health', label: 'Cluster Health', icon: Heart },
  ]

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Domain header */}
      <div className="px-6 pt-5 pb-0 border-b border-theme">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <Globe size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-1 tracking-tight">{domainName}</h2>
              {domain?.engineVersion && (
                <p className="text-[11px] text-3 mt-0.5">{domain.engineVersion}</p>
              )}
            </div>
            {domain?.status && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ring-inset ${
                domain.status === 'Active'
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
              }`}>
                {domain.status.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadDomain} className="p-2 rounded-xl hover:bg-raised text-3 hover:text-1 transition-colors" title="Refresh">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
            >
              {deleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete Domain
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                  isActive
                    ? 'text-purple-400 border-purple-500 bg-purple-500/5'
                    : 'text-3 border-transparent hover:text-2 hover:bg-raised'
                }`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-6 overflow-auto h-full">
            {loading && !domain ? (
              <div className="flex items-center justify-center h-32 text-3">
                <RefreshCw size={16} className="animate-spin mr-2" /> Loading…
              </div>
            ) : domain ? (
              <div className="space-y-6">
                <div className="card rounded-2xl p-4">
                  <h3 className="text-[11px] font-bold text-4 uppercase tracking-wider mb-3">Domain Details</h3>
                  <Row label="Domain Name" value={domain.name} />
                  <Row label="ARN" value={domain.arn} />
                  <Row label="Engine Version" value={domain.engineVersion} />
                  <Row label="Status" value={domain.status} />
                  <Row label="Endpoint" value={domain.endpoint} />
                </div>

                {domain.clusterConfig && (
                  <div className="card rounded-2xl p-4">
                    <h3 className="text-[11px] font-bold text-4 uppercase tracking-wider mb-3">Cluster Configuration</h3>
                    <Row label="Instance Type" value={domain.clusterConfig.InstanceType} />
                    <Row label="Instance Count" value={domain.clusterConfig.InstanceCount} />
                    <Row label="Dedicated Master" value={domain.clusterConfig.DedicatedMasterEnabled ? 'Enabled' : 'Disabled'} />
                    <Row label="Zone Awareness" value={domain.clusterConfig.ZoneAwarenessEnabled ? 'Enabled' : 'Disabled'} />
                  </div>
                )}

                {domain.endpoint && (
                  <div className="card rounded-2xl p-4">
                    <h3 className="text-[11px] font-bold text-4 uppercase tracking-wider mb-3">Data Plane Endpoint</h3>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono text-purple-400 bg-purple-500/5 px-3 py-1.5 rounded-lg flex-1 break-all">
                        {domain.endpoint}
                      </code>
                    </div>
                    <p className="text-[10px] text-4 mt-2">Use this URL for direct OpenSearch REST API calls</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'indices' && domain?.endpoint && (
          <IndicesPanel domainEndpoint={domain.endpoint} />
        )}
        {activeTab === 'indices' && !domain?.endpoint && (
          <div className="flex items-center justify-center h-32 text-3 text-xs">
            {loading ? 'Loading domain…' : 'Domain endpoint unavailable'}
          </div>
        )}

        {activeTab === 'health' && domain?.endpoint && (
          <ClusterHealthPanel domainEndpoint={domain.endpoint} />
        )}
        {activeTab === 'health' && !domain?.endpoint && (
          <div className="flex items-center justify-center h-32 text-3 text-xs">
            {loading ? 'Loading domain…' : 'Domain endpoint unavailable'}
          </div>
        )}
      </div>
    </div>
  )
}
