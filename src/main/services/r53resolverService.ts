import {
  Route53ResolverClient,
  CreateResolverEndpointCommand,
  ListResolverEndpointsCommand,
  GetResolverEndpointCommand,
  UpdateResolverEndpointCommand,
  DeleteResolverEndpointCommand,
  ListResolverEndpointIpAddressesCommand,
  AssociateResolverEndpointIpAddressCommand,
  DisassociateResolverEndpointIpAddressCommand,
  CreateResolverRuleCommand,
  ListResolverRulesCommand,
  GetResolverRuleCommand,
  UpdateResolverRuleCommand,
  DeleteResolverRuleCommand,
  AssociateResolverRuleCommand,
  DisassociateResolverRuleCommand,
  ListResolverRuleAssociationsCommand,
  CreateFirewallRuleGroupCommand,
  ListFirewallRuleGroupsCommand,
  DeleteFirewallRuleGroupCommand,
  CreateFirewallRuleCommand,
  ListFirewallRulesCommand,
  UpdateFirewallRuleCommand,
  DeleteFirewallRuleCommand,
  AssociateFirewallRuleGroupCommand,
  DisassociateFirewallRuleGroupCommand,
  ListFirewallRuleGroupAssociationsCommand,
  CreateFirewallDomainListCommand,
  ListFirewallDomainListsCommand,
  GetFirewallDomainListCommand,
  DeleteFirewallDomainListCommand,
  UpdateFirewallDomainsCommand,
  ListFirewallDomainsCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from '@aws-sdk/client-route53resolver'
import type {
  R53ResolverEndpoint,
  R53ResolverRule,
  R53RuleAssociation,
  R53FirewallRuleGroup,
  R53FirewallRule,
  R53FirewallRuleGroupAssociation,
  R53FirewallDomainList,
} from '../../shared/types'

let r53rClient: Route53ResolverClient | null = null

export function initR53ResolverClient(endpoint: string, region: string): void {
  r53rClient = new Route53ResolverClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

export function getR53ResolverClient(): Route53ResolverClient {
  if (!r53rClient) throw new Error('Route53Resolver client not initialized')
  return r53rClient
}

// ── Resolver Endpoints ────────────────────────────────────────────────────────

export async function listResolverEndpoints(): Promise<R53ResolverEndpoint[]> {
  const client = getR53ResolverClient()
  const endpoints: R53ResolverEndpoint[] = []
  let nextToken: string | undefined
  do {
    const res = await client.send(new ListResolverEndpointsCommand({ NextToken: nextToken }))
    for (const e of res.ResolverEndpoints ?? []) {
      endpoints.push({
        id: e.Id ?? '',
        name: e.Name,
        arn: e.Arn,
        direction: e.Direction ?? '',
        status: e.Status ?? '',
        statusMessage: e.StatusMessage,
        securityGroupIds: e.SecurityGroupIds ?? [],
        hostVPCId: e.HostVPCId,
        ipAddressCount: e.IpAddressCount ?? 0,
        creationTime: e.CreationTime,
      })
    }
    nextToken = res.NextToken
  } while (nextToken)
  return endpoints
}

export async function createResolverEndpoint(
  name: string,
  direction: 'INBOUND' | 'OUTBOUND',
  securityGroupIds: string[],
  ipAddresses: { SubnetId: string; Ip?: string }[]
): Promise<string> {
  const client = getR53ResolverClient()
  const res = await client.send(new CreateResolverEndpointCommand({
    CreatorRequestId: `nexus-${Date.now()}`,
    Name: name,
    Direction: direction,
    SecurityGroupIds: securityGroupIds,
    IpAddresses: ipAddresses,
  }))
  return res.ResolverEndpoint?.Id ?? ''
}

export async function getResolverEndpoint(id: string): Promise<R53ResolverEndpoint> {
  const client = getR53ResolverClient()
  const res = await client.send(new GetResolverEndpointCommand({ ResolverEndpointId: id }))
  const e = res.ResolverEndpoint!
  return {
    id: e.Id ?? '',
    name: e.Name,
    arn: e.Arn,
    direction: e.Direction ?? '',
    status: e.Status ?? '',
    statusMessage: e.StatusMessage,
    securityGroupIds: e.SecurityGroupIds ?? [],
    hostVPCId: e.HostVPCId,
    ipAddressCount: e.IpAddressCount ?? 0,
    creationTime: e.CreationTime,
  }
}

export async function updateResolverEndpoint(id: string, name: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new UpdateResolverEndpointCommand({ ResolverEndpointId: id, Name: name }))
}

export async function deleteResolverEndpoint(id: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new DeleteResolverEndpointCommand({ ResolverEndpointId: id }))
}

export async function listEndpointIpAddresses(endpointId: string) {
  const client = getR53ResolverClient()
  const res = await client.send(new ListResolverEndpointIpAddressesCommand({ ResolverEndpointId: endpointId }))
  return (res.IpAddresses ?? []).map(ip => ({
    ip: ip.Ip,
    subnetId: ip.SubnetId,
    status: ip.Status,
    ipId: ip.IpId,
  }))
}

