import {
  ResourceGroupsClient,
  CreateGroupCommand,
  DeleteGroupCommand,
  GetGroupCommand,
  GetGroupConfigurationCommand,
  GetGroupQueryCommand,
  GetTagsCommand,
  ListGroupsCommand,
  UpdateGroupCommand,
  UpdateGroupQueryCommand,
  PutGroupConfigurationCommand,
  ListTagSyncTasksCommand,
  GetTagSyncTaskCommand,
  StartTagSyncTaskCommand,
  CancelTagSyncTaskCommand,
} from '@aws-sdk/client-resource-groups'
import {
  ResourceGroupsTaggingAPIClient,
  GetResourcesCommand,
  GetTagKeysCommand,
  GetTagValuesCommand,
  TagResourcesCommand,
  UntagResourcesCommand,
} from '@aws-sdk/client-resource-groups-tagging-api'
import type { RgGroup, RgTagSyncTask, RgTaggedResource } from '../../shared/types'

let rgClient: ResourceGroupsClient | null = null
let taggingClient: ResourceGroupsTaggingAPIClient | null = null

export function initResourceGroupsClient(endpoint: string, region: string): void {
  rgClient = new ResourceGroupsClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
  taggingClient = new ResourceGroupsTaggingAPIClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

function getRgClient(): ResourceGroupsClient {
  if (!rgClient) throw new Error('Resource Groups client not initialized')
  return rgClient
}

function getTaggingClient(): ResourceGroupsTaggingAPIClient {
  if (!taggingClient) throw new Error('Resource Groups Tagging client not initialized')
  return taggingClient
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function listGroups(): Promise<RgGroup[]> {
  const client = getRgClient()
  const groups: RgGroup[] = []
  let nextToken: string | undefined
  do {
    const res = await client.send(new ListGroupsCommand({ NextToken: nextToken, MaxResults: 50 }))
    for (const g of res.GroupIdentifiers ?? []) {
      groups.push({ groupArn: g.GroupArn ?? '', name: g.GroupName ?? '' })
    }
    nextToken = res.NextToken
  } while (nextToken)
  return groups
}

export async function createGroup(
  name: string,
  description: string,
  queryType: 'TAG_FILTERS_1_0' | 'CLOUDFORMATION_STACK_1_0',
  queryJson: string
): Promise<RgGroup> {
  const client = getRgClient()
  const res = await client.send(new CreateGroupCommand({
    Name: name,
    Description: description || undefined,
    ResourceQuery: { Type: queryType, Query: queryJson },
  }))
  return {
    groupArn: res.Group?.GroupArn ?? '',
    name: res.Group?.Name ?? name,
    description: res.Group?.Description,
  }
}

export async function deleteGroup(groupName: string): Promise<void> {
  const client = getRgClient()
  await client.send(new DeleteGroupCommand({ GroupName: groupName }))
}

export async function getGroup(groupName: string): Promise<{
  group: RgGroup
  query?: { type: string; query: string }
  tags?: Record<string, string>
  configuration?: any[]
}> {
  const client = getRgClient()
  const [groupRes, queryRes, tagsRes] = await Promise.allSettled([
    client.send(new GetGroupCommand({ GroupName: groupName })),
    client.send(new GetGroupQueryCommand({ GroupName: groupName })),
    client.send(new GetTagsCommand({ Arn: groupName })),
  ])

  const groupData = groupRes.status === 'fulfilled' ? groupRes.value.Group : undefined
  const queryData = queryRes.status === 'fulfilled' ? queryRes.value.GroupQuery?.ResourceQuery : undefined
  const tagsData = tagsRes.status === 'fulfilled' ? tagsRes.value.Tags : undefined

  let configuration: any[] | undefined
  try {
    const cfgRes = await client.send(new GetGroupConfigurationCommand({ Group: groupName }))
    configuration = cfgRes.GroupConfiguration?.Configuration ?? []
  } catch { /* group may not have configuration */ }

  return {
    group: {
      groupArn: groupData?.GroupArn ?? '',
      name: groupData?.Name ?? groupName,
      description: groupData?.Description,
    },
    query: queryData ? { type: queryData.Type ?? '', query: queryData.Query ?? '' } : undefined,
    tags: tagsData as Record<string, string> | undefined,
    configuration,
  }
}

export async function updateGroup(groupName: string, description: string): Promise<void> {
  const client = getRgClient()
  await client.send(new UpdateGroupCommand({ GroupName: groupName, Description: description }))
}

export async function updateGroupQuery(
  groupName: string,
  queryType: 'TAG_FILTERS_1_0' | 'CLOUDFORMATION_STACK_1_0',
  queryJson: string
): Promise<void> {
  const client = getRgClient()
  await client.send(new UpdateGroupQueryCommand({
    GroupName: groupName,
    ResourceQuery: { Type: queryType, Query: queryJson },
  }))
}

export async function putGroupConfiguration(groupName: string, configuration: any[]): Promise<void> {
  const client = getRgClient()
  await client.send(new PutGroupConfigurationCommand({ Group: groupName, Configuration: configuration }))
}

// ── Tag Sync Tasks ────────────────────────────────────────────────────────────

export async function listTagSyncTasks(groupName?: string): Promise<RgTagSyncTask[]> {
  const client = getRgClient()
  const tasks: RgTagSyncTask[] = []
  let nextToken: string | undefined
  do {
    const res = await client.send(new ListTagSyncTasksCommand({
      Filters: groupName ? [{ GroupName: groupName }] : undefined,
      NextToken: nextToken,
    }))
    for (const t of res.TagSyncTasks ?? []) {
      tasks.push({
        taskArn: t.TaskArn ?? '',
        groupName: t.GroupName ?? '',
        groupArn: t.GroupArn ?? '',
        tagKey: t.TagKey ?? '',
        tagValue: t.TagValue ?? '',
        status: t.Status ?? '',
        errorMessage: t.ErrorMessage,
        createdAt: t.CreatedAt?.toISOString(),
      })
    }
    nextToken = res.NextToken
  } while (nextToken)
  return tasks
}

export async function getTagSyncTask(taskArn: string): Promise<RgTagSyncTask> {
  const client = getRgClient()
  const res = await client.send(new GetTagSyncTaskCommand({ TaskArn: taskArn }))
  return {
    taskArn: res.TaskArn ?? '',
    groupName: res.GroupName ?? '',
    groupArn: res.GroupArn ?? '',
    tagKey: res.TagKey ?? '',
    tagValue: res.TagValue ?? '',
    status: res.Status ?? '',
    errorMessage: res.ErrorMessage,
    createdAt: res.CreatedAt?.toISOString(),
  }
}

export async function startTagSyncTask(
  groupArn: string,
  tagKey: string,
  tagValue: string,
  roleArn: string
): Promise<string> {
  const client = getRgClient()
  const res = await client.send(new StartTagSyncTaskCommand({
    Group: groupArn,
    TagKey: tagKey,
    TagValue: tagValue,
    RoleArn: roleArn,
  }))
  return res.TaskArn ?? ''
}

export async function cancelTagSyncTask(taskArn: string): Promise<void> {
  const client = getRgClient()
  await client.send(new CancelTagSyncTaskCommand({ TaskArn: taskArn }))
}

// ── Tagging API ───────────────────────────────────────────────────────────────

export async function getTagKeys(): Promise<string[]> {
  const client = getTaggingClient()
  const keys: string[] = []
  let paginationToken: string | undefined
  do {
    const res = await client.send(new GetTagKeysCommand({ PaginationToken: paginationToken }))
    keys.push(...(res.TagKeys ?? []))
    paginationToken = res.PaginationToken
  } while (paginationToken)
  return keys
}

export async function getTagValues(key: string): Promise<string[]> {
  const client = getTaggingClient()
  const values: string[] = []
  let paginationToken: string | undefined
  do {
    const res = await client.send(new GetTagValuesCommand({ Key: key, PaginationToken: paginationToken }))
    values.push(...(res.TagValues ?? []))
    paginationToken = res.PaginationToken
  } while (paginationToken)
  return values
}

export async function getResources(
  tagFilters?: { key: string; values: string[] }[],
  resourceTypes?: string[]
): Promise<RgTaggedResource[]> {
  const client = getTaggingClient()
  const resources: RgTaggedResource[] = []
  let paginationToken: string | undefined
  do {
    const res = await client.send(new GetResourcesCommand({
      TagFilters: tagFilters?.map((f) => ({ Key: f.key, Values: f.values })),
      ResourceTypeFilters: resourceTypes && resourceTypes.length > 0 ? resourceTypes : undefined,
      PaginationToken: paginationToken,
    }))
    for (const r of res.ResourceTagMappingList ?? []) {
      resources.push({
        resourceArn: r.ResourceARN ?? '',
        tags: Object.fromEntries((r.Tags ?? []).map((t) => [t.Key ?? '', t.Value ?? ''])),
      })
    }
    paginationToken = res.PaginationToken
  } while (paginationToken)
  return resources
}

export async function tagResources(
  resourceArns: string[],
  tags: Record<string, string>
): Promise<void> {
  const client = getTaggingClient()
  await client.send(new TagResourcesCommand({ ResourceARNList: resourceArns, Tags: tags }))
}

export async function untagResources(
  resourceArns: string[],
  tagKeys: string[]
): Promise<void> {
  const client = getTaggingClient()
  await client.send(new UntagResourcesCommand({ ResourceARNList: resourceArns, TagKeys: tagKeys }))
}
