import {
  SSMClient,
  GetParametersByPathCommand,
  DescribeParametersCommand,
  GetParameterCommand,
  PutParameterCommand,
  DeleteParameterCommand,
  DeleteParametersCommand,
  GetParameterHistoryCommand,
  type Parameter,
  type ParameterHistory,
} from '@aws-sdk/client-ssm'

export interface SsmParamMapped {
  name: string
  type: string
  value?: string
  version?: number
  lastModifiedDate?: string
  description?: string
  arn?: string
  dataType?: string
  tier?: string
}

export interface SsmHistoryMapped {
  version: number
  value?: string
  type: string
  lastModifiedDate?: string
  lastModifiedUser?: string
}

// Accept `any` here so it allows both `Parameter` and `ParameterMetadata`
function mapParam(p: any): SsmParamMapped {
  return {
    name: p.Name || '',
    type: p.Type || 'String',
    value: p.Value,
    version: p.Version,
    lastModifiedDate: p.LastModifiedDate?.toISOString(),
    description: p.Description,
    arn: p.ARN,
    dataType: p.DataType,
    tier: p.Tier
  }
}

function mapHistory(h: ParameterHistory): SsmHistoryMapped {
  return {
    version: h.Version || 1,
    value: h.Value,
    type: h.Type || 'String',
    lastModifiedDate: h.LastModifiedDate?.toISOString(),
    lastModifiedUser: h.LastModifiedUser,
  }
}

let ssmClient: SSMClient | null = null

function getClient(): SSMClient {
  if (!ssmClient) throw new Error('SSM client not initialized')
  return ssmClient
}

export function initSsmClient(endpoint: string, region: string): void {
  ssmClient = new SSMClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

// List all parameters (optionally filtered by path)
export async function listParameters(path?: string, recursive = true): Promise<SsmParamMapped[]> {
  const client = getClient()
  const all: Parameter[] = []

  if (path) {
    let nextToken: string | undefined
    do {
      const res = await client.send(
        new GetParametersByPathCommand({
          Path: path,
          Recursive: recursive,
          WithDecryption: false,
          NextToken: nextToken,
        })
      )
      all.push(...(res.Parameters ?? []))
      nextToken = res.NextToken
    } while (nextToken)
  } else {
    let nextToken: string | undefined
    do {
      const res = await client.send(
        new DescribeParametersCommand({ NextToken: nextToken, MaxResults: 50 })
      )
      // DescribeParameters doesn't return values — but gives names/types/meta
      all.push(...(res.Parameters ?? []))
      nextToken = res.NextToken
    } while (nextToken)
  }
  return all.map(mapParam)
}

// Get a single parameter (with optional decryption)
export async function getParameter(name: string, withDecryption = false): Promise<SsmParamMapped> {
  const client = getClient()
  const res = await client.send(
    new GetParameterCommand({ Name: name, WithDecryption: withDecryption })
  )
  if (!res.Parameter) throw new Error('Parameter not found')
  return mapParam(res.Parameter)
}

// Create or update a parameter
export async function putParameter(
  name: string,
  value: string,
  type: 'String' | 'StringList' | 'SecureString',
  description?: string,
  kmsKeyId?: string,
  overwrite = false
): Promise<number> {
  const client = getClient()
  const res = await client.send(
    new PutParameterCommand({
      Name: name,
      Value: value,
      Type: type,
      Description: description,
      KeyId: kmsKeyId || undefined,
      Overwrite: overwrite,
    })
  )
  return res.Version ?? 1
}

// Delete a single parameter
export async function deleteParameter(name: string): Promise<void> {
  const client = getClient()
  await client.send(new DeleteParameterCommand({ Name: name }))
}

// Bulk delete parameters
export async function deleteParameters(names: string[]): Promise<string[]> {
  const client = getClient()
  const res = await client.send(new DeleteParametersCommand({ Names: names }))
  return res.DeletedParameters ?? []
}

// Get version history of a parameter
export async function getParameterHistory(name: string): Promise<SsmHistoryMapped[]> {
  const client = getClient()
  const all: ParameterHistory[] = []
  let nextToken: string | undefined
  do {
    const res = await client.send(
      new GetParameterHistoryCommand({ Name: name, WithDecryption: false, NextToken: nextToken })
    )
    all.push(...(res.Parameters ?? []))
    nextToken = res.NextToken
  } while (nextToken)
  return all.reverse().map(mapHistory) // latest first
}
