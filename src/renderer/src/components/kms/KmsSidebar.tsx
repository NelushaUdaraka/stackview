import { useState } from 'react'
import { Search, Plus, KeyRound, Loader2, Key } from 'lucide-react'
import type { KmsKey } from '../../types'

interface Props {
  keys: KmsKey[]
  selectedKey: KmsKey | null
  onSelectKey: (k: KmsKey) => void
  onCreateKey: () => void
  loading?: boolean
}

export default function KmsSidebar({ keys, selectedKey, onSelectKey, onCreateKey, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = keys.filter(k => {
    const s = search.toLowerCase()
    if (k.keyId.toLowerCase().includes(s)) return true
    if (k.aliases.some(a => a.aliasName.toLowerCase().includes(s))) return true
    return false
  })

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Customer Keys {!loading && keys.length > 0 && `(${keys.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search keys/aliases..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : keys.length === 0 ? (
              <>
                <KeyRound size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No keys found</p>
                <p className="text-[10px] text-4 mt-1">Create a customer symmetric key</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((k) => {
            const isSelected = selectedKey?.keyId === k.keyId
            const isPendingDelete = k.state === 'PendingDeletion'
            const isEnabled = k.state === 'Enabled'
            
            const stateColor = isEnabled ? 'emerald' : isPendingDelete ? 'red' : 'amber'
            const primaryAlias = k.aliases.length > 0 ? k.aliases[0].aliasName : 'Custom Key'

            return (
              <button
                key={k.keyId}
                onClick={() => onSelectKey(k)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-violet-500/10 border-l-violet-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <Key size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-violet-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${isSelected ? 'text-1' : 'text-2'}`}>
                    {primaryAlias}
                  </p>
                  <div className="flex items-center gap-1.5 justify-between">
                    <p className={`text-[9px] font-mono tracking-wider ${isSelected ? 'text-violet-600' : 'text-4'} truncate`}>
                      {k.keyId.split('-')[0]}...
                    </p>
                    <p className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? `text-${stateColor}-500` : `text-${stateColor}-600`}`}>
                      {k.state}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateKey}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          Create Symmetric Key
        </button>
      </div>
    </div>
  )
}
