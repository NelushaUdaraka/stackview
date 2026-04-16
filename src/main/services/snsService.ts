import {
  SNSClient,
  ListTopicsCommand,
  CreateTopicCommand,
  DeleteTopicCommand,
  ListSubscriptionsByTopicCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  PublishCommand,
  type Topic,
  type Subscription,
} from '@aws-sdk/client-sns'

export interface SnsTopicMapped {
  arn: string
  name: string
}

export interface SnsSubscriptionMapped {
  subscriptionArn: string
  owner: string
  protocol: string
  endpoint: string
  topicArn: string
}

let snsClient: SNSClient | null = null

function getClient(): SNSClient {
  if (!snsClient) throw new Error('SNS client not initialized')
  return snsClient
}

export function initSnsClient(endpoint: string, region: string): void {
  snsClient = new SNSClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

function extractNameFromArn(arn: string): string {
  // e.g. arn:aws:sns:us-east-1:000000000000:my-topic
  const parts = arn.split(':')
  return parts.length > 0 ? parts[parts.length - 1] : arn
}

export async function listTopics(): Promise<SnsTopicMapped[]> {
  const client = getClient()
  const all: SnsTopicMapped[] = []
  let nextToken: string | undefined
  do {
    const res = await client.send(new ListTopicsCommand({ NextToken: nextToken }))
    res.Topics?.forEach(t => {
      if (t.TopicArn) {
        all.push({
          arn: t.TopicArn,
          name: extractNameFromArn(t.TopicArn)
        })
      }
    })
    nextToken = res.NextToken
  } while (nextToken)
  return all
}

export async function createTopic(name: string): Promise<string> {
  const client = getClient()
  const res = await client.send(new CreateTopicCommand({ Name: name }))
  if (!res.TopicArn) throw new Error('Failed to create topic')
  return res.TopicArn
}

export async function deleteTopic(topicArn: string): Promise<void> {
  const client = getClient()
  await client.send(new DeleteTopicCommand({ TopicArn: topicArn }))
}

export async function listSubscriptionsByTopic(topicArn: string): Promise<SnsSubscriptionMapped[]> {
  const client = getClient()
  const all: SnsSubscriptionMapped[] = []
  let nextToken: string | undefined
  do {
    const res = await client.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn, NextToken: nextToken }))
    res.Subscriptions?.forEach(s => {
      if (s.SubscriptionArn) {
        all.push({
          subscriptionArn: s.SubscriptionArn,
          owner: s.Owner || '',
          protocol: s.Protocol || '',
          endpoint: s.Endpoint || '',
          topicArn: s.TopicArn || topicArn
        })
      }
    })
    nextToken = res.NextToken
  } while (nextToken)
  return all
}

export async function subscribe(topicArn: string, protocol: string, endpoint: string): Promise<string> {
  const client = getClient()
  const res = await client.send(new SubscribeCommand({
    TopicArn: topicArn,
    Protocol: protocol,
    Endpoint: endpoint
  }))
  if (!res.SubscriptionArn) throw new Error('Failed to subscribe')
  return res.SubscriptionArn
}

export async function unsubscribe(subscriptionArn: string): Promise<void> {
  const client = getClient()
  await client.send(new UnsubscribeCommand({ SubscriptionArn: subscriptionArn }))
}

export async function publish(topicArn: string, message: string, subject?: string): Promise<string> {
  const client = getClient()
  const res = await client.send(new PublishCommand({
    TopicArn: topicArn,
    Message: message,
    Subject: subject || undefined
  }))
  if (!res.MessageId) throw new Error('Failed to publish message')
  return res.MessageId
}
