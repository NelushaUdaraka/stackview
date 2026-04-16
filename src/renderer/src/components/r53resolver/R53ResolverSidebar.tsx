import { useState, useMemo } from 'react'
import { Search, Plus, Network, GitBranch, Shield, List, Loader2, Waypoints } from 'lucide-react'
import type { R53ResolverEndpoint, R53ResolverRule, R53FirewallRuleGroup, R53FirewallDomainList } from '../../types'
import type { R53Tab } from './R53ResolverLayout'

interface Props {
  width: number
  tab: R53Tab
  loading: boolean
  endpoints: R53ResolverEndpoint[]
  rules: R53ResolverRule[]
  fwGroups: R53FirewallRuleGroup[]
  fwDomainLists: R53FirewallDomainList[]
  selectedEndpoint: R53ResolverEndpoint | null
  selectedRule: R53ResolverRule | null
  selectedFwGroup: R53FirewallRuleGroup | null
  selectedFwDomainList: R53FirewallDomainList | null
  onTabChange: (tab: R53Tab) => void
  onSelectEndpoint: (e: R53ResolverEndpoint) => void
  onSelectRule: (r: R53ResolverRule) => void
  onSelectFwGroup: (g: R53FirewallRuleGroup) => void
  onSelectFwDomainList: (d: R53FirewallDomainList) => void
  onRefresh: () => void
  onNew: () => void
}

const TABS: { key: R53Tab; label: string; icon: React.ElementType }[] = [
  { key: 'endpoints',     label: 'Endpoints',    icon: Network    },
  { key: 'rules',         label: 'Rules',        icon: GitBranch  },
  { key: 'fwgroups',      label: 'FW Groups',    icon: Shield     },
  { key: 'fwdomainlists', label: 'Domain Lists', icon: List       },
]

const ENDPOINT_STATUS_COLOR: Record<string, string> = {
  OPERATIONAL:   'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  CREATING:      'text-amber-400 border-amber-500/30 bg-amber-500/10',
  DELETING:      'text-red-400 border-red-500/30 bg-red-500/10',
  ACTION_NEEDED: 'text-red-400 border-red-500/30 bg-red-500/10',
}

const footerLabel: Record<R53Tab, string> = {
  endpoints:     'Add Endpoint',
  rules:         'Add Rule',
  fwgroups:      'Add FW Group',
  fwdomainlists: 'Add Domain List',
}

