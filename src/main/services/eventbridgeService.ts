import {
  EventBridgeClient,
  ListEventBusesCommand,
  CreateEventBusCommand,
  DeleteEventBusCommand,
  ListRulesCommand,
  PutRuleCommand,
  DeleteRuleCommand,
  EnableRuleCommand,
  DisableRuleCommand,
  ListTargetsByRuleCommand,
  PutTargetsCommand,
  RemoveTargetsCommand,
  PutEventsCommand,
  EventBus,
  Rule,
  Target
} from '@aws-sdk/client-eventbridge'

let client: EventBridgeClient | null = null

export function reinitEventBridgeClient(endpoint: string, region: string) {
  client = new EventBridgeClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
}

function getClient(): EventBridgeClient {
  if (!client) throw new Error('EventBridgeClient not initialized')
  return client
}

// ── Buses ────────────────────────────────────────────────────────────────────

export interface EbBusMapped {
  name: string
  arn: string
}

export async function listEventBuses(): Promise<EbBusMapped[]> {
  try {
    const c = getClient()
    const res = await c.send(new ListEventBusesCommand({}))
    return (res.EventBuses || []).map(b => ({
      name: b.Name || '',
      arn: b.Arn || ''
    }))
  } catch (error) {
    console.error('listEventBuses error:', error)
    throw error
  }
}

export async function createEventBus(name: string): Promise<string> {
  try {
    const c = getClient()
    const res = await c.send(new CreateEventBusCommand({ Name: name }))
    return res.EventBusArn || ''
  } catch (error) {
    console.error('createEventBus error:', error)
    throw error
  }
}

export async function deleteEventBus(name: string): Promise<void> {
  try {
    const c = getClient()
    await c.send(new DeleteEventBusCommand({ Name: name }))
  } catch (error) {
    console.error('deleteEventBus error:', error)
    throw error
  }
}

// ── Rules ────────────────────────────────────────────────────────────────────

export interface EbRuleMapped {
  name: string
  arn: string
  eventPattern?: string
  state?: string
  description?: string
  scheduleExpression?: string
}

export async function listRules(busName: string): Promise<EbRuleMapped[]> {
  try {
    const c = getClient()
    const res = await c.send(new ListRulesCommand({ EventBusName: busName }))
    return (res.Rules || []).map(r => ({
      name: r.Name || '',
      arn: r.Arn || '',
      eventPattern: r.EventPattern,
      state: r.State,
      description: r.Description,
      scheduleExpression: r.ScheduleExpression
    }))
  } catch (error) {
    console.error('listRules error:', error)
    throw error
  }
}

export async function putRule(
  busName: string,
  ruleName: string,
  eventPattern?: string,
  scheduleExpression?: string,
  description?: string,
  state: 'ENABLED' | 'DISABLED' = 'ENABLED'
): Promise<string> {
  try {
    const c = getClient()
    const res = await c.send(new PutRuleCommand({
      EventBusName: busName,
      Name: ruleName,
      EventPattern: eventPattern,
      ScheduleExpression: scheduleExpression,
      Description: description,
      State: state
    }))
    return res.RuleArn || ''
  } catch (error) {
    console.error('putRule error:', error)
    throw error
  }
}

export async function deleteRule(busName: string, ruleName: string): Promise<void> {
  try {
    const c = getClient()
    // Need to remove all targets first before deleting the rule in AWS
    try {
      const targetsRes = await listTargetsByRule(busName, ruleName)
      if (targetsRes.length > 0) {
        await removeTargets(busName, ruleName, targetsRes.map(t => t.id))
      }
    } catch (e) {
      console.warn('Failed to clean up targets before deleting rule', e)
    }

    await c.send(new DeleteRuleCommand({ EventBusName: busName, Name: ruleName }))
  } catch (error) {
    console.error('deleteRule error:', error)
    throw error
  }
}

export async function enableRule(busName: string, ruleName: string): Promise<void> {
  try {
    const c = getClient()
    await c.send(new EnableRuleCommand({ EventBusName: busName, Name: ruleName }))
  } catch (error) {
    console.error('enableRule error:', error)
    throw error
  }
}

export async function disableRule(busName: string, ruleName: string): Promise<void> {
  try {
    const c = getClient()
    await c.send(new DisableRuleCommand({ EventBusName: busName, Name: ruleName }))
  } catch (error) {
    console.error('disableRule error:', error)
    throw error
  }
}

// ── Targets ──────────────────────────────────────────────────────────────────

export interface EbTargetMapped {
  id: string
  arn: string
  input?: string
  inputPath?: string
}

export async function listTargetsByRule(busName: string, ruleName: string): Promise<EbTargetMapped[]> {
  try {
    const c = getClient()
    const res = await c.send(new ListTargetsByRuleCommand({ EventBusName: busName, Rule: ruleName }))
    return (res.Targets || []).map(t => ({
      id: t.Id || '',
      arn: t.Arn || '',
      input: t.Input,
      inputPath: t.InputPath
    }))
  } catch (error) {
    console.error('listTargetsByRule error:', error)
    throw error
  }
}

export async function putTargets(
  busName: string,
  ruleName: string,
  targets: { id: string, arn: string, input?: string }[]
): Promise<number> {
  try {
    const c = getClient()
    const mappedTargets: Target[] = targets.map(t => ({
      Id: t.id,
      Arn: t.arn,
      Input: t.input
    }))
    const res = await c.send(new PutTargetsCommand({
      EventBusName: busName,
      Rule: ruleName,
      Targets: mappedTargets
    }))
    return res.FailedEntryCount || 0
  } catch (error) {
    console.error('putTargets error:', error)
    throw error
  }
}

export async function removeTargets(busName: string, ruleName: string, targetIds: string[]): Promise<number> {
  try {
    const c = getClient()
    const res = await c.send(new RemoveTargetsCommand({
      EventBusName: busName,
      Rule: ruleName,
      Ids: targetIds
    }))
    return res.FailedEntryCount || 0
  } catch (error) {
    console.error('removeTargets error:', error)
    throw error
  }
}

// ── Events ───────────────────────────────────────────────────────────────────

export interface EbEventEntry {
  source: string
  detailType: string
  detail: string
}

export async function putEvents(busName: string, entries: EbEventEntry[]): Promise<number> {
  try {
    const c = getClient()
    const mappedEntries = entries.map(e => ({
      EventBusName: busName,
      Source: e.source,
      DetailType: e.detailType,
      Detail: e.detail
    }))
    const res = await c.send(new PutEventsCommand({ Entries: mappedEntries }))
    return res.FailedEntryCount || 0
  } catch (error) {
    console.error('putEvents error:', error)
    throw error
  }
}
