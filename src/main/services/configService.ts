import {
  ConfigServiceClient,
  PutConfigurationRecorderCommand,
  DescribeConfigurationRecordersCommand,
  DescribeConfigurationRecorderStatusCommand,
  StartConfigurationRecorderCommand,
  StopConfigurationRecorderCommand,
  DeleteConfigurationRecorderCommand,
  PutDeliveryChannelCommand,
  DescribeDeliveryChannelsCommand,
  DescribeDeliveryChannelStatusCommand,
  DeleteDeliveryChannelCommand,
  PutConfigRuleCommand,
  DescribeConfigRulesCommand,
  DeleteConfigRuleCommand,
  GetComplianceDetailsByConfigRuleCommand,
  DescribeComplianceByConfigRuleCommand,
  ListDiscoveredResourcesCommand,
  GetResourceConfigHistoryCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from '@aws-sdk/client-config-service'
import type {
  ConfigRecorder,
  ConfigDeliveryChannel,
  ConfigRule,
  ConfigComplianceResult,
  ConfigDiscoveredResource,
  ConfigResourceHistory,
} from '../../shared/types'

let configClient: ConfigServiceClient | null = null

export function initConfigClient(endpoint: string, region: string): void {
  configClient = new ConfigServiceClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

export function getConfigClient(): ConfigServiceClient {
  if (!configClient) throw new Error('Config client not initialized')
  return configClient
}

// ── Configuration Recorders ───────────────────────────────────────────────────

export async function describeConfigurationRecorders(): Promise<ConfigRecorder[]> {
  const client = getConfigClient()
  const [recRes, statusRes] = await Promise.allSettled([
    client.send(new DescribeConfigurationRecordersCommand({})),
    client.send(new DescribeConfigurationRecorderStatusCommand({})),
  ])
  const recorders = recRes.status === 'fulfilled' ? (recRes.value.ConfigurationRecorders ?? []) : []
  const statuses = statusRes.status === 'fulfilled' ? (statusRes.value.ConfigurationRecordersStatus ?? []) : []
  return recorders.map((r) => {
    const s = statuses.find((st) => st.name === r.name)
    return {
      name: r.name ?? '',
      roleARN: r.roleARN,
      allSupported: r.recordingGroup?.allSupported ?? true,
      includeGlobalResourceTypes: r.recordingGroup?.includeGlobalResourceTypes ?? false,
      resourceTypes: r.recordingGroup?.resourceTypes ?? [],
      recording: s?.recording ?? false,
      lastStatus: s?.lastStatus,
      lastStartTime: s?.lastStartTime?.toISOString(),
      lastStopTime: s?.lastStopTime?.toISOString(),
    }
  })
}

export async function putConfigurationRecorder(
  name: string,
  roleARN: string,
  allSupported: boolean,
  includeGlobalResourceTypes: boolean,
  resourceTypes: string[]
): Promise<void> {
  const client = getConfigClient()
  await client.send(new PutConfigurationRecorderCommand({
    ConfigurationRecorder: {
      name,
      roleARN,
      recordingGroup: {
        allSupported,
        includeGlobalResourceTypes,
        resourceTypes: allSupported ? [] : resourceTypes as any[],
      },
    },
  }))
}

export async function startConfigurationRecorder(name: string): Promise<void> {
  const client = getConfigClient()
  await client.send(new StartConfigurationRecorderCommand({ ConfigurationRecorderName: name }))
}

export async function stopConfigurationRecorder(name: string): Promise<void> {
  const client = getConfigClient()
  await client.send(new StopConfigurationRecorderCommand({ ConfigurationRecorderName: name }))
}

export async function deleteConfigurationRecorder(name: string): Promise<void> {
  const client = getConfigClient()
  await client.send(new DeleteConfigurationRecorderCommand({ ConfigurationRecorderName: name }))
}

// ── Delivery Channels ─────────────────────────────────────────────────────────

export async function describeDeliveryChannels(): Promise<ConfigDeliveryChannel[]> {
  const client = getConfigClient()
  const [chanRes, statusRes] = await Promise.allSettled([
    client.send(new DescribeDeliveryChannelsCommand({})),
    client.send(new DescribeDeliveryChannelStatusCommand({})),
  ])
  const channels = chanRes.status === 'fulfilled' ? (chanRes.value.DeliveryChannels ?? []) : []
  const statuses = statusRes.status === 'fulfilled' ? (statusRes.value.DeliveryChannelsStatus ?? []) : []
  return channels.map((c) => {
    const s = statuses.find((st) => st.name === c.name)
    return {
      name: c.name ?? '',
      s3BucketName: c.s3BucketName,
      s3KeyPrefix: c.s3KeyPrefix,
      snsTopicARN: c.snsTopicARN,
      deliveryFrequency: c.configSnapshotDeliveryProperties?.deliveryFrequency,
      lastSuccessfulTime: s?.configHistoryDeliveryInfo?.lastSuccessfulTime?.toISOString(),
      lastAttemptTime: s?.configHistoryDeliveryInfo?.lastAttemptTime?.toISOString(),
    }
  })
}

export async function putDeliveryChannel(
  name: string,
  s3BucketName: string,
  s3KeyPrefix?: string,
  snsTopicARN?: string,
  deliveryFrequency?: string
): Promise<void> {
  const client = getConfigClient()
  await client.send(new PutDeliveryChannelCommand({
    DeliveryChannel: {
      name,
      s3BucketName,
      s3KeyPrefix: s3KeyPrefix || undefined,
      snsTopicARN: snsTopicARN || undefined,
      configSnapshotDeliveryProperties: deliveryFrequency
        ? { deliveryFrequency: deliveryFrequency as any }
        : undefined,
    },
  }))
}

export async function deleteDeliveryChannel(name: string): Promise<void> {
  const client = getConfigClient()
  await client.send(new DeleteDeliveryChannelCommand({ DeliveryChannelName: name }))
}

// ── Config Rules ──────────────────────────────────────────────────────────────

export async function describeConfigRules(): Promise<ConfigRule[]> {
  const client = getConfigClient()
  const result = await client.send(new DescribeConfigRulesCommand({}))
  return (result.ConfigRules ?? []).map((r) => ({
    name: r.ConfigRuleName ?? '',
    arn: r.ConfigRuleArn,
    id: r.ConfigRuleId,
    description: r.Description,
    state: r.ConfigRuleState,
    sourceOwner: r.Source?.Owner ?? '',
    sourceIdentifier: r.Source?.SourceIdentifier ?? '',
    scope: r.Scope ? {
      tagKey: r.Scope.TagKey,
      tagValue: r.Scope.TagValue,
      resourceTypes: r.Scope.ComplianceResourceTypes ?? [],
    } : undefined,
  }))
}

export async function putConfigRule(
  name: string,
  sourceOwner: 'AWS' | 'CUSTOM_LAMBDA',
  sourceIdentifier: string,
  description?: string,
  tagKey?: string,
  tagValue?: string,
  resourceTypes?: string[]
): Promise<void> {
  const client = getConfigClient()
  await client.send(new PutConfigRuleCommand({
    ConfigRule: {
      ConfigRuleName: name,
      Description: description || undefined,
      Source: { Owner: sourceOwner, SourceIdentifier: sourceIdentifier },
      Scope: (tagKey || (resourceTypes && resourceTypes.length > 0)) ? {
        TagKey: tagKey || undefined,
        TagValue: tagValue || undefined,
        ComplianceResourceTypes: resourceTypes && resourceTypes.length > 0 ? resourceTypes : undefined,
      } : undefined,
    },
  }))
}

export async function deleteConfigRule(name: string): Promise<void> {
  const client = getConfigClient()
  await client.send(new DeleteConfigRuleCommand({ ConfigRuleName: name }))
}

export async function getComplianceByConfigRule(): Promise<ConfigComplianceResult[]> {
  const client = getConfigClient()
  const result = await client.send(new DescribeComplianceByConfigRuleCommand({}))
  return (result.ComplianceByConfigRules ?? []).map((c) => ({
    ruleName: c.ConfigRuleName ?? '',
    complianceType: c.Compliance?.ComplianceType ?? 'NOT_APPLICABLE',
    compliantCount: c.Compliance?.ComplianceContributorCount?.CappedCount ?? 0,
  }))
}

export async function getComplianceDetailsByRule(
  ruleName: string
): Promise<ConfigComplianceResult[]> {
  const client = getConfigClient()
  const result = await client.send(new GetComplianceDetailsByConfigRuleCommand({ ConfigRuleName: ruleName }))
  return (result.EvaluationResults ?? []).map((r) => ({
    ruleName,
    resourceId: r.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceId,
    resourceType: r.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceType,
    complianceType: r.ComplianceType ?? 'NOT_APPLICABLE',
    annotation: r.Annotation,
    resultRecordedTime: r.ResultRecordedTime?.toISOString(),
    compliantCount: 0,
  }))
}

// ── Resource Discovery ────────────────────────────────────────────────────────

export async function listDiscoveredResources(
  resourceType: string,
  limit = 100
): Promise<ConfigDiscoveredResource[]> {
  const client = getConfigClient()
  const result = await client.send(new ListDiscoveredResourcesCommand({
    resourceType: resourceType as any,
    limit,
  }))
  return (result.resourceIdentifiers ?? []).map((r) => ({
    resourceType: r.resourceType ?? '',
    resourceId: r.resourceId ?? '',
    resourceName: r.resourceName,
    sourceName: r.sourceName,
  }))
}

export async function getResourceConfigHistory(
  resourceType: string,
  resourceId: string,
  limit = 20
): Promise<ConfigResourceHistory[]> {
  const client = getConfigClient()
  const result = await client.send(new GetResourceConfigHistoryCommand({
    resourceType: resourceType as any,
    resourceId,
    limit,
  }))
  return (result.configurationItems ?? []).map((i) => ({
    resourceType: i.resourceType ?? '',
    resourceId: i.resourceId ?? '',
    resourceName: i.resourceName,
    configurationStateId: i.configurationStateId,
    configurationItemStatus: i.configurationItemStatus,
    configurationItemCaptureTime: i.configurationItemCaptureTime?.toISOString(),
    configuration: i.configuration,
    tags: i.tags as Record<string, string> | undefined,
  }))
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function listConfigTags(resourceArn: string): Promise<Record<string, string>> {
  const client = getConfigClient()
  const result = await client.send(new ListTagsForResourceCommand({ ResourceArn: resourceArn }))
  const tags: Record<string, string> = {}
  for (const t of result.Tags ?? []) {
    if (t.Key) tags[t.Key] = t.Value ?? ''
  }
  return tags
}

export async function tagConfigResource(resourceArn: string, tags: Record<string, string>): Promise<void> {
  const client = getConfigClient()
  await client.send(new TagResourceCommand({
    ResourceArn: resourceArn,
    Tags: Object.entries(tags).map(([Key, Value]) => ({ Key, Value })),
  }))
}

export async function untagConfigResource(resourceArn: string, tagKeys: string[]): Promise<void> {
  const client = getConfigClient()
  await client.send(new UntagResourceCommand({ ResourceArn: resourceArn, TagKeys: tagKeys }))
}
