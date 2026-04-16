import { IpcMain } from 'electron'
import {
  initR53ResolverClient,
  listResolverEndpoints, createResolverEndpoint, getResolverEndpoint,
  updateResolverEndpoint, deleteResolverEndpoint, listEndpointIpAddresses,
  associateEndpointIpAddress, disassociateEndpointIpAddress,
  listResolverRules, createResolverRule, updateResolverRule, deleteResolverRule,
  associateResolverRule, disassociateResolverRule, listResolverRuleAssociations,
  listFirewallRuleGroups, createFirewallRuleGroup, deleteFirewallRuleGroup,
  listFirewallRules, createFirewallRule, deleteFirewallRule,
  associateFirewallRuleGroup, disassociateFirewallRuleGroup, listFirewallRuleGroupAssociations,
  listFirewallDomainLists, createFirewallDomainList, deleteFirewallDomainList,
  listFirewallDomains, updateFirewallDomains,
  listR53ResolverTags, tagR53Resource, untagR53Resource,
} from '../services/r53resolverService'

export function registerR53ResolverHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('r53r:reinit', (_e, endpoint: string, region: string) => {
    initR53ResolverClient(endpoint, region)
  })

  // Endpoints
  ipcMain.handle('r53r:listEndpoints', async () => {
    try { return { success: true, data: await listResolverEndpoints() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:createEndpoint', async (_e, name: string, direction: string, sgIds: string[], ips: any[]) => {
    try { return { success: true, data: await createResolverEndpoint(name, direction as any, sgIds, ips) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:getEndpoint', async (_e, id: string) => {
    try { return { success: true, data: await getResolverEndpoint(id) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:updateEndpoint', async (_e, id: string, name: string) => {
    try { await updateResolverEndpoint(id, name); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:deleteEndpoint', async (_e, id: string) => {
    try { await deleteResolverEndpoint(id); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:listEndpointIps', async (_e, id: string) => {
    try { return { success: true, data: await listEndpointIpAddresses(id) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:associateEndpointIp', async (_e, endpointId: string, subnetId: string, ip?: string) => {
    try { await associateEndpointIpAddress(endpointId, subnetId, ip); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:disassociateEndpointIp', async (_e, endpointId: string, ipId: string) => {
    try { await disassociateEndpointIpAddress(endpointId, ipId); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  // Rules
  ipcMain.handle('r53r:listRules', async () => {
    try { return { success: true, data: await listResolverRules() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:createRule', async (_e, name: string, domainName: string, ruleType: string, endpointId?: string, targetIps?: any[]) => {
    try { return { success: true, data: await createResolverRule(name, domainName, ruleType as any, endpointId, targetIps) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:updateRule', async (_e, id: string, name: string, targetIps?: any[]) => {
    try { await updateResolverRule(id, name, targetIps); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:deleteRule', async (_e, id: string) => {
    try { await deleteResolverRule(id); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:associateRule', async (_e, ruleId: string, vpcId: string, name?: string) => {
    try { await associateResolverRule(ruleId, vpcId, name); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:disassociateRule', async (_e, associationId: string) => {
    try { await disassociateResolverRule(associationId); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:listRuleAssociations', async () => {
    try { return { success: true, data: await listResolverRuleAssociations() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  // Firewall Rule Groups
  ipcMain.handle('r53r:listFwRuleGroups', async () => {
    try { return { success: true, data: await listFirewallRuleGroups() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:createFwRuleGroup', async (_e, name: string) => {
    try { return { success: true, data: await createFirewallRuleGroup(name) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:deleteFwRuleGroup', async (_e, id: string) => {
    try { await deleteFirewallRuleGroup(id); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:listFwRules', async (_e, groupId: string) => {
    try { return { success: true, data: await listFirewallRules(groupId) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:createFwRule', async (_e, groupId: string, domainListId: string, name: string, priority: number, action: string, blockResponse?: string, blockOverrideDomain?: string) => {
    try { await createFirewallRule(groupId, domainListId, name, priority, action, blockResponse, blockOverrideDomain); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:deleteFwRule', async (_e, groupId: string, domainListId: string) => {
    try { await deleteFirewallRule(groupId, domainListId); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:associateFwRuleGroup', async (_e, groupId: string, vpcId: string, priority: number, name: string) => {
    try { await associateFirewallRuleGroup(groupId, vpcId, priority, name); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:disassociateFwRuleGroup', async (_e, associationId: string) => {
    try { await disassociateFirewallRuleGroup(associationId); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:listFwRuleGroupAssociations', async () => {
    try { return { success: true, data: await listFirewallRuleGroupAssociations() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  // Firewall Domain Lists
  ipcMain.handle('r53r:listFwDomainLists', async () => {
    try { return { success: true, data: await listFirewallDomainLists() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:createFwDomainList', async (_e, name: string) => {
    try { return { success: true, data: await createFirewallDomainList(name) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:deleteFwDomainList', async (_e, id: string) => {
    try { await deleteFirewallDomainList(id); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:listFwDomains', async (_e, domainListId: string) => {
    try { return { success: true, data: await listFirewallDomains(domainListId) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:updateFwDomains', async (_e, domainListId: string, operation: string, domains: string[]) => {
    try { await updateFirewallDomains(domainListId, operation as any, domains); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  // Tags
  ipcMain.handle('r53r:listTags', async (_e, resourceArn: string) => {
    try { return { success: true, data: await listR53ResolverTags(resourceArn) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:tagResource', async (_e, resourceArn: string, tags: Record<string, string>) => {
    try { await tagR53Resource(resourceArn, tags); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
  ipcMain.handle('r53r:untagResource', async (_e, resourceArn: string, tagKeys: string[]) => {
    try { await untagR53Resource(resourceArn, tagKeys); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
}
