import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  DescribeLogStreamsCommand,
  CreateLogStreamCommand,
  DeleteLogStreamCommand,
  GetLogEventsCommand,
  FilterLogEventsCommand
} from '@aws-sdk/client-cloudwatch-logs'
import {
  CloudWatchClient,
  ListMetricsCommand,
  GetMetricDataCommand,
  DescribeAlarmsCommand,
  PutMetricAlarmCommand,
  DeleteAlarmsCommand,
  SetAlarmStateCommand,
  PutMetricDataCommand
} from '@aws-sdk/client-cloudwatch'

let logsClient: CloudWatchLogsClient | null = null
let currentEndpoint: string = ''
let currentRegion: string = ''

export function reinitCloudWatchClient(endpoint: string, region: string) {
  currentEndpoint = endpoint.replace(/\/$/, '')
  currentRegion = region || 'us-east-1'
  
  const config = {
    endpoint: currentEndpoint,
    region: currentRegion,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  }
  logsClient = new CloudWatchLogsClient({
    ...config,
    disableHostPrefix: true,
  })
}

function getLogsClient(): CloudWatchLogsClient {
  if (!logsClient) throw new Error('CloudWatchLogsClient not initialized')
  return logsClient
}

/**
 * Robust helper to call CloudWatch (Metrics/Alarms) using standard Query protocol.
 * Bypasses SDK v3 protocol-selection and deserialization issues with LocalStack.
 */
// --- Logs ---

export async function listLogGroups() {
  const c = getLogsClient()
  try {
    const res = await c.send(new DescribeLogGroupsCommand({}))
    return res.logGroups || []
  } catch (err: any) {
    console.error('CloudWatch ListLogGroups Error:', err);
    if (err.$response) console.error('Raw Response Body:', await err.$response.body.transformToString());
    throw err;
  }
}

export async function createLogGroup(name: string) {
  const c = getLogsClient()
  try { await c.send(new CreateLogGroupCommand({ logGroupName: name })); }
  catch (err: any) {
    console.error('CloudWatch CreateLogGroup Error:', err);
    if (err.$response) console.error('Raw Response:', await err.$response.body.transformToString());
    throw err;
  }
}

export async function deleteLogGroup(name: string) {
  const c = getLogsClient()
  try { await c.send(new DeleteLogGroupCommand({ logGroupName: name })); }
  catch (err: any) {
    console.error('CloudWatch DeleteLogGroup Error:', err);
    if (err.$response) console.error('Raw Response:', await err.$response.body.transformToString());
    throw err;
  }
}

export async function listLogStreams(groupName: string) {
  const c = getLogsClient()
  try {
    const res = await c.send(new DescribeLogStreamsCommand({ logGroupName: groupName }))
    return res.logStreams || []
  } catch (err: any) {
    console.error('CloudWatch ListLogStreams Error:', err);
    if (err.$response) console.error('Raw Response Body:', await err.$response.body.transformToString());
    throw err;
  }
}

export async function createLogStream(groupName: string, streamName: string) {
  const c = getLogsClient()
  await c.send(new CreateLogStreamCommand({ logGroupName: groupName, logStreamName: streamName }))
}

export async function deleteLogStream(groupName: string, streamName: string) {
  const c = getLogsClient()
  await c.send(new DeleteLogStreamCommand({ logGroupName: groupName, logStreamName: streamName }))
}

export async function getLogEvents(groupName: string, streamName: string, options: { limit?: number, nextToken?: string } = {}) {
  const c = getLogsClient()
  try {
    const res = await c.send(new GetLogEventsCommand({
      logGroupName: groupName,
      logStreamName: streamName,
      limit: options.limit,
      nextToken: options.nextToken
    }))
    return {
      events: res.events || [],
      nextForwardToken: res.nextForwardToken,
      nextBackwardToken: res.nextBackwardToken
    }
  } catch (err: any) {
    console.error('CloudWatch GetLogEvents Error:', err);
    if (err.$response) {
      try {
        const body = await err.$response.body.transformToString();
        console.error('Raw Response Body:', body);
      } catch (e) {
        console.error('Could not read response body');
      }
    }
    throw err;
  }
}

export async function filterLogEvents(groupName: string, options: { filterPattern?: string, limit?: number, nextToken?: string } = {}) {
  const c = getLogsClient()
  const res = await c.send(new FilterLogEventsCommand({
    logGroupName: groupName,
    filterPattern: options.filterPattern,
    limit: options.limit,
    nextToken: options.nextToken
  }))
  return {
    events: res.events || [],
    nextToken: res.nextToken
  }
}

