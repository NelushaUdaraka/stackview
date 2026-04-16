import {
  SFNClient,
  ListStateMachinesCommand,
  CreateStateMachineCommand,
  DescribeStateMachineCommand,
  UpdateStateMachineCommand,
  DeleteStateMachineCommand,
  StartExecutionCommand,
  ListExecutionsCommand,
  DescribeExecutionCommand,
  StopExecutionCommand,
  GetExecutionHistoryCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from '@aws-sdk/client-sfn'
import type {
  SfnStateMachine,
  SfnStateMachineDetail,
  SfnExecution,
  SfnExecutionDetail,
  SfnHistoryEvent,
} from '../../shared/types'

let sfnClient: SFNClient | null = null

export function initSfnClient(endpoint: string, region: string): void {
  sfnClient = new SFNClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

export function getSfnClient(): SFNClient {
  if (!sfnClient) throw new Error('SFN client not initialized')
  return sfnClient
}

// ── State Machines ────────────────────────────────────────────────────────────

export async function listStateMachines(): Promise<SfnStateMachine[]> {
  const client = getSfnClient()
  const machines: SfnStateMachine[] = []
  let nextToken: string | undefined

  do {
    const result = await client.send(
      new ListStateMachinesCommand({ nextToken, maxResults: 100 })
    )
    for (const m of result.stateMachines ?? []) {
      machines.push({
        name: m.name ?? '',
        stateMachineArn: m.stateMachineArn ?? '',
        type: (m.type as 'STANDARD' | 'EXPRESS') ?? 'STANDARD',
        creationDate: m.creationDate?.toISOString(),
      })
    }
    nextToken = result.nextToken
  } while (nextToken)

  return machines
}

export async function createStateMachine(
  name: string,
  definition: string,
  roleArn: string,
  type: 'STANDARD' | 'EXPRESS',
  tags?: Record<string, string>
): Promise<string> {
  const client = getSfnClient()
  const tagList = tags
    ? Object.entries(tags).map(([key, value]) => ({ key, value }))
    : undefined
  const result = await client.send(
    new CreateStateMachineCommand({
      name,
      definition,
      roleArn,
      type,
      tags: tagList && tagList.length > 0 ? tagList : undefined,
    })
  )
  return result.stateMachineArn ?? ''
}

export async function describeStateMachine(
  stateMachineArn: string
): Promise<SfnStateMachineDetail> {
  const client = getSfnClient()
  const result = await client.send(
    new DescribeStateMachineCommand({ stateMachineArn })
  )
  return {
    name: result.name ?? '',
    stateMachineArn: result.stateMachineArn ?? stateMachineArn,
    type: (result.type as 'STANDARD' | 'EXPRESS') ?? 'STANDARD',
    status: result.status,
    creationDate: result.creationDate?.toISOString(),
    definition: result.definition,
    roleArn: result.roleArn,
  }
}

export async function updateStateMachine(
  stateMachineArn: string,
  definition?: string,
  roleArn?: string
): Promise<void> {
  const client = getSfnClient()
  await client.send(
    new UpdateStateMachineCommand({
      stateMachineArn,
      definition: definition || undefined,
      roleArn: roleArn || undefined,
    })
  )
}

export async function deleteStateMachine(
  stateMachineArn: string
): Promise<void> {
  const client = getSfnClient()
  await client.send(new DeleteStateMachineCommand({ stateMachineArn }))
}

// ── Executions ────────────────────────────────────────────────────────────────

export async function startExecution(
  stateMachineArn: string,
  name?: string,
  input?: string
): Promise<string> {
  const client = getSfnClient()
  const result = await client.send(
    new StartExecutionCommand({
      stateMachineArn,
      name: name || undefined,
      input: input || undefined,
    })
  )
  return result.executionArn ?? ''
}

export async function listExecutions(
  stateMachineArn: string,
  statusFilter?: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED' | 'PENDING_REDRIVE'
): Promise<SfnExecution[]> {
  const client = getSfnClient()
  const executions: SfnExecution[] = []
  let nextToken: string | undefined

  do {
    const result = await client.send(
      new ListExecutionsCommand({
        stateMachineArn,
        statusFilter: statusFilter || undefined,
        nextToken,
        maxResults: 100,
      })
    )
    for (const e of result.executions ?? []) {
      executions.push({
        executionArn: e.executionArn ?? '',
        stateMachineArn: e.stateMachineArn ?? stateMachineArn,
        name: e.name ?? '',
        status: (e.status as SfnExecution['status']) ?? 'RUNNING',
        startDate: e.startDate?.toISOString(),
        stopDate: e.stopDate?.toISOString(),
      })
    }
    nextToken = result.nextToken
  } while (nextToken)

  return executions
}

export async function describeExecution(
  executionArn: string
): Promise<SfnExecutionDetail> {
  const client = getSfnClient()
  const result = await client.send(
    new DescribeExecutionCommand({ executionArn })
  )
  return {
    executionArn: result.executionArn ?? executionArn,
    stateMachineArn: result.stateMachineArn ?? '',
    name: result.name ?? '',
    status: (result.status as SfnExecutionDetail['status']) ?? 'RUNNING',
    startDate: result.startDate?.toISOString(),
    stopDate: result.stopDate?.toISOString(),
    input: result.input,
    output: result.output,
    cause: result.cause,
    error: result.error,
  }
}

export async function stopExecution(
  executionArn: string,
  error?: string,
  cause?: string
): Promise<void> {
  const client = getSfnClient()
  await client.send(
    new StopExecutionCommand({
      executionArn,
      error: error || undefined,
      cause: cause || undefined,
    })
  )
}

export async function getExecutionHistory(
  executionArn: string
): Promise<SfnHistoryEvent[]> {
  const client = getSfnClient()
  const events: SfnHistoryEvent[] = []
  let nextToken: string | undefined

  do {
    const result = await client.send(
      new GetExecutionHistoryCommand({
        executionArn,
        nextToken,
        maxResults: 100,
      })
    )
    for (const e of result.events ?? []) {
      const { timestamp, type, id, previousEventId, ...rest } =
        e as Record<string, unknown>
      const attrKey = Object.keys(rest).find(
        (k) =>
          (k.endsWith('EventDetails') || k.endsWith('StateEntered') || k.endsWith('StateExited')) &&
          rest[k] !== undefined
      )
      events.push({
        id: (id as number | undefined) ?? 0,
        previousEventId: previousEventId as number | undefined,
        type: (type as string | undefined) ?? '',
        timestamp: (timestamp as Date | undefined)?.toISOString(),
        details: attrKey ? JSON.stringify(rest[attrKey], null, 2) : undefined,
      })
    }
    nextToken = result.nextToken
  } while (nextToken)

  return events
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function listTagsForResource(
  resourceArn: string
): Promise<Record<string, string>> {
  const client = getSfnClient()
  const result = await client.send(
    new ListTagsForResourceCommand({ resourceArn })
  )
  const tags: Record<string, string> = {}
  for (const t of result.tags ?? []) {
    if (t.key) tags[t.key] = t.value ?? ''
  }
  return tags
}

export async function tagResource(
  resourceArn: string,
  tags: Record<string, string>
): Promise<void> {
  const client = getSfnClient()
  await client.send(
    new TagResourceCommand({
      resourceArn,
      tags: Object.entries(tags).map(([key, value]) => ({ key, value })),
    })
  )
}

export async function untagResource(
  resourceArn: string,
  tagKeys: string[]
): Promise<void> {
  const client = getSfnClient()
  await client.send(new UntagResourceCommand({ resourceArn, tagKeys }))
}