export async function associateEndpointIpAddress(endpointId: string, subnetId: string, ip?: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new AssociateResolverEndpointIpAddressCommand({
    ResolverEndpointId: endpointId,
    IpAddress: { SubnetId: subnetId, Ip: ip },
  }))
}

export async function disassociateEndpointIpAddress(endpointId: string, ipId: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new DisassociateResolverEndpointIpAddressCommand({
    ResolverEndpointId: endpointId,
    IpAddress: { IpId: ipId },
  }))
}

// ── Resolver Rules ────────────────────────────────────────────────────────────

export async function listResolverRules(): Promise<R53ResolverRule[]> {
  const client = getR53ResolverClient()
  const rules: R53ResolverRule[] = []
  let nextToken: string | undefined
  do {
    const res = await client.send(new ListResolverRulesCommand({ NextToken: nextToken }))
    for (const r of res.ResolverRules ?? []) {
      rules.push({
        id: r.Id ?? '',
        name: r.Name,
        arn: r.Arn,
        status: r.Status ?? '',
        domainName: r.DomainName,
        ruleType: r.RuleType ?? '',
        resolverEndpointId: r.ResolverEndpointId,
        creationTime: r.CreationTime,
      })
    }
    nextToken = res.NextToken
  } while (nextToken)
  return rules
}

export async function createResolverRule(
  name: string,
  domainName: string,
  ruleType: 'FORWARD' | 'SYSTEM' | 'RECURSIVE',
  resolverEndpointId?: string,
  targetIps?: { Ip: string; Port?: number }[]
): Promise<string> {
  const client = getR53ResolverClient()
  const res = await client.send(new CreateResolverRuleCommand({
    CreatorRequestId: `nexus-${Date.now()}`,
    Name: name,
    DomainName: domainName,
    RuleType: ruleType,
    ResolverEndpointId: resolverEndpointId,
    TargetIps: targetIps,
  }))
  return res.ResolverRule?.Id ?? ''
}

export async function updateResolverRule(
  id: string,
  name: string,
  targetIps?: { Ip: string; Port?: number }[]
): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new UpdateResolverRuleCommand({
    ResolverRuleId: id,
    Config: { Name: name, TargetIps: targetIps },
  }))
}

export async function deleteResolverRule(id: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new DeleteResolverRuleCommand({ ResolverRuleId: id }))
}

export async function associateResolverRule(ruleId: string, vpcId: string, name?: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new AssociateResolverRuleCommand({
    ResolverRuleId: ruleId,
    VPCId: vpcId,
    Name: name,
  }))
}

export async function disassociateResolverRule(associationId: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new DisassociateResolverRuleCommand({ ResolverRuleAssociationId: associationId }))
}

export async function listResolverRuleAssociations(): Promise<R53RuleAssociation[]> {
  const client = getR53ResolverClient()
  const res = await client.send(new ListResolverRuleAssociationsCommand({}))
  return (res.ResolverRuleAssociations ?? []).map(a => ({
    id: a.Id ?? '',
    name: a.Name,
    resolverRuleId: a.ResolverRuleId ?? '',
    vpcId: a.VPCId,
    status: a.Status ?? '',
  }))
}

// ── Firewall Rule Groups ──────────────────────────────────────────────────────

export async function listFirewallRuleGroups(): Promise<R53FirewallRuleGroup[]> {
  const client = getR53ResolverClient()
  const groups: R53FirewallRuleGroup[] = []
  let nextToken: string | undefined
  do {
    const res = await client.send(new ListFirewallRuleGroupsCommand({ NextToken: nextToken }))
    for (const g of res.FirewallRuleGroups ?? []) {
      groups.push({
        id: g.Id ?? '',
        name: g.Name ?? '',
        arn: g.Arn,
        status: g.Status ?? '',
        shareStatus: g.ShareStatus,
        ruleCount: g.RuleCount ?? 0,
        creationTime: g.CreationTime,
      })
    }
    nextToken = res.NextToken
  } while (nextToken)
  return groups
}

export async function createFirewallRuleGroup(name: string): Promise<string> {
  const client = getR53ResolverClient()
  const res = await client.send(new CreateFirewallRuleGroupCommand({
    CreatorRequestId: `nexus-${Date.now()}`,
    Name: name,
  }))
  return res.FirewallRuleGroup?.Id ?? ''
}

export async function deleteFirewallRuleGroup(id: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new DeleteFirewallRuleGroupCommand({ FirewallRuleGroupId: id }))
}

