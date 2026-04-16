import { useState } from 'react'
import { Search, Plus, Loader2, HeartPulse } from 'lucide-react'
import type { Route53HostedZone } from '../../types'

interface Props {
  zones: Route53HostedZone[]
  selectedZoneId: string | null
  onSelectZone: (id: string) => void
  onCreateZone: () => void
  onShowHealthChecks: () => void
  mainView: 'zone' | 'healthchecks'
  loading: boolean
}

export default function Route53Sidebar({
  zones,
  selectedZoneId,
  onSelectZone,
  onCreateZone,
  onShowHealthChecks,
  mainView,
  loading,
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = zones.filter(z =>
    z.Name.toLowerCase().includes(search.toLowerCase()) ||
    z.Id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Hosted Zones {!loading && zones.length > 0 && `(${zones.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search zones..."
            className="sidebar-search pl-7 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Health Checks nav item */}
      <button
        onClick={onShowHealthChecks}
        className={`flex items-center gap-2.5 px-4 py-2.5 text-left border-b border-theme transition-colors border-l-2 w-full
          ${mainView === 'healthchecks'
            ? 'bg-blue-500/10 border-l-blue-500'
            : 'hover:bg-raised border-l-transparent'
          }`}
      >
        <HeartPulse size={13} className={mainView === 'healthchecks' ? 'text-blue-500' : 'text-4'} />
        <span className={`text-xs font-semibold ${mainView === 'healthchecks' ? 'text-1' : 'text-3'}`}>Health Checks</span>
      </button>

      <div className="px-3 pt-2 pb-1">
        <span className="text-[9px] font-bold text-4 uppercase tracking-wider">Zones</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : zones.length === 0 ? (
              <>
                <GlobeIcon className="text-4 mb-2" />
                <p className="text-xs text-3">No hosted zones</p>
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
          filtered.map(zone => {
            const isSelected = zone.Id === selectedZoneId
            const shortId = zone.Id.replace('/hostedzone/', '')
            return (
              <button
                key={zone.Id}
                onClick={() => onSelectZone(zone.Id)}
                title={zone.Name}
                className={`w-full flex items-start gap-2.5 px-4 py-3 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected
                    ? 'bg-blue-500/10 border-l-blue-500'
                    : 'hover:bg-raised border-l-transparent'
                  }`}
              >
                <GlobeIcon className={`shrink-0 mt-0.5 ${isSelected ? 'text-blue-500' : 'text-4 group-hover:text-3'}`} size={14} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate leading-snug ${isSelected ? 'text-1' : 'text-2 group-hover:text-1'}`}>
                    {zone.Name}
                  </p>
                  <p className="text-[10px] text-4 truncate mt-0.5">{shortId}</p>
                  {zone.Config?.PrivateZone && (
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wide text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1">Private</span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateZone}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm"
          style={{ backgroundColor: 'rgb(59 130 246)' }}
        >
          <Plus size={13} />
          New Hosted Zone
        </button>
      </div>
    </div>
  )
}

function GlobeIcon({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
