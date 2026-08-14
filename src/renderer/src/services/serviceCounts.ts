import type { Service } from '../types'

/**
 * Resource count per service, as every direction's sidebar and service table shows
 * ("SQS 9", "S3 12 buckets"). Each entry is the service's primary list call plus the
 * noun the design labels it with.
 *
 * Counting is best-effort: a service LocalStack has not started, or one whose list
 * call fails, resolves to `null` and the shells render a dash rather than a zero —
 * "no data" and "none" are different statements.
 */
interface CountSpec {
  /** Singular noun; shells pluralise with a trailing "s" where needed. */
  noun: string
  fetch: () => Promise<number | null>
}

const api = () => window.electronAPI as unknown as Record<string, undefined | (() => Promise<unknown>)>

/** Runs a list call by preload method name and returns the array length. */
function count(method: string, pick?: (d: unknown) => unknown): () => Promise<number | null> {
  return async () => {
    try {
      const fn = api()[method]
      if (typeof fn !== 'function') return null
      const res = (await fn()) as { success?: boolean; data?: unknown } | unknown[]
      const data = Array.isArray(res) ? res : res && typeof res === 'object' && 'data' in res
        ? (res as { success?: boolean; data?: unknown }).success === false ? null : (res as { data?: unknown }).data
        : null
      if (data == null) return null
      const arr = pick ? pick(data) : data
      return Array.isArray(arr) ? arr.length : null
    } catch {
      return null
    }
  }
}

export const SERVICE_COUNTS: Record<Service, CountSpec> = {
  sqs:            { noun: 'queue',        fetch: count('listQueues') },
  s3:             { noun: 'bucket',       fetch: count('s3ListBuckets') },
  dynamodb:       { noun: 'table',        fetch: count('dynamoDbListTables') },
  lambda:         { noun: 'function',     fetch: count('lambdaListFunctions') },
  secretsmanager: { noun: 'secret',       fetch: count('secretsManagerListSecrets') },
  sns:            { noun: 'topic',        fetch: count('snsListTopics') },
  eventbridge:    { noun: 'bus',          fetch: count('ebListBuses') },
  cloudwatch:     { noun: 'log group',    fetch: count('cloudwatchListLogGroups') },
  ssm:            { noun: 'parameter',    fetch: count('ssmListParameters') },
  kms:            { noun: 'key',          fetch: count('kmsListKeysWithAliases') },
  iam:            { noun: 'role',         fetch: count('iamListRoles') },
  sts:            { noun: 'identity',     fetch: async () => null },
  apigw:          { noun: 'API',          fetch: count('apigwListRestApis') },
  cloudformation: { noun: 'stack',        fetch: count('cfnListStacks') },
  ses:            { noun: 'identity',     fetch: count('sesListIdentities') },
  firehose:       { noun: 'stream',       fetch: count('firehoseListDeliveryStreams') },
  kinesis:        { noun: 'stream',       fetch: count('kinesisListStreams') },
  redshift:       { noun: 'cluster',      fetch: count('redshiftListClusters') },
  opensearch:     { noun: 'domain',       fetch: count('opensearchListDomains') },
  ec2:            { noun: 'instance',     fetch: count('ec2ListInstances') },
  transcribe:     { noun: 'job',          fetch: count('transcribeListJobs') },
  scheduler:      { noun: 'schedule',     fetch: count('schedulerListSchedules') },
  route53:        { noun: 'zone',         fetch: count('route53ListHostedZones') },
  acm:            { noun: 'certificate',  fetch: count('acmListCertificates') },
  swf:            { noun: 'domain',       fetch: count('swfListDomains') },
  sfn:            { noun: 'state machine', fetch: count('sfnListStateMachines') },
  support:        { noun: 'case',         fetch: count('supportDescribeCases') },
  r53resolver:    { noun: 'endpoint',     fetch: count('r53rListEndpoints') },
  awsconfig:      { noun: 'resource',     fetch: count('configListDiscoveredResources') },
  s3control:      { noun: 'access point', fetch: count('s3controlListAccessPoints') },
  resourcegroups: { noun: 'group',        fetch: count('rgListGroups') },
}

/** English plural for the count nouns used here ("bus" -> "buses", not "buss"). */
export function plural(noun: string, n: number): string {
  if (n === 1) return noun
  if (/(s|x|z|ch|sh)$/.test(noun)) return `${noun}es`
  if (/[^aeiou]y$/.test(noun)) return `${noun.slice(0, -1)}ies`
  return `${noun}s`
}

export function countNoun(svc: Service, n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n} ${plural(SERVICE_COUNTS[svc].noun, n)}`
}
