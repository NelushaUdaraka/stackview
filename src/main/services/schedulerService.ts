import {
  SchedulerClient,
  ListScheduleGroupsCommand,
  CreateScheduleGroupCommand,
  DeleteScheduleGroupCommand,
  ListSchedulesCommand,
  GetScheduleCommand,
  CreateScheduleCommand,
  UpdateScheduleCommand,
  DeleteScheduleCommand,
  FlexibleTimeWindowMode,
} from '@aws-sdk/client-scheduler'

let client: SchedulerClient | null = null

export function reinitSchedulerClient(endpoint: string, region: string) {
  client = new SchedulerClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
}

function getClient(): SchedulerClient {
  if (!client) throw new Error('SchedulerClient not initialized')
  return client
}

// ── Schedule Groups ───────────────────────────────────────────────────────────

export interface ScheduleGroupMapped {
  name: string
  arn: string
  state?: string
  creationDate?: string
}

export async function listScheduleGroups(): Promise<ScheduleGroupMapped[]> {
  const c = getClient()
  const res = await c.send(new ListScheduleGroupsCommand({}))
  return (res.ScheduleGroups || []).map(g => ({
    name: g.Name || '',
    arn: g.Arn || '',
    state: g.State,
    creationDate: g.CreationDate?.toISOString()
  }))
}

export async function createScheduleGroup(name: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreateScheduleGroupCommand({ Name: name }))
  return res.ScheduleGroupArn || ''
}

export async function deleteScheduleGroup(name: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteScheduleGroupCommand({ Name: name }))
}

// ── Schedules ─────────────────────────────────────────────────────────────────

export interface ScheduleMapped {
  name: string
  arn?: string
  groupName?: string
  state?: string
  scheduleExpression?: string
  scheduleExpressionTimezone?: string
  description?: string
  startDate?: string
  endDate?: string
  targetArn?: string
  targetRoleArn?: string
  targetInput?: string
  creationDate?: string
  lastModificationDate?: string
}

export async function listSchedules(groupName?: string): Promise<ScheduleMapped[]> {
  const c = getClient()
  const res = await c.send(new ListSchedulesCommand({ GroupName: groupName || 'default' }))
  return (res.Schedules || []).map(s => ({
    name: s.Name || '',
    arn: s.Arn,
    groupName: s.GroupName,
    state: s.State,
    scheduleExpression: undefined,
    targetArn: s.Target?.Arn,
    creationDate: s.CreationDate?.toISOString(),
    lastModificationDate: s.LastModificationDate?.toISOString()
  }))
}

export async function getSchedule(name: string, groupName?: string): Promise<ScheduleMapped> {
  const c = getClient()
  const res = await c.send(new GetScheduleCommand({ Name: name, GroupName: groupName }))
  return {
    name: res.Name || '',
    arn: res.Arn,
    groupName: res.GroupName,
    state: res.State,
    scheduleExpression: res.ScheduleExpression,
    scheduleExpressionTimezone: res.ScheduleExpressionTimezone,
    description: res.Description,
    startDate: res.StartDate?.toISOString(),
    endDate: res.EndDate?.toISOString(),
    targetArn: res.Target?.Arn,
    targetRoleArn: res.Target?.RoleArn,
    targetInput: res.Target?.Input,
    creationDate: res.CreationDate?.toISOString(),
    lastModificationDate: res.LastModificationDate?.toISOString()
  }
}

export interface CreateScheduleParams {
  name: string
  groupName?: string
  scheduleExpression: string
  scheduleExpressionTimezone?: string
  description?: string
  state?: 'ENABLED' | 'DISABLED'
  startDate?: string
  endDate?: string
  targetArn: string
  targetRoleArn: string
  targetInput?: string
  flexibleTimeWindowMinutes?: number
}

export async function createSchedule(params: CreateScheduleParams): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreateScheduleCommand({
    Name: params.name,
    GroupName: params.groupName || 'default',
    ScheduleExpression: params.scheduleExpression,
    ScheduleExpressionTimezone: params.scheduleExpressionTimezone || 'UTC',
    Description: params.description,
    State: params.state || 'ENABLED',
    StartDate: params.startDate ? new Date(params.startDate) : undefined,
    EndDate: params.endDate ? new Date(params.endDate) : undefined,
    Target: {
      Arn: params.targetArn,
      RoleArn: params.targetRoleArn,
      Input: params.targetInput
    },
    FlexibleTimeWindow: {
      Mode: FlexibleTimeWindowMode.OFF
    }
  }))
  return res.ScheduleArn || ''
}

export async function updateSchedule(params: CreateScheduleParams & { name: string }): Promise<string> {
  const c = getClient()
  const res = await c.send(new UpdateScheduleCommand({
    Name: params.name,
    GroupName: params.groupName || 'default',
    ScheduleExpression: params.scheduleExpression,
    ScheduleExpressionTimezone: params.scheduleExpressionTimezone || 'UTC',
    Description: params.description,
    State: params.state || 'ENABLED',
    Target: {
      Arn: params.targetArn,
      RoleArn: params.targetRoleArn,
      Input: params.targetInput
    },
    FlexibleTimeWindow: {
      Mode: FlexibleTimeWindowMode.OFF
    }
  }))
  return res.ScheduleArn || ''
}

export async function deleteSchedule(name: string, groupName?: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteScheduleCommand({ Name: name, GroupName: groupName }))
}
