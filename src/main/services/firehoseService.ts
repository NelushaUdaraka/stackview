import {
  FirehoseClient,
  ListDeliveryStreamsCommand,
  DescribeDeliveryStreamCommand,
  CreateDeliveryStreamCommand,
  DeleteDeliveryStreamCommand,
  PutRecordCommand,
} from '@aws-sdk/client-firehose'

let client: FirehoseClient | null = null
let currentEndpoint = ''
let currentRegion = ''

function getClient(): FirehoseClient {
  if (!client) throw new Error('Firehose client not initialized')
  return client
}

export function reinitFirehose(endpoint: string, region: string) {
  if (client && endpoint === currentEndpoint && region === currentRegion) return
  client = new FirehoseClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
  currentEndpoint = endpoint
  currentRegion = region
}

export async function listDeliveryStreams(): Promise<string[]> {
  const c = getClient()
  const res = await c.send(new ListDeliveryStreamsCommand({}))
  return res.DeliveryStreamNames || []
}

export async function describeDeliveryStream(name: string): Promise<any> {
  const c = getClient()
  const res = await c.send(new DescribeDeliveryStreamCommand({ DeliveryStreamName: name }))
  return res.DeliveryStreamDescription
}

export async function createDeliveryStream(name: string, bucketArn: string, roleArn: string): Promise<string> {
  const c = getClient()
  const res = await c.send(
    new CreateDeliveryStreamCommand({
      DeliveryStreamName: name,
      DeliveryStreamType: 'DirectPut',
      ExtendedS3DestinationConfiguration: {
        BucketARN: bucketArn,
        RoleARN: roleArn,
        BufferingHints: {
          SizeInMBs: 1,
          IntervalInSeconds: 60
        }
      }
    })
  )
  return res.DeliveryStreamARN || ''
}

export async function deleteDeliveryStream(name: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteDeliveryStreamCommand({ DeliveryStreamName: name }))
}

export async function putRecord(name: string, data: string): Promise<string> {
  const c = getClient()
  // Data must be binary (Uint8Array)
  const encoder = new TextEncoder()
  const binaryData = encoder.encode(data)
  
  const res = await c.send(
    new PutRecordCommand({
      DeliveryStreamName: name,
      Record: { Data: binaryData }
    })
  )
  return res.RecordId || ''
}
