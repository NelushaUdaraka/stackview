import { useState } from 'react'
import { Search, Plus, Mail, ShieldAlert, Loader2, Globe } from 'lucide-react'
import type { SesIdentity } from '../../types'

interface Props {
  identities: SesIdentity[]
  selectedIdentity: SesIdentity | null
  onSelectIdentity: (identity: SesIdentity) => void
  onCreateIdentity: () => void
  loading?: boolean
}

export default function SesSidebar({ identities, selectedIdentity, onSelectIdentity, onCreateIdentity, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = identities.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Verified Identities {!loading && identities.length > 0 && `(${identities.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search identities..."
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
            ) : identities.length === 0 ? (
              <>
                <ShieldAlert size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No identities found</p>
                <p className="text-[10px] text-4 mt-1">Verify an email or domain first</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((identity) => {
            const isSelected = selectedIdentity?.name === identity.name
            const Icon = identity.type === 'Domain' ? Globe : Mail
            const isVerified = identity.verificationStatus === 'Success'
            return (
              <button
                key={identity.name}
                onClick={() => onSelectIdentity(identity)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-sky-500/10 border-l-sky-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <Icon size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-sky-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${isSelected ? 'text-1' : 'text-2'}`}>
                    {identity.name}
                  </p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? (isVerified ? 'text-emerald-500' : 'text-amber-500') : (isVerified ? 'text-emerald-600' : 'text-4')}`}>
                    {identity.verificationStatus}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateIdentity}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          Verify Identity
        </button>
      </div>
    </div>
  )
}
