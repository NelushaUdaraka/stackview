import {
  SWFClient,
  ListDomainsCommand,
  RegisterDomainCommand,
  DescribeDomainCommand,
  DeprecateDomainCommand,
  ListWorkflowTypesCommand,
  RegisterWorkflowTypeCommand,
  DeprecateWorkflowTypeCommand,
  ListActivityTypesCommand,
  RegisterActivityTypeCommand,
  DeprecateActivityTypeCommand,
  StartWorkflowExecutionCommand,
  ListOpenWorkflowExecutionsCommand,
  ListClosedWorkflowExecutionsCommand,
  DescribeWorkflowExecutionCommand,
  TerminateWorkflowExecutionCommand,
  SignalWorkflowExecutionCommand,
  GetWorkflowExecutionHistoryCommand,
  RequestCancelWorkflowExecutionCommand,
} from '@aws-sdk/client-swf'
import type {
  SwfDomain,
  SwfWorkflowType,
  SwfActivityType,
  SwfExecution,
  SwfExecutionDetail,
  SwfHistoryEvent,
} from '../../shared/types'

let swfClient: SWFClient | null = null

export function initSwfClient(endpoint: string, region: string): void {
  swfClient = new SWFClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

export function getSwfClient(): SWFClient {
  if (!swfClient) throw new Error('SWF client not initialized')
  return swfClient
}

// ── Domains ──────────────────────────────────────────────────────────────────

export async function listDomains(
  registrationStatus: 'REGISTERED' | 'DEPRECATED' = 'REGISTERED'
): Promise<SwfDomain[]> {
  const client = getSwfClient()
  const domains: SwfDomain[] = []
  let nextPageToken: string | undefined

  do {
    const result = await client.send(
      new ListDomainsCommand({ registrationStatus, nextPageToken, maximumPageSize: 100 })
    )
    for (const d of result.domainInfos ?? []) {
      domains.push({
        name: d.name ?? '',
        arn: d.arn,
        status: d.status ?? 'REGISTERED',
        description: d.description,
      })
    }
    nextPageToken = result.nextPageToken
  } while (nextPageToken)

  return domains
}

export async function registerDomain(
  name: string,
  description: string,
  workflowExecutionRetentionPeriodInDays: string
): Promise<void> {
  const client = getSwfClient()
  await client.send(
    new RegisterDomainCommand({
      name,
      description: description || undefined,
      workflowExecutionRetentionPeriodInDays,
    })
  )
}

export async function describeDomain(name: string): Promise<SwfDomain> {
  const client = getSwfClient()
  const result = await client.send(new DescribeDomainCommand({ name }))
  return {
    name: result.domainInfo?.name ?? name,
    arn: result.domainInfo?.arn,
    status: result.domainInfo?.status ?? 'REGISTERED',
    description: result.domainInfo?.description,
    workflowExecutionRetentionPeriodInDays:
      result.configuration?.workflowExecutionRetentionPeriodInDays,
  }
}

export async function deprecateDomain(name: string): Promise<void> {
  const client = getSwfClient()
  await client.send(new DeprecateDomainCommand({ name }))
}

// ── Workflow Types ────────────────────────────────────────────────────────────

export async function listWorkflowTypes(
  domain: string,
  registrationStatus: 'REGISTERED' | 'DEPRECATED' = 'REGISTERED'
): Promise<SwfWorkflowType[]> {
  const client = getSwfClient()
  const types: SwfWorkflowType[] = []
  let nextPageToken: string | undefined

  do {
    const result = await client.send(
      new ListWorkflowTypesCommand({
        domain,
        registrationStatus,
        nextPageToken,
        maximumPageSize: 100,
      })
    )
    for (const t of result.typeInfos ?? []) {
      types.push({
        name: t.workflowType?.name ?? '',
        version: t.workflowType?.version ?? '',
        status: t.status ?? 'REGISTERED',
        description: t.description,
        creationDate: t.creationDate?.toISOString(),
        deprecationDate: t.deprecationDate?.toISOString(),
      })
    }
    nextPageToken = result.nextPageToken
  } while (nextPageToken)

  return types
}

export async function registerWorkflowType(
  domain: string,
  name: string,
  version: string,
  description?: string,
  defaultTaskList?: string,
  defaultExecutionStartToCloseTimeout?: string,
  defaultTaskStartToCloseTimeout?: string
): Promise<void> {
  const client = getSwfClient()
  await client.send(
    new RegisterWorkflowTypeCommand({
      domain,
      name,
      version,
      description: description || undefined,
      defaultTaskList: defaultTaskList ? { name: defaultTaskList } : undefined,
      defaultExecutionStartToCloseTimeout: defaultExecutionStartToCloseTimeout || undefined,
      defaultTaskStartToCloseTimeout: defaultTaskStartToCloseTimeout || undefined,
    })
  )
}

export async function deprecateWorkflowType(
  domain: string,
  name: string,
  version: string
): Promise<void> {
  const client = getSwfClient()
  await client.send(
    new DeprecateWorkflowTypeCommand({ domain, workflowType: { name, version } })
  )
}

// ── Activity Types ────────────────────────────────────────────────────────────

export async function listActivityTypes(
  domain: string,
  registrationStatus: 'REGISTERED' | 'DEPRECATED' = 'REGISTERED'
): Promise<SwfActivityType[]> {
  const client = getSwfClient()
  const types: SwfActivityType[] = []
  let nextPageToken: string | undefined

  do {
    const result = await client.send(
      new ListActivityTypesCommand({
        domain,
        registrationStatus,
        nextPageToken,
        maximumPageSize: 100,
      })
    )
    for (const t of result.typeInfos ?? []) {
      types.push({
        name: t.activityType?.name ?? '',
        version: t.activityType?.version ?? '',
        status: t.status ?? 'REGISTERED',
        description: t.description,
        creationDate: t.creationDate?.toISOString(),
        deprecationDate: t.deprecationDate?.toISOString(),
      })
    }
    nextPageToken = result.nextPageToken
  } while (nextPageToken)

  return types
}

export async function registerActivityType(
  domain: string,
  name: string,
  version: string,
  description?: string,
  defaultTaskList?: string,
  defaultScheduleToCloseTimeout?: string,
  defaultScheduleToStartTimeout?: string,
  defaultStartToCloseTimeout?: string,
  defaultHeartbeatTimeout?: string
): Promise<void> {
  const client = getSwfClient()
  await client.send(
    new RegisterActivityTypeCommand({
      domain,
      name,
      version,
      description: description || undefined,
      defaultTaskList: defaultTaskList ? { name: defaultTaskList } : undefined,
      defaultScheduleToCloseTimeout: defaultScheduleToCloseTimeout || undefined,
      defaultScheduleToStartTimeout: defaultScheduleToStartTimeout || undefined,
      defaultStartToCloseTimeout: defaultStartToCloseTimeout || undefined,
      defaultHeartbeatTimeout: defaultHeartbeatTimeout || undefined,
    })
  )
}

export async function deprecateActivityType(
  domain: string,
  name: string,
  version: string
): Promise<void> {
  const client = getSwfClient()
  await client.send(
    new DeprecateActivityTypeCommand({ domain, activityType: { name, version } })
  )
}

// ── Workflow Executions ───────────────────────────────────────────────────────

export async function listOpenExecutions(domain: string): Promise<SwfExecution[]> {
  const client = getSwfClient()
  const executions: SwfExecution[] = []
  let nextPageToken: string | undefined

  do {
    const result = await client.send(
      new ListOpenWorkflowExecutionsCommand({
        domain,
        startTimeFilter: { oldestDate: new Date(0) },
        nextPageToken,
        maximumPageSize: 100,
      })
    )
    for (const e of result.executionInfos ?? []) {
      executions.push({
        workflowId: e.execution?.workflowId ?? '',
        runId: e.execution?.runId ?? '',
        workflowType: e.workflowType
          ? { name: e.workflowType.name ?? '', version: e.workflowType.version ?? '' }
          : undefined,
        startTimestamp: e.startTimestamp?.toISOString(),
        executionStatus: 'OPEN',
      })
    }
    nextPageToken = result.nextPageToken
  } while (nextPageToken)

  return executions
}

export async function listClosedExecutions(domain: string): Promise<SwfExecution[]> {
  const client = getSwfClient()
  const executions: SwfExecution[] = []
  let nextPageToken: string | undefined

  do {
    const result = await client.send(
      new ListClosedWorkflowExecutionsCommand({
        domain,
        startTimeFilter: { oldestDate: new Date(0) },
        nextPageToken,
        maximumPageSize: 100,
      })
    )
    for (const e of result.executionInfos ?? []) {
      executions.push({
        workflowId: e.execution?.workflowId ?? '',
        runId: e.execution?.runId ?? '',
        workflowType: e.workflowType
          ? { name: e.workflowType.name ?? '', version: e.workflowType.version ?? '' }
          : undefined,
        startTimestamp: e.startTimestamp?.toISOString(),
        closeTimestamp: e.closeTimestamp?.toISOString(),
        closeStatus: e.closeStatus,
        executionStatus: 'CLOSED',
      })
    }
    nextPageToken = result.nextPageToken
  } while (nextPageToken)

  return executions
}

export async function describeExecution(
  domain: string,
  workflowId: string,
  runId: string
): Promise<SwfExecutionDetail> {
  const client = getSwfClient()
  const result = await client.send(
    new DescribeWorkflowExecutionCommand({ domain, execution: { workflowId, runId } })
  )
  return {
    workflowId: result.executionInfo?.execution?.workflowId ?? workflowId,
    runId: result.executionInfo?.execution?.runId ?? runId,
    workflowType: result.executionInfo?.workflowType
      ? {
          name: result.executionInfo.workflowType.name ?? '',
          version: result.executionInfo.workflowType.version ?? '',
        }
      : undefined,
    startTimestamp: result.executionInfo?.startTimestamp?.toISOString(),
    closeTimestamp: result.executionInfo?.closeTimestamp?.toISOString(),
    closeStatus: result.executionInfo?.closeStatus,
    executionStatus: result.executionInfo?.executionStatus,
    tagList: result.executionInfo?.tagList,
    taskList: result.executionConfiguration?.taskList?.name,
    executionStartToCloseTimeout: result.executionConfiguration?.executionStartToCloseTimeout,
    taskStartToCloseTimeout: result.executionConfiguration?.taskStartToCloseTimeout,
    openActivityTasks: result.openCounts?.openActivityTasks,
    openDecisionTasks: result.openCounts?.openDecisionTasks,
    openTimers: result.openCounts?.openTimers,
    openChildWorkflowExecutions: result.openCounts?.openChildWorkflowExecutions,
  }
}

export async function startExecution(
  domain: string,
  workflowId: string,
  workflowName: string,
  workflowVersion: string,
  input?: string,
  tagList?: string[],
  executionStartToCloseTimeout?: string,
  taskStartToCloseTimeout?: string
): Promise<string> {
  const client = getSwfClient()
  const result = await client.send(
    new StartWorkflowExecutionCommand({
      domain,
      workflowId,
      workflowType: { name: workflowName, version: workflowVersion },
      input: input || undefined,
      tagList: tagList && tagList.length > 0 ? tagList : undefined,
      executionStartToCloseTimeout: executionStartToCloseTimeout || undefined,
      taskStartToCloseTimeout: taskStartToCloseTimeout || undefined,
    })
  )
  return result.runId ?? ''
}

export async function terminateExecution(
  domain: string,
  workflowId: string,
  runId: string,
  reason?: string
): Promise<void> {
  const client = getSwfClient()
  await client.send(
    new TerminateWorkflowExecutionCommand({
      domain,
      workflowId,
      runId,
      reason: reason || undefined,
    })
  )
}

export async function signalExecution(
  domain: string,
  workflowId: string,
  runId: string,
  signalName: string,
  input?: string
): Promise<void> {
  const client = getSwfClient()
  await client.send(
    new SignalWorkflowExecutionCommand({
      domain,
      workflowId,
      runId,
      signalName,
      input: input || undefined,
    })
  )
}

export async function getExecutionHistory(
  domain: string,
  workflowId: string,
  runId: string
): Promise<SwfHistoryEvent[]> {
  const client = getSwfClient()
  const events: SwfHistoryEvent[] = []
  let nextPageToken: string | undefined

  do {
    const result = await client.send(
      new GetWorkflowExecutionHistoryCommand({
        domain,
        execution: { workflowId, runId },
        nextPageToken,
        maximumPageSize: 100,
      })
    )
    for (const e of result.events ?? []) {
      const { eventTimestamp, eventType, eventId, ...rest } = e as Record<string, unknown>
      const attrKey = Object.keys(rest).find(
        (k) => k.endsWith('EventAttributes') && rest[k] !== undefined
      )
      events.push({
        eventTimestamp: (eventTimestamp as Date | undefined)?.toISOString(),
        eventType: (eventType as string | undefined) ?? '',
        eventId: (eventId as number | undefined) ?? 0,
        details: attrKey ? JSON.stringify(rest[attrKey], null, 2) : undefined,
      })
    }
    nextPageToken = result.nextPageToken
  } while (nextPageToken)

  return events
}

export async function requestCancelExecution(
  domain: string,
  workflowId: string,
  runId: string
): Promise<void> {
  const client = getSwfClient()
  await client.send(
    new RequestCancelWorkflowExecutionCommand({ domain, workflowId, runId })
  )
}
