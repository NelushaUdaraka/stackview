import { useState, useCallback, useEffect } from 'react'
import { Key, Plus, Trash2, Loader2, Search, Copy, Download } from 'lucide-react'
import type { Ec2KeyPair } from '../../types'

export default function KeyPairsView() {
  const [keyPairs, setKeyPairs] = useState<Ec2KeyPair[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKeyMaterial, setNewKeyMaterial] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.ec2ListKeyPairs()
    if (res.success && res.data) setKeyPairs(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    setError(null)
    const res = await window.electronAPI.ec2CreateKeyPair(newKeyName.trim())
    setCreating(false)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    setNewKeyMaterial(res.data?.keyMaterial ?? null)
    setNewKeyName('')
    load()
  }

  const handleDelete = async (keyName: string) => {
    if (!confirm(`Delete key pair "${keyName}"?`)) return
    const res = await window.electronAPI.ec2DeleteKeyPair(keyName)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    load()
  }

  const filtered = keyPairs.filter(k =>
    (k.KeyName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            className="sidebar-search pl-7 w-full"
            placeholder="Search key pairs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1" />
        <span className="text-xs text-3">{filtered.length} key pair{filtered.length !== 1 ? 's' : ''}</span>
        {loading && <Loader2 size={13} className="animate-spin text-3" />}
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
        >
          <Plus size={13} /> Create Key Pair
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="px-4 py-3 border-b border-theme shrink-0 flex items-center gap-2" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
          <Key size={13} className="text-orange-500 shrink-0" />
          <input
            className="input-base text-sm flex-1"
            placeholder="Key pair name"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newKeyName.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Create
          </button>
          <button onClick={() => { setShowCreate(false); setNewKeyName('') }} className="btn-ghost text-xs rounded-lg">Cancel</button>
        </div>
      )}

      {/* Private key material download */}
      {newKeyMaterial && (
        <div className="mx-4 mt-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 shrink-0">
          <p className="text-xs font-semibold text-emerald-400 mb-1">Key pair created — save your private key now!</p>
          <p className="text-[10px] text-3 mb-2">This is the only time you can download the key material.</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKeyMaterial)
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs btn-ghost rounded-lg"
            >
              <Copy size={12} /> Copy
            </button>
            <button
              onClick={() => {
                const blob = new Blob([newKeyMaterial], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'key-pair.pem'
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs btn-ghost rounded-lg"
            >
              <Download size={12} /> Download .pem
            </button>
            <button onClick={() => setNewKeyMaterial(null)} className="ml-auto btn-ghost text-xs rounded-lg px-2 py-1">Dismiss</button>
          </div>
        </div>
      )}

      {error && (
        <p className="mx-4 mt-2 text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 shrink-0">{error}</p>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <Key size={32} className="text-4 mb-3 opacity-20" />
            <p className="text-sm text-3 font-medium">{loading ? 'Loading...' : 'No key pairs found'}</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
              <tr className="border-b border-theme">
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Name</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Key Pair ID</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Fingerprint</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Created</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(kp => (
                <tr key={kp.KeyPairId} className="border-b border-theme hover:bg-raised transition-colors">
                  <td className="px-4 py-2.5 font-medium text-1">{kp.KeyName}</td>
                  <td className="px-4 py-2.5 font-mono text-2">{kp.KeyPairId}</td>
                  <td className="px-4 py-2.5 font-mono text-3 max-w-xs truncate">{kp.KeyFingerprint}</td>
                  <td className="px-4 py-2.5 text-3">{kp.CreateTime ? new Date(kp.CreateTime).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(kp.KeyName!)}
                      className="p-1.5 text-3 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
