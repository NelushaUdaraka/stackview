import { useState } from 'react'
import { X, Globe } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  onClose: () => void
  onCreated: () => void
  endpoint: string
  region: string
}

const ENGINE_VERSIONS = [
  'OpenSearch_2.11', 'OpenSearch_2.9', 'OpenSearch_2.7', 'OpenSearch_2.5',
  'OpenSearch_2.3', 'OpenSearch_1.3', 'OpenSearch_1.2', 'OpenSearch_1.1',
]

const INSTANCE_TYPES = [
  't3.small.search', 't3.medium.search',
  'm5.large.search', 'm5.xlarge.search',
  'r5.large.search', 'r5.xlarge.search',
]

export default function CreateDomainModal({ onClose, onCreated, endpoint, region }: Props) {
  const { showToast } = useToastContext()
  const [domainName, setDomainName] = useState('')
  const [engineVersion, setEngineVersion] = useState('OpenSearch_2.11')
  const [instanceType, setInstanceType] = useState('t3.small.search')
  const [instanceCount, setInstanceCount] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!domainName.trim()) return
    if (!/^[a-z][a-z0-9-]{2,27}$/.test(domainName)) {
      showToast('error', 'Domain name must be 3–28 chars, start with a letter, lowercase letters/numbers/hyphens only')
      return
    }
    setLoading(true)
    const res = await window.electronAPI.opensearchCreateDomain(endpoint, region, {
      domainName: domainName.trim(),
      engineVersion,
      instanceType,
      instanceCount,
    })
    setLoading(false)
    if (res.success) {
      showToast('success', `Domain "${domainName}" creation initiated`)
      onCreated()
    } else {
      showToast('error', res.error ?? 'Failed to create domain')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-base border border-theme rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Globe size={16} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create OpenSearch Domain</h2>
              <p className="text-[11px] text-3">Provision a new search domain</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-3 hover:text-1 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Domain Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={domainName}
              onChange={e => setDomainName(e.target.value.toLowerCase())}
              placeholder="my-search-domain"
              className="input-base w-full"
              autoFocus
            />
            <p className="text-[10px] text-4 mt-1">3–28 chars, lowercase letters, numbers, hyphens. Must start with a letter.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Engine Version</label>
            <select
              value={engineVersion}
              onChange={e => setEngineVersion(e.target.value)}
              className="input-base w-full"
            >
              {ENGINE_VERSIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">Instance Type</label>
              <select
                value={instanceType}
                onChange={e => setInstanceType(e.target.value)}
                className="input-base w-full"
              >
                {INSTANCE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">Instance Count</label>
              <input
                type="number"
                min={1}
                max={20}
                value={instanceCount}
                onChange={e => setInstanceCount(Number(e.target.value))}
                className="input-base w-full"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={loading || !domainName.trim()}
            className="btn-primary text-xs px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Domain'}
          </button>
        </div>
      </div>
    </div>
  )
}
