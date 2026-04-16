import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, R53ResolverEndpoint, R53ResolverRule, R53FirewallRuleGroup, R53FirewallDomainList } from '../../types'
import R53ResolverSidebar from './R53ResolverSidebar'
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

export default function R53ResolverLayout({ settings: _settings }: Props) {
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

  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 240, max: 420 })
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

  const detail = (() => {
    if (tab === 'endpoints' && selectedEndpoint)
      return <EndpointDetail endpoint={selectedEndpoint} onDeleted={() => { clearSelections(); load() }} onChanged={load} />
    if (tab === 'rules' && selectedRule)
      return <RuleDetail rule={selectedRule} onDeleted={() => { clearSelections(); load() }} />
    if (tab === 'fwgroups' && selectedFwGroup)
      return <FirewallRuleGroupDetail group={selectedFwGroup} domainLists={fwDomainLists} onDeleted={() => { clearSelections(); load() }} />
    if (tab === 'fwdomainlists' && selectedFwDomainList)
      return <FirewallDomainListDetail domainList={selectedFwDomainList} onDeleted={() => { clearSelections(); load() }} />
    const empty = {
      endpoints: endpoints.length === 0 && !loading ? 'No resolver endpoints' : 'Select an endpoint',
      rules: rules.length === 0 && !loading ? 'No resolver rules' : 'Select a rule',
      fwgroups: fwGroups.length === 0 && !loading ? 'No firewall rule groups' : 'Select a rule group',
      fwdomainlists: fwDomainLists.length === 0 && !loading ? 'No firewall domain lists' : 'Select a domain list',
    }
    return <div className="flex items-center justify-center h-full text-4 text-sm">{empty[tab]}</div>
  })()

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      <R53ResolverSidebar
        width={sidebarWidth} tab={tab} loading={loading}
        endpoints={endpoints} rules={rules} fwGroups={fwGroups} fwDomainLists={fwDomainLists}
        selectedEndpoint={selectedEndpoint} selectedRule={selectedRule}
        selectedFwGroup={selectedFwGroup} selectedFwDomainList={selectedFwDomainList}
        onTabChange={handleTabChange}
        onSelectEndpoint={setSelectedEndpoint} onSelectRule={setSelectedRule}
        onSelectFwGroup={setSelectedFwGroup} onSelectFwDomainList={setSelectedFwDomainList}
        onRefresh={load}
        onNew={() => {
          if (tab === 'endpoints') setShowCreateEndpoint(true)
          else if (tab === 'rules') setShowCreateRule(true)
          else if (tab === 'fwgroups') setShowCreateFwGroup(true)
          else setShowCreateFwDomainList(true)
        }}
      />
      <div className="w-1 cursor-col-resize bg-transparent hover:bg-brand-500/30 active:bg-brand-500/50 transition-colors flex-shrink-0" onMouseDown={handleResizeStart} />
      <div className="flex-1 overflow-auto min-w-0">{detail}</div>

      {showCreateEndpoint && <CreateEndpointModal onCreated={() => { setShowCreateEndpoint(false); load(); showToast('success', 'Endpoint created') }} onClose={() => setShowCreateEndpoint(false)} />}
      {showCreateRule && <CreateRuleModal endpoints={endpoints} onCreated={() => { setShowCreateRule(false); load(); showToast('success', 'Rule created') }} onClose={() => setShowCreateRule(false)} />}
      {showCreateFwGroup && <CreateFirewallRuleGroupModal onCreated={() => { setShowCreateFwGroup(false); load(); showToast('success', 'Firewall rule group created') }} onClose={() => setShowCreateFwGroup(false)} />}
      {showCreateFwDomainList && <CreateFirewallDomainListModal onCreated={() => { setShowCreateFwDomainList(false); load(); showToast('success', 'Domain list created') }} onClose={() => setShowCreateFwDomainList(false)} />}
    </div>
  )
}
