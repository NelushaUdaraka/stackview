// Shared types used by both src/preload/index.ts and src/renderer/src/types.ts.
// Pure data shapes only — no Electron, React, or process-specific imports.

export interface AppSettings {
  endpoint: string
  region: string
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'ready' | 'error'

export interface UpdaterStatus {
  status: UpdateStatus
  version?: string
  percent?: number
  message?: string
}

export interface IpcResult<T = undefined> {
  success: boolean
  data?: T
  error?: string
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

export interface S3BucketInfo {
  name: string
  creationDate?: string
}

export interface S3ObjectInfo {
  key: string
  size?: number
  lastModified?: string
  etag?: string
  isFolder: boolean
  contentType?: string
}

export interface S3ListResult {
  objects: S3ObjectInfo[]
  prefixes: string[]
  nextToken?: string
  totalCount: number
}

export interface S3ObjectMeta {
  key: string
  size?: number
  lastModified?: string
  etag?: string
  contentType?: string
  metadata?: Record<string, string>
}

export interface SecretInfo {
  name: string
  arn?: string
  description?: string
  createdDate?: string
}

export interface SecretValue {
  arn?: string
  name?: string
  secretString?: string
  secretBinary?: Uint8Array
  createdDate?: string
}

export interface DynamoTableInfo {
  name: string
  creationDate?: string
  itemCount?: number
  sizeBytes?: number
  status?: string
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

export type DynamoItem = Record<string, any>

export interface DynamoStream {
  streamArn: string
  tableName?: string
  streamLabel?: string
}

export interface DynamoStreamShard {
  shardId: string
  parentShardId?: string
  startingSequenceNumber?: string
  endingSequenceNumber?: string
}

export interface DynamoStreamRecord {
  eventId?: string
  eventName?: string
  eventVersion?: string
  awsRegion?: string
  sequenceNumber?: string
  sizeBytes?: number
  streamViewType?: string
  approximateCreationDateTime?: string
  keys?: Record<string, any>
  newImage?: Record<string, any>
  oldImage?: Record<string, any>
}

// ── Resource Groups ───────────────────────────────────────────────────────────

export interface RgGroup {
  groupArn: string
  name: string
  description?: string
}

export interface RgTagSyncTask {
  taskArn: string
  groupName: string
  groupArn: string
  tagKey: string
  tagValue: string
  status: string
  errorMessage?: string
  createdAt?: string
}

export interface RgTaggedResource {
  resourceArn: string
  tags?: Record<string, string>
}

// ── SWF (Simple Workflow Service) ─────────────────────────────────────────────

export interface SwfDomain {
  name: string
  arn?: string
  status: string
  description?: string
  workflowExecutionRetentionPeriodInDays?: string
}

export interface SwfWorkflowType {
  name: string
  version: string
  status: string
  description?: string
  creationDate?: string
  deprecationDate?: string
}

export interface SwfActivityType {
  name: string
  version: string
  status: string
  description?: string
  creationDate?: string
  deprecationDate?: string
}

export interface SwfExecution {
  workflowId: string
  runId: string
  workflowType?: { name: string; version: string }
  startTimestamp?: string
  closeTimestamp?: string
  closeStatus?: string
  executionStatus: 'OPEN' | 'CLOSED'
}

export interface SwfExecutionDetail {
  workflowId: string
  runId: string
  workflowType?: { name: string; version: string }
  startTimestamp?: string
  closeTimestamp?: string
  closeStatus?: string
  executionStatus?: string
  tagList?: string[]
  taskList?: string
  executionStartToCloseTimeout?: string
  taskStartToCloseTimeout?: string
  openActivityTasks?: number
  openDecisionTasks?: number
  openTimers?: number
  openChildWorkflowExecutions?: number
}

export interface SwfHistoryEvent {
  eventTimestamp?: string
  eventType: string
  eventId: number
  details?: string
}

// ── SFN (Step Functions) ───────────────────────────────────────────────────────

export interface SfnStateMachine {
  name: string
  stateMachineArn: string
  type: 'STANDARD' | 'EXPRESS'
  status?: string
  creationDate?: string
}

export interface SfnStateMachineDetail extends SfnStateMachine {
  definition?: string
  roleArn?: string
}

export interface SfnExecution {
  executionArn: string
  stateMachineArn: string
  name: string
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED' | 'PENDING_REDRIVE'
  startDate?: string
  stopDate?: string
}

export interface SfnExecutionDetail extends SfnExecution {
  input?: string
  output?: string
  cause?: string
  error?: string
}

export interface SfnHistoryEvent {
  id: number
  previousEventId?: number
  type: string
  timestamp?: string
  details?: string
}

// ── Support ───────────────────────────────────────────────────────────────────

export interface SupportCase {
  caseId: string
  displayId?: string
  subject: string
  status?: string
  serviceCode?: string
  categoryCode?: string
  severityCode?: string
  submittedBy?: string
  timeCreated?: string
  language?: string
}

export interface TrustedAdvisorCheck {
  id: string
  name: string
  description: string
  category: string
  metadata: string[]
}

// ── AWS Config ────────────────────────────────────────────────────────────────

export interface ConfigRecorder {
  name: string
  roleARN?: string
  allSupported: boolean
  includeGlobalResourceTypes: boolean
  resourceTypes: string[]
  recording: boolean
  lastStatus?: string
  lastStartTime?: string
  lastStopTime?: string
}

export interface ConfigDeliveryChannel {
  name: string
  s3BucketName?: string
  s3KeyPrefix?: string
  snsTopicARN?: string
  deliveryFrequency?: string
  lastSuccessfulTime?: string
  lastAttemptTime?: string
}

export interface ConfigRule {
  name: string
  arn?: string
  id?: string
  description?: string
  state?: string
  sourceOwner: string
  sourceIdentifier: string
  scope?: {
    tagKey?: string
    tagValue?: string
    resourceTypes: string[]
  }
}

export interface ConfigComplianceResult {
  ruleName: string
  resourceId?: string
  resourceType?: string
  complianceType: string
  compliantCount: number
  annotation?: string
  resultRecordedTime?: string
}

export interface ConfigDiscoveredResource {
  resourceType: string
  resourceId: string
  resourceName?: string
  sourceName?: string
}

export interface ConfigResourceHistory {
  resourceType: string
  resourceId: string
  resourceName?: string
  configurationStateId?: string
  configurationItemStatus?: string
  configurationItemCaptureTime?: string
  configuration?: string
  tags?: Record<string, string>
}

// ── Route 53 Resolver ─────────────────────────────────────────────────────────

export interface R53ResolverEndpoint {
  id: string
  name?: string
  arn?: string
  direction: string
  status: string
  statusMessage?: string
  securityGroupIds: string[]
  hostVPCId?: string
  ipAddressCount: number
  creationTime?: string
}

export interface R53ResolverRule {
  id: string
  name?: string
  arn?: string
  status: string
  domainName?: string
  ruleType: string
  resolverEndpointId?: string
  creationTime?: string
}

export interface R53RuleAssociation {
  id: string
  name?: string
  resolverRuleId: string
  vpcId?: string
  status: string
}

export interface R53FirewallRuleGroup {
  id: string
  name: string
  arn?: string
  status: string
  shareStatus?: string
  ruleCount: number
  creationTime?: string
}

export interface R53FirewallRule {
  firewallRuleGroupId: string
  firewallDomainListId: string
  name: string
  priority: number
  action: string
  blockResponse?: string
  blockOverrideDomain?: string
  blockOverrideDnsType?: string
  creationTime?: string
}

export interface R53FirewallRuleGroupAssociation {
  id: string
  name?: string
  firewallRuleGroupId: string
  vpcId: string
  priority: number
  status: string
  creationTime?: string
}

export interface R53FirewallDomainList {
  id: string
  name: string
  arn?: string
  domainCount: number
  status: string
  creationTime?: string
}

// ── S3 Control ────────────────────────────────────────────────────────────────

export interface S3ControlAccessPoint {
  name: string
  bucket: string
  accessPointArn?: string
  alias?: string
  networkOrigin?: string
  vpcId?: string
  createdAt?: string
}

export interface S3ControlPublicAccessBlock {
  blockPublicAcls: boolean
  ignorePublicAcls: boolean
  blockPublicPolicy: boolean
  restrictPublicBuckets: boolean
}

export interface S3ControlMRAP {
  name: string
  alias?: string
  arn?: string
  status?: string
  createdAt?: string
  regions?: Array<{ bucket: string; region?: string }>
}

