import { useState } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'

interface Props {
  zoneId: string
  zoneName: string
  onClose: () => void
  onCreated: () => void
}

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SRV', 'PTR', 'CAA', 'SPF']

export default function CreateRecordModal({ zoneId, zoneName, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState('A')
  const [ttl, setTtl] = useState('300')
  const [values, setValues] = useState([''])
  const [useAlias, setUseAlias] = useState(false)
  const [aliasDns, setAliasDns] = useState('')
  const [aliasZoneId, setAliasZoneId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addValue = () => setValues(v => [...v, ''])
  const removeValue = (i: number) => setValues(v => v.filter((_, idx) => idx !== i))
  const updateValue = (i: number, val: string) => setValues(v => v.map((x, idx) => idx === i ? val : x))

  const valid = name.trim().length > 0 && (
    useAlias
      ? aliasDns.trim().length > 0 && aliasZoneId.trim().length > 0
      : values.some(v => v.trim().length > 0)
  )

  const handleCreate = async () => {
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      const recordName = name.trim().endsWith('.') ? name.trim()
        : name.trim() === '@' ? zoneName
        : `${name.trim()}.${zoneName}`

      const record: any = { Name: recordName, Type: type }

      if (useAlias) {
        record.AliasTarget = {
          DNSName: aliasDns.trim(),
          EvaluateTargetHealth: false,
          HostedZoneId: aliasZoneId.trim(),
        }
      } else {
        record.TTL = parseInt(ttl, 10) || 300
        record.Records = values.filter(v => v.trim().length > 0)
      }

      const result = await window.electronAPI.route53CreateRecord(zoneId, record)
      if (result.success) {
        onCreated()
      } else {
        setError(result.error ?? 'Failed to create record')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl border border-theme p-6 my-auto max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-1">Add DNS Record</h2>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2"><X size={15} /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Record Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                placeholder="@ or subdomain"
                className="input-base w-full"
                autoFocus
              />
              <p className="text-[10px] text-4 mt-1">Use @ for zone apex</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">Type</label>
              <select
                value={type}
                onChange={e => { setType(e.target.value); setError('') }}
                className="input-base w-full"
              >
                {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="useAlias"
              checked={useAlias}
              onChange={e => setUseAlias(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <label htmlFor="useAlias" className="text-xs text-2 cursor-pointer select-none">Alias record</label>
          </div>

          {useAlias ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                  Alias DNS Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={aliasDns}
                  onChange={e => setAliasDns(e.target.value)}
                  placeholder="my-lb.us-east-1.elb.amazonaws.com"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                  Alias Hosted Zone ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={aliasZoneId}
                  onChange={e => setAliasZoneId(e.target.value)}
                  placeholder="Z35SXDOTRQ7X7K"
                  className="input-base w-full"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">TTL (seconds)</label>
                <input
                  type="number"
                  value={ttl}
                  onChange={e => setTtl(e.target.value)}
                  min="1"
                  className="input-base w-32"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                  Values <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {values.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={v}
                        onChange={e => updateValue(i, e.target.value)}
                        placeholder={type === 'MX' ? '10 mail.example.com.' : type === 'TXT' ? '"v=spf1 ..."' : '1.2.3.4'}
                        className="input-base flex-1 font-mono text-xs"
                      />
                      {values.length > 1 && (
                        <button onClick={() => removeValue(i)} className="text-red-500/60 hover:text-red-500 p-1">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addValue} className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                  <Plus size={12} /> Add value
                </button>
              </div>
            </div>
          )}
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
            Create Record
          </button>
        </div>
      </div>
    </div>
  )
}
