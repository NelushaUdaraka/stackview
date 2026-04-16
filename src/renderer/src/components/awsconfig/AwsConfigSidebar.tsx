import { useState, useMemo } from 'react'
import { Search, RefreshCw, Plus, Radio, Truck, ShieldCheck } from 'lucide-react'
import type { ConfigRecorder, ConfigDeliveryChannel, ConfigRule } from '../../types'
import type { ConfigTab } from './AwsConfigLayout'

interface Props {
  width: number
  activeTab: ConfigTab
  recorders: ConfigRecorder[]
  channels: ConfigDeliveryChannel[]
  rules: ConfigRule[]
  selectedRecorder: ConfigRecorder | null
  selectedChannel: ConfigDeliveryChannel | null
  selectedRule: ConfigRule | null
  loading: boolean
  onTabChange: (tab: ConfigTab) => void
  onSelectRecorder: (r: ConfigRecorder) => void
  onSelectChannel: (c: ConfigDeliveryChannel) => void
  onSelectRule: (r: ConfigRule) => void
  onRefresh: () => void
  onNew: () => void
}

const TABS: { key: ConfigTab; label: string; icon: React.ElementType }[] = [
  { key: 'recorders', label: 'Recorders', icon: Radio },
  { key: 'channels', label: 'Delivery', icon: Truck },
  { key: 'rules', label: 'Rules', icon: ShieldCheck },
]

const COMPLIANCE_COLOR: Record<string, string> = {
  COMPLIANT:        'text-emerald-400',
  NON_COMPLIANT:    'text-red-400',
  NOT_APPLICABLE:   'text-4',
  INSUFFICIENT_DATA:'text-amber-400',
}

export default function AwsConfigSidebar({
  width, activeTab, recorders, channels, rules,
  selectedRecorder, selectedChannel, selectedRule,
  loading, onTabChange, onSelectRecorder, onSelectChannel, onSelectRule,
  onRefresh, onNew,
}: Props) {
  const [search, setSearch] = useState('')

  const filteredRecorders = useMemo(() =>
    recorders.filter(r => r.name.toLowerCase().includes(search.toLowerCase())), [recorders, search])
  const filteredChannels = useMemo(() =>
    channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase())), [channels, search])
  const filteredRules = useMemo(() =>
    rules.filter(r => r.name.toLowerCase().includes(search.toLowerCase())), [rules, search])

  return (
    <div className="flex flex-col bg-base border-r border-theme flex-shrink-0" style={{ width }}>
      {/* tab bar */}
      <div className="flex border-b border-theme">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors
              ${activeTab === key ? 'text-amber-400 border-b-2 border-amber-400' : 'text-3 hover:text-2'}`}
          >
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>

      {/* search + refresh */}
      <div className="p-2 border-b border-theme flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-4" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter…"
            className="input-base w-full text-xs py-1.5 pl-6 pr-2"
          />
        </div>
        <button onClick={onRefresh} disabled={loading} className="btn-ghost !px-2 !py-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-4 text-xs gap-2">
            <RefreshCw size={12} className="animate-spin" /> Loading…
          </div>
        ) : activeTab === 'recorders' ? (
          filteredRecorders.length === 0 ? (
            <div className="text-center py-8 text-4 text-xs">No recorders</div>
          ) : filteredRecorders.map(r => (
            <button
              key={r.name}
              onClick={() => onSelectRecorder(r)}
              className={`w-full text-left px-3 py-2.5 border-b border-theme/50 transition-colors hover:bg-raised
                ${selectedRecorder?.name === r.name ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-1 truncate">{r.name}</p>
                <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded border flex-shrink-0
                  ${r.recording ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-4 border-theme bg-raised'}`}>
                  {r.recording ? 'REC' : 'STOPPED'}
                </span>
              </div>
              {r.roleARN && <p className="text-[10px] text-4 font-mono truncate mt-0.5">{r.roleARN.split('/').pop()}</p>}
            </button>
          ))
        ) : activeTab === 'channels' ? (
          filteredChannels.length === 0 ? (
            <div className="text-center py-8 text-4 text-xs">No delivery channels</div>
          ) : filteredChannels.map(c => (
            <button
              key={c.name}
              onClick={() => onSelectChannel(c)}
              className={`w-full text-left px-3 py-2.5 border-b border-theme/50 transition-colors hover:bg-raised
                ${selectedChannel?.name === c.name ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''}`}
            >
              <p className="text-xs font-medium text-1 truncate">{c.name}</p>
              {c.s3BucketName && <p className="text-[10px] text-4 truncate mt-0.5">{c.s3BucketName}</p>}
            </button>
          ))
        ) : (
          filteredRules.length === 0 ? (
            <div className="text-center py-8 text-4 text-xs">No config rules</div>
          ) : filteredRules.map(r => (
            <button
              key={r.name}
              onClick={() => onSelectRule(r)}
              className={`w-full text-left px-3 py-2.5 border-b border-theme/50 transition-colors hover:bg-raised
                ${selectedRule?.name === r.name ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-1 truncate">{r.name}</p>
                {r.state && (
                  <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded border flex-shrink-0
                    ${r.state === 'ACTIVE' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-4 border-theme bg-raised'}`}>
                    {r.state}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-4 truncate mt-0.5">{r.sourceIdentifier}</p>
            </button>
          ))
        )}
      </div>

      {/* footer */}
      <div className="p-2 border-t border-theme">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
        >
          <Plus size={13} />
          {activeTab === 'recorders' ? 'Add Recorder' : activeTab === 'channels' ? 'Add Channel' : 'Add Rule'}
        </button>
      </div>
    </div>
  )
}
