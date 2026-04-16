import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
  CreateTableCommand,
  DeleteTableCommand,
  UpdateTableCommand,
  TableDescription,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'
import {
  DynamoDBStreamsClient,
  ListStreamsCommand,
  DescribeStreamCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
} from '@aws-sdk/client-dynamodb-streams'
import type { DynamoStream, DynamoStreamShard, DynamoStreamRecord } from '../../shared/types'

let rawClient: DynamoDBClient | null = null
let docClient: DynamoDBDocumentClient | null = null
let streamsClient: DynamoDBStreamsClient | null = null

export function initDynamoDbClient(endpoint: string, region: string): void {
  rawClient = new DynamoDBClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
  docClient = DynamoDBDocumentClient.from(rawClient, {
    marshallOptions: { removeUndefinedValues: true }
  })
  streamsClient = new DynamoDBStreamsClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

function getStreamsClient(): DynamoDBStreamsClient {
  if (!streamsClient) throw new Error('DynamoDB Streams client not initialized')
  return streamsClient
}

export function getDynamoDbClient(): { raw: DynamoDBClient; doc: DynamoDBDocumentClient } {
  if (!rawClient || !docClient) throw new Error('DynamoDB client not initialized')
  return { raw: rawClient, doc: docClient }
}

export interface DynamoTableInfo {
  name: string
  creationDate?: string
  itemCount?: number
  sizeBytes?: number
  status?: string
}

export interface DynamoItem {
  [key: string]: any
}

export async function listTables(): Promise<string[]> {
  const { raw } = getDynamoDbClient()
  const result = await raw.send(new ListTablesCommand({}))
  return result.TableNames ?? []
}

export async function describeTable(tableName: string): Promise<TableDescription> {
  const { raw } = getDynamoDbClient()
  const result = await raw.send(new DescribeTableCommand({ TableName: tableName }))
  if (!result.Table) throw new Error('Table description not found')
  return result.Table
}

export async function createTable(
  tableName: string,
  attributeDefinitions: any[],
  keySchema: any[],
  gsiList?: any[],
  lsiList?: any[]
): Promise<void> {
  const { raw } = getDynamoDbClient()
  
  const params: any = {
    TableName: tableName,
    AttributeDefinitions: attributeDefinitions,
    KeySchema: keySchema,
    BillingMode: 'PAY_PER_REQUEST'
  }

  if (gsiList && gsiList.length > 0) {
    params.GlobalSecondaryIndexes = gsiList.map(g => ({
       ...g,
       ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
    }))
    params.BillingMode = 'PROVISIONED'
    params.ProvisionedThroughput = { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
  }

  if (lsiList && lsiList.length > 0) {
    params.LocalSecondaryIndexes = lsiList
  }

  await raw.send(new CreateTableCommand(params))
}

export async function deleteTable(tableName: string): Promise<void> {
  const { raw } = getDynamoDbClient()
  await raw.send(new DeleteTableCommand({ TableName: tableName }))
}

export async function scanItems(
  tableName: string, 
  limit = 100,
  exclusiveStartKey?: Record<string, any>
): Promise<{ items: DynamoItem[], lastEvaluatedKey?: Record<string, any> }> {
  const { doc } = getDynamoDbClient()
  const params: any = { TableName: tableName, Limit: limit }
  if (exclusiveStartKey) params.ExclusiveStartKey = exclusiveStartKey
  
  const result = await doc.send(new ScanCommand(params))
  return { items: result.Items ?? [], lastEvaluatedKey: result.LastEvaluatedKey }
}

export interface DynamoQueryOptions {
  operation: 'SCAN' | 'QUERY'
  indexName?: string
  keyConditionExpression?: string
  filterExpression?: string
  expressionAttributeNames?: Record<string, string>
  expressionAttributeValues?: Record<string, any>
  limit?: number
  exclusiveStartKey?: Record<string, any>
}

export async function queryItems(
  tableName: string, 
  options: DynamoQueryOptions
): Promise<{ items: DynamoItem[], lastEvaluatedKey?: Record<string, any> }> {
  const { doc } = getDynamoDbClient()
  
  const params: any = {
    TableName: tableName,
    Limit: options.limit || 50
  }
  
  if (options.indexName) params.IndexName = options.indexName
  if (options.filterExpression) params.FilterExpression = options.filterExpression
  if (options.keyConditionExpression) params.KeyConditionExpression = options.keyConditionExpression
  if (options.expressionAttributeNames && Object.keys(options.expressionAttributeNames).length > 0) {
    params.ExpressionAttributeNames = options.expressionAttributeNames
  }
  if (options.expressionAttributeValues && Object.keys(options.expressionAttributeValues).length > 0) {
    params.ExpressionAttributeValues = options.expressionAttributeValues
  }
  if (options.exclusiveStartKey) params.ExclusiveStartKey = options.exclusiveStartKey

  if (options.operation === 'QUERY') {
    const data = await doc.send(new QueryCommand(params))
    return { items: data.Items ?? [], lastEvaluatedKey: data.LastEvaluatedKey }
  } else {
    const data = await doc.send(new ScanCommand(params))
    return { items: data.Items ?? [], lastEvaluatedKey: data.LastEvaluatedKey }
  }
}

export async function putItem(tableName: string, item: DynamoItem): Promise<void> {
  const { doc } = getDynamoDbClient()
  await doc.send(new PutCommand({
    TableName: tableName,
    Item: item
  }))
}

export async function deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
  const { doc } = getDynamoDbClient()
  await doc.send(new DeleteCommand({
    TableName: tableName,
    Key: key
  }))
}

// ── DynamoDB Streams ──────────────────────────────────────────────────────────

export async function listStreams(tableName?: string): Promise<DynamoStream[]> {
  const client = getStreamsClient()
  const streams: DynamoStream[] = []
  let lastStreamArn: string | undefined

  do {
    const res = await client.send(new ListStreamsCommand({
      TableName: tableName,
      ExclusiveStartStreamArn: lastStreamArn,
      Limit: 100,
    }))
    for (const s of res.Streams ?? []) {
      streams.push({
        streamArn: s.StreamArn ?? '',
        tableName: s.TableName,
        streamLabel: s.StreamLabel,
      })
    }
    lastStreamArn = res.LastEvaluatedStreamArn
  } while (lastStreamArn)

  return streams
}

export async function describeStream(streamArn: string): Promise<{
  streamArn: string
  tableName?: string
  streamStatus?: string
  streamViewType?: string
  creationDateTime?: string
  shards: DynamoStreamShard[]
}> {
  const client = getStreamsClient()
  let lastShardId: string | undefined
  const shards: DynamoStreamShard[] = []
  let meta: any = {}

  do {
    const res = await client.send(new DescribeStreamCommand({
      StreamArn: streamArn,
      ExclusiveStartShardId: lastShardId,
      Limit: 100,
    }))
    const sd = res.StreamDescription
    if (!meta.streamArn) {
      meta = {
        streamArn: sd?.StreamArn ?? streamArn,
        tableName: sd?.TableName,
        streamStatus: sd?.StreamStatus,
        streamViewType: sd?.StreamViewType,
        creationDateTime: sd?.CreationRequestDateTime?.toISOString(),
      }
    }
    for (const shard of sd?.Shards ?? []) {
      shards.push({
        shardId: shard.ShardId ?? '',
        parentShardId: shard.ParentShardId,
        startingSequenceNumber: shard.SequenceNumberRange?.StartingSequenceNumber,
        endingSequenceNumber: shard.SequenceNumberRange?.EndingSequenceNumber,
      })
    }
    lastShardId = res.StreamDescription?.LastEvaluatedShardId
  } while (lastShardId)

  return { ...meta, shards }
}

export async function getShardIterator(
  streamArn: string,
  shardId: string,
  iteratorType: 'TRIM_HORIZON' | 'LATEST' | 'AT_SEQUENCE_NUMBER' | 'AFTER_SEQUENCE_NUMBER',
  sequenceNumber?: string
): Promise<string> {
  const client = getStreamsClient()
  const res = await client.send(new GetShardIteratorCommand({
    StreamArn: streamArn,
    ShardId: shardId,
    ShardIteratorType: iteratorType,
    SequenceNumber: sequenceNumber,
  }))
  return res.ShardIterator ?? ''
}

export async function getRecords(
  shardIterator: string,
  limit = 100
): Promise<{ records: DynamoStreamRecord[]; nextShardIterator?: string }> {
  const client = getStreamsClient()
  const res = await client.send(new GetRecordsCommand({
    ShardIterator: shardIterator,
    Limit: limit,
  }))

  const records: DynamoStreamRecord[] = (res.Records ?? []).map((r) => ({
    eventId: r.eventID,
    eventName: r.eventName,
    eventVersion: r.eventVersion,
    awsRegion: r.awsRegion,
    sequenceNumber: r.dynamodb?.SequenceNumber,
    sizeBytes: r.dynamodb?.SizeBytes,
    streamViewType: r.dynamodb?.StreamViewType,
    approximateCreationDateTime: r.dynamodb?.ApproximateCreationDateTime?.toISOString(),
    keys: r.dynamodb?.Keys as Record<string, any> | undefined,
    newImage: r.dynamodb?.NewImage as Record<string, any> | undefined,
    oldImage: r.dynamodb?.OldImage as Record<string, any> | undefined,
  }))

  return { records, nextShardIterator: res.NextShardIterator }
}

export async function updateTableStream(
  tableName: string,
  enabled: boolean,
  viewType: 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY' = 'NEW_AND_OLD_IMAGES'
): Promise<void> {
  const { raw } = getDynamoDbClient()
  await raw.send(new UpdateTableCommand({
    TableName: tableName,
    StreamSpecification: {
      StreamEnabled: enabled,
      StreamViewType: enabled ? viewType : undefined,
    },
  }))
}
