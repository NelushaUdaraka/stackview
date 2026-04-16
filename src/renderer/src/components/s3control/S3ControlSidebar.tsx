import { useState } from 'react'
import { Search, Plus, Lock, Globe, Loader2, Settings } from 'lucide-react'
import type { S3ControlAccessPoint, S3ControlMRAP } from '../../types'
export type SidebarSection = 'accesspoints' | 'mraps'

interface Props {
  section: SidebarSection
  onSectionChange: (s: SidebarSection) => void
  accessPoints: S3ControlAccessPoint[]
  mraps: S3ControlMRAP[]
  selectedAP: S3ControlAccessPoint | null
  selectedMRAP: S3ControlMRAP | null
  onSelectAP: (ap: S3ControlAccessPoint) => void
  onSelectMRAP: (mrap: S3ControlMRAP) => void
  onCreateAP: () => void
  onCreateMRAP: () => void
  onOpenAccountSettings: () => void
  showAccountSettings: boolean
  loadingAPs: boolean
  loadingMRAPs: boolean
}

export default function S3ControlSidebar({
  section,
  onSectionChange,
  accessPoints,
  mraps,
  selectedAP,
  selectedMRAP,
  onSelectAP,
  onSelectMRAP,
  onCreateAP,
  onCreateMRAP,
  onOpenAccountSettings,
  showAccountSettings,
  loadingAPs,
  loadingMRAPs,
}: Props) {
  const [search, setSearch] = useState('')

  const loading = section === 'accesspoints' ? loadingAPs : loadingMRAPs
  const items = section === 'accesspoints' ? accessPoints : mraps
  const count = items.length

  const filteredAPs = accessPoints.filter(
    (ap) =>
      ap.name.toLowerCase().includes(search.toLowerCase()) ||
      ap.bucket.toLowerCase().includes(search.toLowerCase())
  )
  const filteredMRAPs = mraps.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.alias ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Section tabs */}
      <div className="flex border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <button
          onClick={() => onSectionChange('accesspoints')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2
            ${section === 'accesspoints' ? 'text-teal-500 border-teal-500' : 'text-4 border-transparent hover:text-2'}`}
        >
          <Lock size={11} />
          Access Points
        </button>
        <button
          onClick={() => onSectionChange('mraps')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2
            ${section === 'mraps' ? 'text-teal-500 border-teal-500' : 'text-4 border-transparent hover:text-2'}`}
        >
          <Globe size={11} />
          MRAPs
        </button>
      </div>

      {/* Header */}
      <div className="px-3 pt-2.5 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.3)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            {section === 'accesspoints' ? 'Access Points' : 'Multi-Region APs'}
            {!loading && count > 0 && ` (${count})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={section === 'accesspoints' ? 'Search access points...' : 'Search MRAPs...'}
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {section === 'accesspoints' ? (
          filteredAPs.length === 0 ? (
            <EmptyList loading={loadingAPs} hasItems={accessPoints.length > 0} icon={<Lock size={22} className="text-4 mb-2" />} noun="access points" />
          ) : (
            filteredAPs.map((ap) => {
              const isSelected = selectedAP?.name === ap.name
              return (
                <button
                  key={ap.name}
                  onClick={() => onSelectAP(ap)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                    ${isSelected ? 'bg-teal-500/10 border-l-teal-500' : 'hover:bg-raised border-l-transparent'}`}
                >
                  <Lock size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-teal-500' : 'text-4'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate leading-snug ${isSelected ? 'text-1' : 'text-2'}`}>
                      {ap.name}
                    </p>
                    <p className="text-[9px] text-4 font-mono truncate leading-none mt-1">
                      {ap.bucket}
                    </p>
                    {ap.networkOrigin && (
                      <span className={`inline-block mt-1 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide
                        ${ap.networkOrigin === 'VPC' ? 'bg-violet-500/10 text-violet-400' : 'bg-sky-500/10 text-sky-400'}`}>
                        {ap.networkOrigin}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )
        ) : (
          filteredMRAPs.length === 0 ? (
            <EmptyList loading={loadingMRAPs} hasItems={mraps.length > 0} icon={<Globe size={22} className="text-4 mb-2" />} noun="multi-region access points" />
          ) : (
            filteredMRAPs.map((mrap) => {
              const isSelected = selectedMRAP?.name === mrap.name
              return (
                <button
                  key={mrap.name}
                  onClick={() => onSelectMRAP(mrap)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                    ${isSelected ? 'bg-teal-500/10 border-l-teal-500' : 'hover:bg-raised border-l-transparent'}`}
                >
                  <Globe size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-teal-500' : 'text-4'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate leading-snug ${isSelected ? 'text-1' : 'text-2'}`}>
                      {mrap.name}
                    </p>
                    {mrap.alias && (
                      <p className="text-[9px] text-4 font-mono truncate leading-none mt-1">
                        {mrap.alias}
                      </p>
                    )}
                    {mrap.status && (
                      <span className={`inline-block mt-1 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide
                        ${mrap.status === 'READY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {mrap.status}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0 space-y-1.5" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onOpenAccountSettings}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
            ${showAccountSettings ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30' : 'btn-ghost text-3'}`}
        >
          <Settings size={12} />
          Account Public Access Block
        </button>
        <button
          onClick={section === 'accesspoints' ? onCreateAP : onCreateMRAP}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition-colors text-white"
          style={{ backgroundColor: 'rgb(13 148 136)' }}
        >
          <Plus size={13} />
          {section === 'accesspoints' ? 'New Access Point' : 'New MRAP'}
        </button>
      </div>
    </div>
  )
}

function EmptyList({
  loading,
  hasItems,
  icon,
  noun,
}: {
  loading: boolean
  hasItems: boolean
  icon: React.ReactNode
  noun: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
      {loading ? (
        <Loader2 size={22} className="animate-spin text-4 mb-2" />
      ) : !hasItems ? (
        <>
          {icon}
          <p className="text-xs text-3">No {noun} yet</p>
          <p className="text-[10px] text-4 mt-1">Create one below</p>
        </>
      ) : (
        <>
          <Search size={18} className="text-4 mb-2" />
          <p className="text-xs text-3">No matches</p>
        </>
      )}
    </div>
  )
}
