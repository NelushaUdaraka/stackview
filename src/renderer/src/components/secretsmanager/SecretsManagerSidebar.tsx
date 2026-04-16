import { useState } from 'react'
import { Search, Plus, Shield, Loader2 } from 'lucide-react'
import type { SecretInfo } from '../../types'

interface Props {
  secrets: SecretInfo[]
  selectedSecret: SecretInfo | null
  onSelectSecret: (secret: SecretInfo) => void
  onCreateSecret: () => void
  loading: boolean
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SecretsManagerSidebar({
  secrets,
  selectedSecret,
  onSelectSecret,
  onCreateSecret,
  loading
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = secrets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      <div
        className="px-3 pt-3 pb-2 border-b border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Secrets {!loading && secrets.length > 0 && `(${secrets.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search secrets..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : secrets.length === 0 ? (
              <>
                <Shield size={22} className="text-4 mb-2" />
                <p className="text-xs text-3">No secrets yet</p>
                <p className="text-[10px] text-4 mt-1">Create one below</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((secret) => {
            const isSelected = selectedSecret?.name === secret.name
            return (
              <button
                key={secret.name}
                onClick={() => onSelectSecret(secret)}
                title={secret.name}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left
                  border-b border-theme transition-colors
                  border-l-2 group
                  ${isSelected
                    ? 'bg-indigo-500/10 border-l-indigo-500'
                    : 'hover:bg-raised border-l-transparent'
                  }`}
              >
                <Shield
                  size={14}
                  className={`mt-0.5 shrink-0 ${isSelected ? 'text-indigo-500' : 'text-4'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium break-all line-clamp-2 leading-snug ${isSelected ? 'text-1' : 'text-2'}`}>
                    {secret.name}
                  </p>
                  {secret.createdDate && (
                    <p className="text-[10px] text-4 mt-0.5">{formatDate(secret.createdDate)}</p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateSecret}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          <Plus size={13} />
          New Secret
        </button>
      </div>
    </div>
  )
}
