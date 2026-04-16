import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Route53HealthCheck } from '../../types'

interface Props {
  onClose: () => void
  onCreated: (hc: Route53HealthCheck) => void
}

const CHECK_TYPES = ['HTTP', 'HTTPS', 'HTTP_STR_MATCH', 'HTTPS_STR_MATCH', 'TCP', 'CALCULATED', 'CLOUDWATCH_METRIC']

export default function CreateHealthCheckModal({ onClose, onCreated }: Props) {
  const [type, setType] = useState('HTTP')
  const [ipAddress, setIpAddress] = useState('')
  const [fqdn, setFqdn] = useState('')
  const [port, setPort] = useState('80')
  const [resourcePath, setResourcePath] = useState('/')
  const [requestInterval, setRequestInterval] = useState('30')
  const [failureThreshold, setFailureThreshold] = useState('3')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const needsEndpoint = !['CALCULATED', 'CLOUDWATCH_METRIC'].includes(type)
  const valid = !needsEndpoint || (ipAddress.trim().length > 0 || fqdn.trim().length > 0)

  const handleCreate = async () => {
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      const result = await window.electronAPI.route53CreateHealthCheck({
        type,
        ipAddress: ipAddress.trim() || undefined,
        fqdn: fqdn.trim() || undefined,
        port: parseInt(port, 10) || undefined,
        resourcePath: resourcePath.trim() || undefined,
        requestInterval: parseInt(requestInterval, 10) || 30,
        failureThreshold: parseInt(failureThreshold, 10) || 3,
      })
      if (result.success && result.data) {
        onCreated(result.data)
      } else {
        setError(result.error ?? 'Failed to create health check')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl border border-theme p-6 my-auto max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-1">Create Health Check</h2>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2"><X size={15} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="input-base w-full">
              {CHECK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {needsEndpoint && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                  IP Address <span className="text-3">(or FQDN below)</span>
                </label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={e => { setIpAddress(e.target.value); setError('') }}
                  placeholder="1.2.3.4"
                  className="input-base w-full font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                  Domain Name (FQDN)
                </label>
                <input
                  type="text"
                  value={fqdn}
                  onChange={e => { setFqdn(e.target.value); setError('') }}
                  placeholder="example.com"
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    min="1"
                    max="65535"
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">Resource Path</label>
                  <input
                    type="text"
                    value={resourcePath}
                    onChange={e => setResourcePath(e.target.value)}
                    placeholder="/health"
                    className="input-base w-full font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">Request Interval (s)</label>
              <select value={requestInterval} onChange={e => setRequestInterval(e.target.value)} className="input-base w-full">
                <option value="10">10</option>
                <option value="30">30</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">Failure Threshold</label>
              <input
                type="number"
                value={failureThreshold}
                onChange={e => setFailureThreshold(e.target.value)}
                min="1"
                max="10"
                className="input-base w-full"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 break-all">{error}</p>
        )}

        <div className="flex gap-3 justify-end pt-5 border-t border-theme mt-5">
          <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-4">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!valid || loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'rgb(59 130 246)' }}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