export async function listFirewallRules(groupId: string): Promise<R53FirewallRule[]> {
  const client = getR53ResolverClient()
  const res = await client.send(new ListFirewallRulesCommand({ FirewallRuleGroupId: groupId }))
  return (res.FirewallRules ?? []).map(r => ({
    firewallRuleGroupId: r.FirewallRuleGroupId ?? '',
    firewallDomainListId: r.FirewallDomainListId ?? '',
    name: r.Name ?? '',
    priority: r.Priority ?? 0,
    action: r.Action ?? '',
    blockResponse: r.BlockResponse,
    blockOverrideDomain: r.BlockOverrideDomain,
    blockOverrideDnsType: r.BlockOverrideDnsType,
    creationTime: r.CreationTime,
  }))
}

export async function createFirewallRule(
  groupId: string,
  domainListId: string,
  name: string,
  priority: number,
  action: string,
  blockResponse?: string,
  blockOverrideDomain?: string
): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new CreateFirewallRuleCommand({
    CreatorRequestId: `nexus-${Date.now()}`,
    FirewallRuleGroupId: groupId,
    FirewallDomainListId: domainListId,
    Name: name,
    Priority: priority,
    Action: action as any,
    BlockResponse: blockResponse as any,
    BlockOverrideDomain: blockOverrideDomain,
  }))
}

export async function deleteFirewallRule(groupId: string, domainListId: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new DeleteFirewallRuleCommand({
    FirewallRuleGroupId: groupId,
    FirewallDomainListId: domainListId,
  }))
}

export async function associateFirewallRuleGroup(
  groupId: string,
  vpcId: string,
  priority: number,
  name: string
): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new AssociateFirewallRuleGroupCommand({
    CreatorRequestId: `nexus-${Date.now()}`,
    FirewallRuleGroupId: groupId,
    VpcId: vpcId,
    Priority: priority,
    Name: name,
  }))
}

export async function disassociateFirewallRuleGroup(associationId: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new DisassociateFirewallRuleGroupCommand({ FirewallRuleGroupAssociationId: associationId }))
}

export async function listFirewallRuleGroupAssociations(): Promise<R53FirewallRuleGroupAssociation[]> {
  const client = getR53ResolverClient()
  const res = await client.send(new ListFirewallRuleGroupAssociationsCommand({}))
  return (res.FirewallRuleGroupAssociations ?? []).map(a => ({
    id: a.Id ?? '',
    name: a.Name,
    firewallRuleGroupId: a.FirewallRuleGroupId ?? '',
    vpcId: a.VpcId ?? '',
    priority: a.Priority ?? 0,
    status: a.Status ?? '',
    creationTime: a.CreationTime,
  }))
}

// ── Firewall Domain Lists ─────────────────────────────────────────────────────

export async function listFirewallDomainLists(): Promise<R53FirewallDomainList[]> {
  const client = getR53ResolverClient()
  const lists: R53FirewallDomainList[] = []
  let nextToken: string | undefined
  do {
    const res = await client.send(new ListFirewallDomainListsCommand({ NextToken: nextToken }))
    for (const l of res.FirewallDomainLists ?? []) {
      lists.push({
        id: l.Id ?? '',
        name: l.Name ?? '',
        arn: l.Arn,
        domainCount: l.DomainCount ?? 0,
        status: l.Status ?? '',
        creationTime: l.CreationTime,
      })
    }
    nextToken = res.NextToken
  } while (nextToken)
  return lists
}

export async function createFirewallDomainList(name: string): Promise<string> {
  const client = getR53ResolverClient()
  const res = await client.send(new CreateFirewallDomainListCommand({
    CreatorRequestId: `nexus-${Date.now()}`,
    Name: name,
  }))
  return res.FirewallDomainList?.Id ?? ''
}

export async function deleteFirewallDomainList(id: string): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new DeleteFirewallDomainListCommand({ FirewallDomainListId: id }))
}

export async function listFirewallDomains(domainListId: string): Promise<string[]> {
  const client = getR53ResolverClient()
  const res = await client.send(new ListFirewallDomainsCommand({ FirewallDomainListId: domainListId }))
  return res.Domains ?? []
}

export async function updateFirewallDomains(
  domainListId: string,
  operation: 'ADD' | 'REMOVE' | 'REPLACE',
  domains: string[]
): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new UpdateFirewallDomainsCommand({
    FirewallDomainListId: domainListId,
    Operation: operation,
    Domains: domains,
  }))
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function listR53ResolverTags(resourceArn: string): Promise<Record<string, string>> {
  const client = getR53ResolverClient()
  const res = await client.send(new ListTagsForResourceCommand({ ResourceArn: resourceArn }))
  const tags: Record<string, string> = {}
  for (const t of res.Tags ?? []) if (t.Key) tags[t.Key] = t.Value ?? ''
  return tags
}

export async function tagR53Resource(resourceArn: string, tags: Record<string, string>): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new TagResourceCommand({
    ResourceArn: resourceArn,
    Tags: Object.entries(tags).map(([Key, Value]) => ({ Key, Value })),
  }))
}

export async function untagR53Resource(resourceArn: string, tagKeys: string[]): Promise<void> {
  const client = getR53ResolverClient()
  await client.send(new UntagResourceCommand({ ResourceArn: resourceArn, TagKeys: tagKeys }))
}
