import { useState, useCallback, useEffect } from 'react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, R53ResolverEndpoint, R53ResolverRule, R53FirewallRuleGroup, R53FirewallDomainList } from '../../types'
import { Waypoints, ArrowLeftRight, Filter, ListTree } from 'lucide-react'
import {
  ServiceShell, ResourceRail, SubviewTabs, Inspector, EmptyState, statusColor, stateOf,
  type RailItem, type Subview,
} from '../common/ui'
import EndpointDetail from './EndpointDetail'
import RuleDetail from './RuleDetail'
import FirewallRuleGroupDetail from './FirewallRuleGroupDetail'
import FirewallDomainListDetail from './FirewallDomainListDetail'
import CreateEndpointModal from './CreateEndpointModal'
import CreateRuleModal from './CreateRuleModal'
import CreateFirewallRuleGroupModal from './CreateFirewallRuleGroupModal'
import CreateFirewallDomainListModal from './CreateFirewallDomainListModal'

export type R53Tab = 'endpoints' | 'rules' | 'fwgroups' | 'fwdomainlists'

interface Props { settings: AppSettings }

export default function R53ResolverLayout({ settings }: Props) {
  const [tab, setTab] = useState<R53Tab>('endpoints')
  const [endpoints, setEndpoints] = useState<R53ResolverEndpoint[]>([])
  const [rules, setRules] = useState<R53ResolverRule[]>([])
  const [fwGroups, setFwGroups] = useState<R53FirewallRuleGroup[]>([])
  const [fwDomainLists, setFwDomainLists] = useState<R53FirewallDomainList[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<R53ResolverEndpoint | null>(null)
  const [selectedRule, setSelectedRule] = useState<R53ResolverRule | null>(null)
  const [selectedFwGroup, setSelectedFwGroup] = useState<R53FirewallRuleGroup | null>(null)
  const [selectedFwDomainList, setSelectedFwDomainList] = useState<R53FirewallDomainList | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateEndpoint, setShowCreateEndpoint] = useState(false)
  const [showCreateRule, setShowCreateRule] = useState(false)
  const [showCreateFwGroup, setShowCreateFwGroup] = useState(false)
  const [showCreateFwDomainList, setShowCreateFwDomainList] = useState(false)

  const { showToast } = useToastContext()

  const load = useCallback(async () => {
    setLoading(true)
    const [ep, ru, fg, fd] = await Promise.allSettled([
      window.electronAPI.r53rListEndpoints(),
      window.electronAPI.r53rListRules(),
      window.electronAPI.r53rListFwRuleGroups(),
      window.electronAPI.r53rListFwDomainLists(),
    ])
    if (ep.status === 'fulfilled' && ep.value.success && ep.value.data) setEndpoints(ep.value.data)
    else if (ep.status === 'fulfilled' && !ep.value.success) showToast('error', ep.value.error ?? 'Failed to load endpoints')
    if (ru.status === 'fulfilled' && ru.value.success && ru.value.data) setRules(ru.value.data)
    if (fg.status === 'fulfilled' && fg.value.success && fg.value.data) setFwGroups(fg.value.data)
    if (fd.status === 'fulfilled' && fd.value.success && fd.value.data) setFwDomainLists(fd.value.data)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clearSelections = () => {
    setSelectedEndpoint(null); setSelectedRule(null)
    setSelectedFwGroup(null); setSelectedFwDomainList(null)
  }

  const handleTabChange = (t: R53Tab) => { setTab(t); clearSelections() }

  const TABS: Subview<R53Tab>[] = [
    { id: 'endpoints', label: 'Endpoints', icon: Waypoints, count: endpoints.length },
    { id: 'rules', label: 'Rules', icon: ArrowLeftRight, count: rules.length },
    { id: 'fwgroups', label: 'Firewall Groups', icon: Filter, count: fwGroups.length },
    { id: 'fwdomainlists', label: 'Domain Lists', icon: ListTree, count: fwDomainLists.length },
  ]

  const railItems: RailItem[] =
    tab === 'endpoints'
      ? endpoints.map(e => ({
          id: e.id,
          name: e.name || e.id,
          icon: Waypoints,
          state: stateOf(e.status) ?? 'warn',
          sub: e.direction?.toUpperCase(),
          meta: `${e.ipAddressCount} IPs`,
          keywords: e.id,
        }))
      : tab === 'rules'
        ? rules.map(r => ({
            id: r.id,
            name: r.name || r.id,
            icon: ArrowLeftRight,
            state: stateOf(r.status) ?? 'warn',
            sub: r.ruleType?.toUpperCase(),
            meta: r.domainName,
            keywords: r.id,
          }))
        : tab === 'fwgroups'
          ? fwGroups.map(g => ({
              id: g.id,
              name: g.name,
              icon: Filter,
              state: stateOf(g.status) ?? 'warn',
              sub: g.status?.toUpperCase(),
              meta: `${g.ruleCount} rules`,
              keywords: g.id,
            }))
          : fwDomainLists.map(d => ({
              id: d.id,
              name: d.name,
              icon: ListTree,
              state: stateOf(d.status) ?? 'warn',
              sub: d.status?.toUpperCase(),
              meta: `${d.domainCount} domains`,
              keywords: d.id,
            }))

  const selectedRailId =
    tab === 'endpoints'
      ? (selectedEndpoint?.id ?? null)
      : tab === 'rules'
        ? (selectedRule?.id ?? null)
        : tab === 'fwgroups'
          ? (selectedFwGroup?.id ?? null)
          : (selectedFwDomainList?.id ?? null)

  const openCreate = () => {
    if (tab === 'endpoints') setShowCreateEndpoint(true)
    else if (tab === 'rules') setShowCreateRule(true)
    else if (tab === 'fwgroups') setShowCreateFwGroup(true)
    else setShowCreateFwDomainList(true)
  }

  const detail = (() => {
    if (tab === 'endpoints' && selectedEndpoint)
      return <EndpointDetail endpoint={selectedEndpoint} onDeleted={() => { clearSelections(); load() }} onChanged={load} />
    if (tab === 'rules' && selectedRule)
      return <RuleDetail rule={selectedRule} onDeleted={() => { clearSelections(); load() }} />
    if (tab === 'fwgroups' && selectedFwGroup)
      return <FirewallRuleGroupDetail group={selectedFwGroup} domainLists={fwDomainLists} onDeleted={() => { clearSelections(); load() }} />
    if (tab === 'fwdomainlists' && selectedFwDomainList)
      return <FirewallDomainListDetail domainList={selectedFwDomainList} onDeleted={() => { clearSelections(); load() }} />

    const labels: Record<R53Tab, string> = {
      endpoints: 'endpoint',
      rules: 'rule',
      fwgroups: 'rule group',
      fwdomainlists: 'domain list',
    }
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Waypoints}
          title={loading ? 'Loading\u2026' : `Select a ${labels[tab]}`}
          hint={`Pick one from the rail, or create a new ${labels[tab]}.`}
          action={
            <button onClick={openCreate} className="btn-primary">
              New {labels[tab]}
            </button>
          }
        />
      </div>
    )
  })()

  const inspector = (() => {
    if (tab === 'endpoints' && selectedEndpoint) {
      return (
        <Inspector
          kind="endpoint"
          icon={Waypoints}
          iconColor="#60a5fa"
          title={selectedEndpoint.name || selectedEndpoint.id}
          subtitle={`${selectedEndpoint.direction} resolver endpoint`}
          rows={[
            { key: 'Status', value: selectedEndpoint.status, color: statusColor(selectedEndpoint.status) },
            { key: 'Direction', value: selectedEndpoint.direction, color: 'rgb(var(--accent))' },
            { key: 'IP addresses', value: String(selectedEndpoint.ipAddressCount) },
            { key: 'Security groups', value: String(selectedEndpoint.securityGroupIds.length) },
            { key: 'VPC', value: selectedEndpoint.hostVPCId ?? '\u2014', color: 'rgb(var(--text-2))' },
            { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
          ]}
        />
      )
    }
    if (tab === 'rules' && selectedRule) {
      return (
        <Inspector
          kind="rule"
          icon={ArrowLeftRight}
          iconColor="#60a5fa"
          title={selectedRule.name || selectedRule.id}
          subtitle={selectedRule.domainName || 'Resolver rule'}
          rows={[
            { key: 'Status', value: selectedRule.status, color: statusColor(selectedRule.status) },
            { key: 'Type', value: selectedRule.ruleType, color: 'rgb(var(--accent))' },
            { key: 'Domain', value: selectedRule.domainName ?? '\u2014', color: 'rgb(var(--text-2))' },
            { key: 'Endpoint', value: selectedRule.resolverEndpointId ?? '\u2014', color: 'rgb(var(--text-2))' },
            { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
          ]}
        />
      )
    }
    if (tab === 'fwgroups' && selectedFwGroup) {
      return (
        <Inspector
          kind="rule group"
          icon={Filter}
          iconColor="#60a5fa"
          title={selectedFwGroup.name}
          subtitle="DNS Firewall rule group"
          rows={[
            { key: 'Status', value: selectedFwGroup.status, color: statusColor(selectedFwGroup.status) },
            { key: 'Rules', value: String(selectedFwGroup.ruleCount) },
            { key: 'Sharing', value: selectedFwGroup.shareStatus ?? '\u2014', color: 'rgb(var(--text-2))' },
            { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
          ]}
        />
      )
    }
    if (tab === 'fwdomainlists' && selectedFwDomainList) {
      return (
        <Inspector
          kind="domain list"
          icon={ListTree}
          iconColor="#60a5fa"
          title={selectedFwDomainList.name}
          subtitle="DNS Firewall domain list"
          rows={[
            { key: 'Status', value: selectedFwDomainList.status, color: statusColor(selectedFwDomainList.status) },
            { key: 'Domains', value: String(selectedFwDomainList.domainCount) },
            { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
          ]}
        />
      )
    }
    return undefined
  })()

  return (
    <>
      <div className="shrink-0 px-5 pt-3 border-b border-theme bg-app">
        <SubviewTabs views={TABS} active={tab} onChange={handleTabChange} />
      </div>

      <ServiceShell
        rail={
          <ResourceRail
            title={TABS.find(t => t.id === tab)!.label.toUpperCase()}
            items={railItems}
            selectedId={selectedRailId}
            onSelect={item => {
              if (tab === 'endpoints') setSelectedEndpoint(endpoints.find(e => e.id === item.id) ?? null)
              else if (tab === 'rules') setSelectedRule(rules.find(r => r.id === item.id) ?? null)
              else if (tab === 'fwgroups') setSelectedFwGroup(fwGroups.find(g => g.id === item.id) ?? null)
              else setSelectedFwDomainList(fwDomainLists.find(d => d.id === item.id) ?? null)
            }}
            icon={Waypoints}
            searchPlaceholder="Search..."
            onCreate={openCreate}
            createLabel="Create"
            loading={loading}
            emptyLabel="Nothing here yet"
          />
        }
        inspector={inspector}
      >
        {detail}
      </ServiceShell>

      {showCreateEndpoint && <CreateEndpointModal onCreated={() => { setShowCreateEndpoint(false); load(); showToast('success', 'Endpoint created') }} onClose={() => setShowCreateEndpoint(false)} />}
      {showCreateRule && <CreateRuleModal endpoints={endpoints} onCreated={() => { setShowCreateRule(false); load(); showToast('success', 'Rule created') }} onClose={() => setShowCreateRule(false)} />}
      {showCreateFwGroup && <CreateFirewallRuleGroupModal onCreated={() => { setShowCreateFwGroup(false); load(); showToast('success', 'Firewall rule group created') }} onClose={() => setShowCreateFwGroup(false)} />}
      {showCreateFwDomainList && <CreateFirewallDomainListModal onCreated={() => { setShowCreateFwDomainList(false); load(); showToast('success', 'Domain list created') }} onClose={() => setShowCreateFwDomainList(false)} />}
    </>
  )
}