export default function R53ResolverSidebar({
  width, tab, loading,
  endpoints, rules, fwGroups, fwDomainLists,
  selectedEndpoint, selectedRule, selectedFwGroup, selectedFwDomainList,
  onTabChange, onSelectEndpoint, onSelectRule, onSelectFwGroup, onSelectFwDomainList,
  onRefresh, onNew,
}: Props) {
  const [search, setSearch] = useState('')
  const q = search.toLowerCase()

  const filteredEndpoints    = useMemo(() => endpoints.filter(e    => (e.name ?? e.id).toLowerCase().includes(q)), [endpoints, q])
  const filteredRules        = useMemo(() => rules.filter(r        => (r.name ?? r.id).toLowerCase().includes(q)), [rules, q])
  const filteredFwGroups     = useMemo(() => fwGroups.filter(g     => g.name.toLowerCase().includes(q)),           [fwGroups, q])
  const filteredFwDomainLists = useMemo(() => fwDomainLists.filter(d => d.name.toLowerCase().includes(q)),         [fwDomainLists, q])

  return (
    <div className="flex flex-col h-full border-r border-theme flex-shrink-0" style={{ width, backgroundColor: 'rgb(var(--bg-base))' }}>

      {/* tab bar */}
      <div className="border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { onTabChange(key); setSearch('') }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-bold uppercase tracking-wide transition-colors
                ${tab === key ? 'text-blue-400 border-b-2 border-blue-400' : 'text-3 hover:text-2'}`}
            >
              <Icon size={11} />{label}
            </button>
          ))}
        </div>

        <div className="px-3 pt-2 pb-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-4 uppercase tracking-wider flex items-center gap-1.5">
              {TABS.find(t => t.key === tab)?.label}
              {!loading && (() => {
                const count = tab === 'endpoints' ? endpoints.length : tab === 'rules' ? rules.length : tab === 'fwgroups' ? fwGroups.length : fwDomainLists.length
                return count > 0 ? ` (${count})` : ''
              })()}
            </span>
            {loading
              ? <Loader2 size={11} className="animate-spin text-3" />
              : <button onClick={onRefresh} className="text-3 hover:text-1 transition-colors"><Waypoints size={12} className="rotate-90" /></button>
            }
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter…"
              className="sidebar-search pl-7"
            />
          </div>
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            <Loader2 size={22} className="animate-spin text-4 mb-2" />
          </div>
        ) : tab === 'endpoints' ? (
          filteredEndpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
              <Network size={22} className="text-4 mb-2 opacity-20" />
              <p className="text-xs text-3 font-medium">{endpoints.length === 0 ? 'No endpoints' : 'No matches'}</p>
            </div>
          ) : filteredEndpoints.map(e => {
            const sel = selectedEndpoint?.id === e.id
            return (
              <button key={e.id} onClick={() => onSelectEndpoint(e)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2
                  ${sel ? 'bg-blue-500/10 border-l-blue-500' : 'hover:bg-raised border-l-transparent'}`}>
                <Network size={13} className={`mt-0.5 shrink-0 ${sel ? 'text-blue-400' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={`text-xs font-medium truncate leading-snug ${sel ? 'text-1' : 'text-2'}`}>{e.name ?? e.id}</p>
                    <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded border flex-shrink-0
                      ${ENDPOINT_STATUS_COLOR[e.status] ?? 'text-4 border-theme'}`}>{e.direction}</span>
                  </div>
                  <p className="text-[9px] text-4 truncate">{e.status}</p>
                </div>
              </button>
            )
          })
        ) : tab === 'rules' ? (
          filteredRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
              <GitBranch size={22} className="text-4 mb-2 opacity-20" />
              <p className="text-xs text-3 font-medium">{rules.length === 0 ? 'No rules' : 'No matches'}</p>
            </div>
          ) : filteredRules.map(r => {
            const sel = selectedRule?.id === r.id
            return (
              <button key={r.id} onClick={() => onSelectRule(r)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2
                  ${sel ? 'bg-blue-500/10 border-l-blue-500' : 'hover:bg-raised border-l-transparent'}`}>
                <GitBranch size={13} className={`mt-0.5 shrink-0 ${sel ? 'text-blue-400' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={`text-xs font-medium truncate leading-snug ${sel ? 'text-1' : 'text-2'}`}>{r.name ?? r.id}</p>
                    <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded border text-4 border-theme flex-shrink-0">{r.ruleType}</span>
                  </div>
                  {r.domainName && <p className="text-[9px] text-4 truncate">{r.domainName}</p>}
                </div>
              </button>
            )
          })
        ) : tab === 'fwgroups' ? (
          filteredFwGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
              <Shield size={22} className="text-4 mb-2 opacity-20" />
              <p className="text-xs text-3 font-medium">{fwGroups.length === 0 ? 'No firewall rule groups' : 'No matches'}</p>
            </div>
          ) : filteredFwGroups.map(g => {
            const sel = selectedFwGroup?.id === g.id
            return (
              <button key={g.id} onClick={() => onSelectFwGroup(g)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2
                  ${sel ? 'bg-blue-500/10 border-l-blue-500' : 'hover:bg-raised border-l-transparent'}`}>
                <Shield size={13} className={`mt-0.5 shrink-0 ${sel ? 'text-blue-400' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${sel ? 'text-1' : 'text-2'}`}>{g.name}</p>
                  <p className="text-[9px] text-4 truncate">{g.ruleCount} rule{g.ruleCount !== 1 ? 's' : ''} · {g.status}</p>
                </div>
              </button>
            )
          })
        ) : (
          filteredFwDomainLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
              <List size={22} className="text-4 mb-2 opacity-20" />
              <p className="text-xs text-3 font-medium">{fwDomainLists.length === 0 ? 'No domain lists' : 'No matches'}</p>
            </div>
          ) : filteredFwDomainLists.map(d => {
            const sel = selectedFwDomainList?.id === d.id
            return (
              <button key={d.id} onClick={() => onSelectFwDomainList(d)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2
                  ${sel ? 'bg-blue-500/10 border-l-blue-500' : 'hover:bg-raised border-l-transparent'}`}>
                <List size={13} className={`mt-0.5 shrink-0 ${sel ? 'text-blue-400' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${sel ? 'text-1' : 'text-2'}`}>{d.name}</p>
                  <p className="text-[9px] text-4 truncate">{d.domainCount} domain{d.domainCount !== 1 ? 's' : ''} · {d.status}</p>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* footer */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} /> {footerLabel[tab]}
        </button>
      </div>
    </div>
  )
}
