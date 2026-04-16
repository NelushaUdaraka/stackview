import {
  SQSClient,
  ListQueuesCommand,
  CreateQueueCommand,
  DeleteQueueCommand,
  PurgeQueueCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
  GetQueueUrlCommand,
  ListQueueTagsCommand,
  type QueueAttributeName
} from '@aws-sdk/client-sqs'

let sqsClient: SQSClient | null = null

export function initSQSClient(endpoint: string, region: string): void {
  sqsClient = new SQSClient({
    endpoint,
    region,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  })
}

export function getSQSClient(): SQSClient {
  if (!sqsClient) throw new Error('SQS client not initialized')
  return sqsClient
}

export async function testConnection(endpoint: string, region: string): Promise<boolean> {
  const client = new SQSClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
  try {
    await client.send(new ListQueuesCommand({}))
    return true
  } catch {
    return false
  }
}

export async function listQueues(): Promise<string[]> {
  const client = getSQSClient()
  const urls: string[] = []
  let nextToken: string | undefined

  do {
    const result = await client.send(
      new ListQueuesCommand({ NextToken: nextToken, MaxResults: 1000 })
    )
    if (result.QueueUrls) urls.push(...result.QueueUrls)
    nextToken = result.NextToken
  } while (nextToken)

  return urls
}

export async function createQueue(
  queueName: string,
  isFifo: boolean,
  attributes: Record<string, string>
): Promise<string> {
  const client = getSQSClient()
  const attrs: Record<string, string> = { ...attributes }

  if (isFifo) {
    attrs['FifoQueue'] = 'true'
    if (!queueName.endsWith('.fifo')) {
      queueName = queueName + '.fifo'
    }
  }

  const result = await client.send(
    new CreateQueueCommand({ QueueName: queueName, Attributes: attrs })
  )
  return result.QueueUrl!
}

export async function deleteQueue(queueUrl: string): Promise<void> {
  const client = getSQSClient()
  await client.send(new DeleteQueueCommand({ QueueUrl: queueUrl }))
}

export async function purgeQueue(queueUrl: string): Promise<void> {
  const client = getSQSClient()
  await client.send(new PurgeQueueCommand({ QueueUrl: queueUrl }))
}

const ALL_ATTRIBUTES: QueueAttributeName[] = [
  'All',
  'ApproximateNumberOfMessages',
  'ApproximateNumberOfMessagesNotVisible',
  'ApproximateNumberOfMessagesDelayed',
  'CreatedTimestamp',
  'DelaySeconds',
  'LastModifiedTimestamp',
  'MaximumMessageSize',
  'MessageRetentionPeriod',
  'QueueArn',
  'ReceiveMessageWaitTimeSeconds',
  'VisibilityTimeout',
  'RedrivePolicy',
  'FifoQueue',
  'ContentBasedDeduplication'
]

export async function getQueueAttributes(
  queueUrl: string
): Promise<Record<string, string>> {
  const client = getSQSClient()
  const result = await client.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ALL_ATTRIBUTES
    })
  )
  return result.Attributes ?? {}
}

export async function setQueueAttributes(
  queueUrl: string,
  attributes: Record<string, string>
): Promise<void> {
  const client = getSQSClient()
  await client.send(
    new SetQueueAttributesCommand({ QueueUrl: queueUrl, Attributes: attributes })
  )
}

export interface SQSMessage {
  MessageId: string
  ReceiptHandle: string
  Body: string
  Attributes?: Record<string, string>
  MessageAttributes?: Record<string, { DataType: string; StringValue?: string }>
  MD5OfBody?: string
  SentTimestamp?: string
}

export async function sendMessage(
  queueUrl: string,
  body: string,
  delaySeconds?: number,
  messageGroupId?: string,
  messageDeduplicationId?: string,
  messageAttributes?: Record<string, { DataType: string; StringValue: string }>
): Promise<string> {
  const client = getSQSClient()
  const result = await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: body,
      DelaySeconds: delaySeconds,
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: messageDeduplicationId,
      MessageAttributes: messageAttributes
    })
  )
  return result.MessageId!
}

export async function receiveMessages(
  queueUrl: string,
  maxMessages = 10,
  visibilityTimeout = 30,
  waitTimeSeconds = 0
): Promise<SQSMessage[]> {
  const client = getSQSClient()
  const result = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      VisibilityTimeout: visibilityTimeout,
      WaitTimeSeconds: waitTimeSeconds,
      AttributeNames: ['All'],
      MessageAttributeNames: ['All']
    })
  )

  return (result.Messages ?? []).map((m) => ({
    MessageId: m.MessageId!,
    ReceiptHandle: m.ReceiptHandle!,
    Body: m.Body!,
    Attributes: m.Attributes as Record<string, string>,
    MessageAttributes: m.MessageAttributes as Record<
      string,
      { DataType: string; StringValue?: string }
    >,
    MD5OfBody: m.MD5OfBody,
    SentTimestamp: m.Attributes?.SentTimestamp
  }))
}

export async function deleteMessage(
  queueUrl: string,
  receiptHandle: string
): Promise<void> {
  const client = getSQSClient()
  await client.send(
    new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle })
  )
}

export async function getQueueUrl(queueName: string): Promise<string> {
  const client = getSQSClient()
  const result = await client.send(new GetQueueUrlCommand({ QueueName: queueName }))
  return result.QueueUrl!
}

export async function getQueueTags(queueUrl: string): Promise<Record<string, string>> {
  const client = getSQSClient()
  const result = await client.send(new ListQueueTagsCommand({ QueueUrl: queueUrl }))
  return result.Tags ?? {}
}
