import {
  CloudFormationClient,
  ListStacksCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  DescribeStackEventsCommand,
  GetTemplateCommand,
  CreateStackCommand,
  UpdateStackCommand,
  DeleteStackCommand,
  ValidateTemplateCommand,
  ListExportsCommand,
  StackStatus,
  type StackSummary,
  type Stack,
  type StackResource,
  type StackEvent,
  type Export,
} from '@aws-sdk/client-cloudformation'

let cfnClient: CloudFormationClient | null = null

export function initCfnClient(endpoint: string, region: string): void {
  cfnClient = new CloudFormationClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

function getClient(): CloudFormationClient {
  if (!cfnClient) throw new Error('CloudFormation client not initialized')
  return cfnClient
}

export async function listStacks(statusFilter?: string[]): Promise<StackSummary[]> {
  const client = getClient()
  const statuses = (statusFilter && statusFilter.length > 0
    ? statusFilter
    : Object.values(StackStatus).filter(s => s !== StackStatus.DELETE_COMPLETE)
  ) as StackStatus[]

  const result = await client.send(
    new ListStacksCommand({ StackStatusFilter: statuses })
  )
  return result.StackSummaries ?? []
}

export async function describeStack(stackName: string): Promise<Stack> {
  const client = getClient()
  const result = await client.send(new DescribeStacksCommand({ StackName: stackName }))
  const stack = result.Stacks?.[0]
  if (!stack) throw new Error(`Stack "${stackName}" not found`)
  return stack
}

export async function describeStackResources(stackName: string): Promise<StackResource[]> {
  const client = getClient()
  const result = await client.send(new DescribeStackResourcesCommand({ StackName: stackName }))
  return result.StackResources ?? []
}

export async function describeStackEvents(stackName: string): Promise<StackEvent[]> {
  const client = getClient()
  const result = await client.send(new DescribeStackEventsCommand({ StackName: stackName }))
  return result.StackEvents ?? []
}

export async function getTemplate(stackName: string): Promise<string> {
  const client = getClient()
  const result = await client.send(new GetTemplateCommand({ StackName: stackName }))
  return result.TemplateBody ?? ''
}

export async function createStack(
  stackName: string,
  templateBody: string,
  parameters?: { key: string; value: string }[],
  capabilities?: string[]
): Promise<string | undefined> {
  const client = getClient()
  const result = await client.send(
    new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: parameters?.map(p => ({ ParameterKey: p.key, ParameterValue: p.value })),
      Capabilities: capabilities as any,
    })
  )
  return result.StackId
}

export async function updateStack(
  stackName: string,
  templateBody: string,
  parameters?: { key: string; value: string }[],
  capabilities?: string[]
): Promise<string | undefined> {
  const client = getClient()
  const result = await client.send(
    new UpdateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: parameters?.map(p => ({ ParameterKey: p.key, ParameterValue: p.value })),
      Capabilities: capabilities as any,
    })
  )
  return result.StackId
}

export async function deleteStack(stackName: string): Promise<void> {
  const client = getClient()
  await client.send(new DeleteStackCommand({ StackName: stackName }))
}

export async function validateTemplate(templateBody: string): Promise<{
  parameters: { key: string; description: string; defaultValue: string; allowedValues: string[]; noEcho: boolean }[]
  capabilities: string[]
  description: string
}> {
  const client = getClient()
  const result = await client.send(new ValidateTemplateCommand({ TemplateBody: templateBody }))
  return {
    parameters: result.Parameters?.map(p => {
      const r = p as any  // LocalStack may return DefaultValue/AllowedValues not declared in SDK type
      return {
        key: r.ParameterKey ?? '',
        description: r.Description ?? '',
        defaultValue: r.DefaultValue ?? '',
        allowedValues: Array.isArray(r.AllowedValues) ? r.AllowedValues : [],
        noEcho: r.NoEcho ?? false,
      }
    }) ?? [],
    capabilities: result.Capabilities ?? [],
    description: result.Description ?? '',
  }
}

export async function listExports(): Promise<Export[]> {
  const client = getClient()
  const all: Export[] = []
  let nextToken: string | undefined
  do {
    const result = await client.send(new ListExportsCommand({ NextToken: nextToken }))
    all.push(...(result.Exports ?? []))
    nextToken = result.NextToken
  } while (nextToken)
  return all
}
