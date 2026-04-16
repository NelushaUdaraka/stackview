export type {
  AppSettings,
  IpcResult,
  UpdaterStatus,
  SQSMessage,
  S3BucketInfo,
  S3ObjectInfo,
  S3ListResult,
  S3ObjectMeta,
  SecretInfo,
  SecretValue,
  DynamoTableInfo,
  DynamoQueryOptions,
  DynamoItem,
  DynamoStream,
  DynamoStreamShard,
  DynamoStreamRecord,
  SwfDomain,
  SwfWorkflowType,
  SwfActivityType,
  SwfExecution,
  SwfExecutionDetail,
  SwfHistoryEvent,
  SfnStateMachine,
  SfnStateMachineDetail,
  SfnExecution,
  SfnExecutionDetail,
  SfnHistoryEvent,
  SupportCase,
  TrustedAdvisorCheck,
  RgGroup,
  RgTagSyncTask,
  RgTaggedResource,
  ConfigRecorder,
  ConfigDeliveryChannel,
  ConfigRule,
  ConfigComplianceResult,
  ConfigDiscoveredResource,
  ConfigResourceHistory,
  R53ResolverEndpoint,
  R53ResolverRule,
  R53RuleAssociation,
  R53FirewallRuleGroup,
  R53FirewallRule,
  R53FirewallRuleGroupAssociation,
  R53FirewallDomainList,
  S3ControlAccessPoint,
  S3ControlPublicAccessBlock,
  S3ControlMRAP,
} from '../../shared/types'

export interface QueueInfo {
  url: string
  name: string
  attributes?: Record<string, string>
}

export type { Theme } from '../../shared/themes'

export type IconMode = 'lucide' | 'aws'

export type ActiveTab = 'overview' | 'messages' | 'attributes'

export type AppScreen = 'connection' | 'main'

export interface AppTab {
  id: string
  service: Service | null
}

export type Service =
  | 'sqs'
  | 's3'
  | 'secretsmanager'
  | 'dynamodb'
  | 'cloudformation'
  | 'ssm'
  | 'sns'
  | 'eventbridge'
  | 'scheduler'
  | 'ses'
  | 'kms'
  | 'iam'
  | 'sts'
  | 'apigw'
  | 'firehose'
  | 'lambda'
  | 'cloudwatch'
  | 'redshift'
  | 'kinesis'
  | 'opensearch'
  | 'ec2'
  | 'transcribe'
  | 'route53'
  | 'acm'
  | 'swf'
  | 'sfn'
  | 'support'
  | 'resourcegroups'
  | 'awsconfig'
  | 'r53resolver'
  | 's3control'

export interface LambdaFunction {
  FunctionName: string
  FunctionArn: string
  Runtime: string
  Role: string
  Handler: string
  CodeSize: number
  Description?: string
  Timeout: number
  MemorySize: number
  LastModified: string
  CodeSha256: string
  Version: string
  State?: string
  LastUpdateStatus?: string
}

export interface FirehoseDeliveryStream {
  DeliveryStreamName: string
  DeliveryStreamARN: string
  DeliveryStreamStatus: string
  DeliveryStreamType: string
  VersionId: string
  CreateTimestamp?: string
  LastUpdateTimestamp?: string
  Destinations: any[]
}

export interface ApigwRestApi {
  id: string
  name: string
  description?: string
  createdDate?: string
}

export interface ApigwResource {
  id: string
  parentId?: string
  pathPart?: string
  path?: string
  resourceMethods?: Record<string, any>
}

export interface ApigwStage {
  stageName: string
  deploymentId?: string
  createdDate?: string
  lastUpdatedDate?: string
}

export interface RedshiftCluster {
  ClusterIdentifier?: string
  NodeType?: string
  ClusterStatus?: string
  MasterUsername?: string
  DBName?: string
  Endpoint?: {
    Address?: string
    Port?: number
  }
  ClusterCreateTime?: string
  AutomatedSnapshotRetentionPeriod?: number
  ClusterSubnetGroupName?: string
  VpcId?: string
  AvailabilityZone?: string
  PreferredMaintenanceWindow?: string
  ClusterVersion?: string
  AllowVersionUpgrade?: boolean
  NumberOfNodes?: number
  PubliclyAccessible?: boolean
  Encrypted?: boolean
  VpcSecurityGroups?: {
    VpcSecurityGroupId?: string
    Status?: string
  }[]
  ClusterNodes?: RedshiftClusterNode[]
}

export interface RedshiftClusterNode {
  NodeRole?: string
  PrivateIPAddress?: string
  PublicIPAddress?: string
}

export interface SsmParameter {
  name: string
  type: 'String' | 'StringList' | 'SecureString'
  value?: string
  version?: number
  lastModifiedDate?: string
  description?: string
  arn?: string
  dataType?: string
  tier?: string
}

export interface SnsTopic {
  arn: string
  name: string
}

export interface SnsSubscription {
  subscriptionArn: string
  owner: string
  protocol: string
  endpoint: string
  topicArn: string
}

export interface EbBus {
  name: string
  arn: string
}

export interface EbRule {
  name: string
  arn: string
  eventPattern?: string
  state?: string
  description?: string
  scheduleExpression?: string
}

export interface EbTarget {
  id: string
  arn: string
  input?: string
  inputPath?: string
}

export interface EbEventEntry {
  source: string
  detailType: string
  detail: string
}

export interface EbScheduleGroup {
  name: string
  arn: string
  state?: string
  creationDate?: string
}

export interface EbSchedule {
  name: string
  arn?: string
  groupName?: string
  state?: string
  scheduleExpression?: string
  scheduleExpressionTimezone?: string
  description?: string
  startDate?: string
  endDate?: string
  targetArn?: string
  targetRoleArn?: string
  targetInput?: string
  creationDate?: string
  lastModificationDate?: string
}

export interface SesIdentity {
  name: string
  type: 'Email' | 'Domain' | 'Unknown'
  verificationStatus: string
}

export interface KmsAlias {
  aliasName: string
  aliasArn: string
  targetKeyId: string
}

export interface KmsKey {
  KeyId: string
  Arn: string
  Description?: string
  CreationDate?: Date
  Enabled?: boolean
  KeyState?: string
  Aliases?: string[]
}

export interface KinesisStream {
  StreamName?: string
  StreamARN?: string
  StreamStatus?: string
  StreamModeDetails?: {
    StreamMode?: string
  }
  ShardCount?: number
  HasMoreShards?: boolean
  RetentionPeriodHours?: number
  StreamCreationTimestamp?: string
  EncryptionType?: string
  KeyId?: string
  Shards?: KinesisShard[]
  EnhancedMonitoring?: {
    ShardLevelMetrics?: string[]
  }[]
}

export interface KinesisShard {
  ShardId: string
  ParentShardId?: string
  AdjacentParentShardId?: string
  HashKeyRange: {
    StartingHashKey: string
    EndingHashKey: string
  }
  SequenceNumberRange: {
    StartingSequenceNumber: string
    EndingSequenceNumber?: string
  }
}

export interface IamUser {
  userId: string
  userName: string
  arn: string
  createDate?: string
}

export interface IamRole {
  roleId: string
  roleName: string
  arn: string
  createDate?: string
  assumeRolePolicyDocument?: string
}

export interface IamGroup {
  groupId: string
  groupName: string
  arn: string
  createDate?: string
}

export interface IamPolicy {
  policyId: string
  policyName: string
  arn: string
  createDate?: string
  defaultVersionId?: string
  description?: string
}

// --- CloudWatch Types ---

export interface CloudWatchLogGroup {
  logGroupName?: string
  creationTime?: number
  retentionInDays?: number
  metricFilterCount?: number
  arn?: string
  storedBytes?: number
}

export interface CloudWatchLogStream {
  logStreamName?: string
  creationTime?: number
  firstEventTimestamp?: number
  lastEventTimestamp?: number
  lastIngestionTime?: number
  uploadSequenceToken?: string
  arn?: string
  storedBytes?: number
}

export interface CloudWatchLogEvent {
  timestamp?: number
  message?: string
  ingestionTime?: number
  eventId?: string
}

export interface CloudWatchMetric {
  Namespace?: string
  MetricName?: string
  Dimensions?: { Name: string; Value: string }[]
}

export interface CloudWatchAlarm {
  AlarmName: string
  AlarmArn?: string
  AlarmDescription?: string
  StateValue?: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA'
  StateReason?: string
  StateReasonData?: string
  StateUpdatedTimestamp?: string
  MetricName?: string
  Namespace?: string
  Statistic?: string
  Period?: number
  EvaluationPeriods?: number
  Threshold?: number
  ComparisonOperator?: string
}

export interface OpenSearchDomain {
  name: string
  arn?: string
  status?: string
  endpoint?: string
  engineVersion?: string
  clusterConfig?: {
    InstanceType?: string
    InstanceCount?: number
    DedicatedMasterEnabled?: boolean
    ZoneAwarenessEnabled?: boolean
  }
}

export interface OpenSearchIndex {
  index: string
  health: string
  status: string
  docsCount: string
  storeSize: string
  pri?: string
  rep?: string
  uuid?: string
}

export interface OpenSearchDocument {
  _id: string
  _index: string
  _source: Record<string, unknown>
  _score?: number
}

// --- EC2 Types ---

export interface Ec2Instance {
  InstanceId?: string
  InstanceType?: string
  State?: { Name?: string; Code?: number }
  PublicIpAddress?: string
  PrivateIpAddress?: string
  ImageId?: string
  KeyName?: string
  LaunchTime?: string
  Platform?: string
  Architecture?: string
  SubnetId?: string
  VpcId?: string
  SecurityGroups?: { GroupId?: string; GroupName?: string }[]
  Tags?: { Key?: string; Value?: string }[]
  ReservationId?: string
  Monitoring?: { State?: string }
  Placement?: { AvailabilityZone?: string; Tenancy?: string }
  RootDeviceType?: string
  RootDeviceName?: string
}

export interface Ec2Image {
  ImageId?: string
  Name?: string
  Description?: string
  State?: string
  Architecture?: string
  Platform?: string
  OwnerId?: string
  CreationDate?: string
  RootDeviceType?: string
  VirtualizationType?: string
}

export interface Ec2KeyPair {
  KeyPairId?: string
  KeyName?: string
  KeyFingerprint?: string
  CreateTime?: string
  Tags?: { Key?: string; Value?: string }[]
}

export interface Ec2SecurityGroup {
  GroupId?: string
  GroupName?: string
  Description?: string
  VpcId?: string
  OwnerId?: string
  IpPermissions?: Ec2IpPermission[]
  IpPermissionsEgress?: Ec2IpPermission[]
  Tags?: { Key?: string; Value?: string }[]
}

export interface Ec2IpPermission {
  IpProtocol?: string
  FromPort?: number
  ToPort?: number
  IpRanges?: { CidrIp?: string; Description?: string }[]
  Ipv6Ranges?: { CidrIpv6?: string }[]
  UserIdGroupPairs?: { GroupId?: string; GroupName?: string }[]
}

export interface Ec2Vpc {
  VpcId?: string
  CidrBlock?: string
  State?: string
  IsDefault?: boolean
  OwnerId?: string
  DhcpOptionsId?: string
  Tags?: { Key?: string; Value?: string }[]
}

export interface Ec2Subnet {
  SubnetId?: string
  VpcId?: string
  CidrBlock?: string
  AvailabilityZone?: string
  State?: string
  AvailableIpAddressCount?: number
  DefaultForAz?: boolean
  Tags?: { Key?: string; Value?: string }[]
}

export interface Ec2Volume {
  VolumeId?: string
  Size?: number
  VolumeType?: string
  State?: string
  AvailabilityZone?: string
  CreateTime?: string
  Encrypted?: boolean
  Iops?: number
  SnapshotId?: string
  Attachments?: {
    InstanceId?: string
    Device?: string
    State?: string
    AttachTime?: string
  }[]
  Tags?: { Key?: string; Value?: string }[]
}

export interface OpenSearchClusterHealth {
  status: string
  clusterName: string
  numberOfNodes: number
  numberOfDataNodes: number
  activeShards: number
  activePrimaryShards: number
  relocatingShards: number
  initializingShards: number
  unassignedShards: number
}

export interface TranscribeJob {
  jobName: string
  jobStatus: string
  languageCode?: string
  mediaFormat?: string
  mediaUri?: string
  transcriptUri?: string
  creationTime?: string
  startTime?: string
  completionTime?: string
  failureReason?: string
}

export interface Route53HostedZone {
  Id: string
  Name: string
  CallerReference: string
  Config?: { Comment?: string; PrivateZone?: boolean }
  ResourceRecordSetCount?: number
}

export interface Route53RecordSet {
  Name: string
  Type: string
  TTL?: number
  Records?: string[]
  AliasTarget?: { DNSName: string; EvaluateTargetHealth: boolean; HostedZoneId: string }
  SetIdentifier?: string
  Weight?: number
}

export interface Route53HealthCheck {
  Id: string
  CallerReference: string
  HealthCheckConfig?: {
    IPAddress?: string
    Port?: number
    Type?: string
    ResourcePath?: string
    FullyQualifiedDomainName?: string
    RequestInterval?: number
    FailureThreshold?: number
  }
  HealthCheckVersion?: number
}

export interface Route53HealthCheckParams {
  type: string
  ipAddress?: string
  port?: number
  resourcePath?: string
  fqdn?: string
  requestInterval?: number
  failureThreshold?: number
}

// ── STS (Security Token Service) ─────────────────────────────────────────────

export interface StsCallerIdentity {
  account: string
  userId: string
  arn: string
}

export interface StsCredentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
  expiration: string
}

export interface StsAssumedRoleResult {
  assumedRoleArn: string
  assumedRoleId: string
  sessionName: string
  credentials: StsCredentials
}

export interface StsFederatedUserResult {
  federatedUserId: string
  arn: string
  credentials: StsCredentials
}

// ── ACM (Certificate Manager) ─────────────────────────────────────────────────

export interface AcmDomainValidation {
  DomainName: string
  ValidationStatus?: string
  ValidationMethod?: string
  ResourceRecord?: {
    Name: string
    Type: string
    Value: string
  }
}

export interface AcmTag {
  Key: string
  Value?: string
}

export interface AcmCertificate {
  CertificateArn: string
  DomainName: string
  SubjectAlternativeNames?: string[]
  Status?: string
  Type?: string
  KeyAlgorithm?: string
  SignatureAlgorithm?: string
  InUseBy?: string[]
  IssuedAt?: string
  CreatedAt?: string
  NotBefore?: string
  NotAfter?: string
  Serial?: string
  Subject?: string
  Issuer?: string
  RenewalEligibility?: string
  DomainValidationOptions?: AcmDomainValidation[]
  Tags?: AcmTag[]
}

declare global {
  interface Window {
    electronAPI: {
      platform: string
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      isMaximized: () => Promise<boolean>
      getTheme: () => Promise<Theme>
      setTheme: (theme: Theme) => Promise<void>
      getIconMode: () => Promise<IconMode>
      setIconMode: (mode: IconMode) => Promise<void>
      getSettings: () => Promise<AppSettings>
      saveSettings: (endpoint: string, region: string) => Promise<void>
      getAppVersion: () => Promise<string>
      getAutoUpdate: () => Promise<boolean>
      setAutoUpdate: (value: boolean) => Promise<void>
      checkForUpdates: () => Promise<void>
      installUpdate: () => Promise<void>
      onUpdaterStatus: (cb: (status: UpdaterStatus) => void) => () => void
      openFiles: () => Promise<{ canceled: boolean; filePaths: string[] }>
      saveFile: (defaultName: string) => Promise<{ canceled: boolean; filePath?: string }>
      connect: (endpoint: string, region: string) => Promise<IpcResult>
      reinit: (endpoint: string, region: string) => Promise<void>
      listQueues: () => Promise<IpcResult<string[]>>
      createQueue: (
        queueName: string,
        isFifo: boolean,
        attributes: Record<string, string>
      ) => Promise<IpcResult<string>>
      deleteQueue: (queueUrl: string) => Promise<IpcResult>
      purgeQueue: (queueUrl: string) => Promise<IpcResult>
      getQueueAttributes: (queueUrl: string) => Promise<IpcResult<Record<string, string>>>
      setQueueAttributes: (
        queueUrl: string,
        attributes: Record<string, string>
      ) => Promise<IpcResult>
      getQueueTags: (queueUrl: string) => Promise<IpcResult<Record<string, string>>>
      sendMessage: (
        queueUrl: string,
        body: string,
        delaySeconds?: number,
        messageGroupId?: string,
        messageDeduplicationId?: string,
        messageAttributes?: Record<string, { DataType: string; StringValue: string }>
      ) => Promise<IpcResult<string>>
      receiveMessages: (
        queueUrl: string,
        maxMessages: number,
        visibilityTimeout: number,
        waitTimeSeconds: number
      ) => Promise<IpcResult<SQSMessage[]>>
      deleteMessage: (queueUrl: string, receiptHandle: string) => Promise<IpcResult>
      // S3
      s3Reinit: (endpoint: string, region: string) => Promise<void>
      s3ListBuckets: () => Promise<IpcResult<S3BucketInfo[]>>
      s3CreateBucket: (name: string, region: string) => Promise<IpcResult>
      s3DeleteBucket: (name: string) => Promise<IpcResult>
      s3GetBucketLocation: (name: string) => Promise<IpcResult<string>>
      s3ListObjects: (
        bucket: string,
        prefix: string,
        continuationToken?: string
      ) => Promise<IpcResult<S3ListResult>>
      s3HeadObject: (bucket: string, key: string) => Promise<IpcResult<S3ObjectMeta>>
      s3DeleteObject: (bucket: string, key: string) => Promise<IpcResult>
      s3DeleteObjects: (bucket: string, keys: string[]) => Promise<IpcResult<number>>
      s3CopyObject: (
        srcBucket: string,
        srcKey: string,
        destBucket: string,
        destKey: string
      ) => Promise<IpcResult>
      s3UploadObject: (bucket: string, key: string, filePath: string) => Promise<IpcResult>
      s3DownloadObject: (bucket: string, key: string, destPath: string) => Promise<IpcResult>
      s3GetPresignedUrl: (
        bucket: string,
        key: string,
        expiresIn: number
      ) => Promise<IpcResult<string>>
      s3CreateFolder: (bucket: string, folderKey: string) => Promise<IpcResult>
      
      // Secrets Manager
      secretsManagerReinit: (endpoint: string, region: string) => Promise<void>
      secretsManagerListSecrets: () => Promise<IpcResult<SecretInfo[]>>
      secretsManagerCreateSecret: (name: string, description: string, secretString: string) => Promise<IpcResult>
      secretsManagerGetSecretValue: (secretId: string) => Promise<IpcResult<SecretValue>>
      secretsManagerPutSecretValue: (secretId: string, secretString: string) => Promise<IpcResult>
      secretsManagerDeleteSecret: (secretId: string) => Promise<IpcResult>

      // DynamoDB
      dynamoDbReinit: (endpoint: string, region: string) => Promise<void>
      dynamoDbListTables: () => Promise<IpcResult<string[]>>
      dynamoDbDescribeTable: (tableName: string) => Promise<IpcResult<any>>
      dynamoDbCreateTable: (
        tableName: string,
        attributeDefinitions: any[],
        keySchema: any[],
        gsiList?: any[],
        lsiList?: any[]
      ) => Promise<IpcResult>
      dynamoDbDeleteTable: (tableName: string) => Promise<IpcResult>
      dynamoDbScanItems: (tableName: string, limit?: number, exclusiveStartKey?: Record<string, any>) => Promise<IpcResult<{ items: DynamoItem[], lastEvaluatedKey?: Record<string, any> }>>
      dynamoDbQueryItems: (tableName: string, options: DynamoQueryOptions) => Promise<IpcResult<{ items: DynamoItem[], lastEvaluatedKey?: Record<string, any> }>>
      dynamoDbPutItem: (tableName: string, item: Record<string, any>) => Promise<IpcResult>
      dynamoDbDeleteItem: (tableName: string, key: Record<string, any>) => Promise<IpcResult>
      dynamoDbListStreams: (tableName?: string) => Promise<IpcResult<DynamoStream[]>>
      dynamoDbDescribeStream: (streamArn: string) => Promise<IpcResult<{
        streamArn: string; tableName?: string; streamStatus?: string;
        streamViewType?: string; creationDateTime?: string; shards: DynamoStreamShard[]
      }>>
      dynamoDbGetShardIterator: (
        streamArn: string,
        shardId: string,
        iteratorType: 'TRIM_HORIZON' | 'LATEST' | 'AT_SEQUENCE_NUMBER' | 'AFTER_SEQUENCE_NUMBER',
        sequenceNumber?: string
      ) => Promise<IpcResult<string>>
      dynamoDbGetRecords: (shardIterator: string, limit?: number) => Promise<IpcResult<{ records: DynamoStreamRecord[]; nextShardIterator?: string }>>
      dynamoDbUpdateTableStream: (tableName: string, enabled: boolean, viewType?: 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY') => Promise<IpcResult>

      // CloudFormation
      cfnReinit: (endpoint: string, region: string) => Promise<IpcResult>
      cfnListStacks: (statusFilter?: string[]) => Promise<IpcResult<any[]>>
      cfnDescribeStack: (stackName: string) => Promise<IpcResult<any>>
      cfnDescribeStackResources: (stackName: string) => Promise<IpcResult<any[]>>
      cfnDescribeStackEvents: (stackName: string) => Promise<IpcResult<any[]>>
      cfnGetTemplate: (stackName: string) => Promise<IpcResult<string>>
      cfnCreateStack: (stackName: string, templateBody: string, parameters?: any[], capabilities?: string[]) => Promise<IpcResult<string>>
      cfnUpdateStack: (stackName: string, templateBody: string, parameters?: any[], capabilities?: string[]) => Promise<IpcResult<string>>
      cfnDeleteStack: (stackName: string) => Promise<IpcResult>
      cfnValidateTemplate: (templateBody: string) => Promise<IpcResult<any>>
      cfnListExports: () => Promise<IpcResult<any[]>>
      // SSM Parameter Store
      ssmReinit: (endpoint: string, region: string) => Promise<IpcResult>
      ssmListParameters: (path?: string, recursive?: boolean) => Promise<IpcResult<any[]>>
      ssmGetParameter: (name: string, withDecryption?: boolean) => Promise<IpcResult<any>>
      ssmPutParameter: (name: string, value: string, type: string, description?: string, kmsKeyId?: string, overwrite?: boolean) => Promise<IpcResult<number>>
      ssmDeleteParameter: (name: string) => Promise<IpcResult>
      ssmDeleteParameters: (names: string[]) => Promise<IpcResult<string[]>>
      ssmGetParameterHistory: (name: string) => Promise<IpcResult<any[]>>
      // Simple Notification Service (SNS)
      snsReinit: (endpoint: string, region: string) => Promise<IpcResult>
      snsListTopics: () => Promise<IpcResult<SnsTopic[]>>
      snsCreateTopic: (name: string) => Promise<IpcResult<string>>
      snsDeleteTopic: (topicArn: string) => Promise<IpcResult>
      snsListSubscriptionsByTopic: (topicArn: string) => Promise<IpcResult<SnsSubscription[]>>
      snsSubscribe: (topicArn: string, protocol: string, endpoint: string) => Promise<IpcResult<string>>
      snsUnsubscribe: (subscriptionArn: string) => Promise<IpcResult>
      snsPublish: (topicArn: string, message: string, subject?: string) => Promise<IpcResult<string>>

      // --- EventBridge ---
      ebReinit: (endpoint: string, region: string) => Promise<IpcResult>
      ebListBuses: () => Promise<IpcResult<EbBus[]>>
      ebCreateBus: (name: string) => Promise<IpcResult<string>>
      ebDeleteBus: (name: string) => Promise<IpcResult>
      ebListRules: (busName: string) => Promise<IpcResult<EbRule[]>>
      ebPutRule: (busName: string, name: string, pattern?: string, schedule?: string, desc?: string, state?: 'ENABLED' | 'DISABLED') => Promise<IpcResult<string>>
      ebDeleteRule: (busName: string, name: string) => Promise<IpcResult>
      ebEnableRule: (busName: string, name: string) => Promise<IpcResult>
      ebDisableRule: (busName: string, name: string) => Promise<IpcResult>
      ebListTargetsByRule: (busName: string, ruleName: string) => Promise<IpcResult<EbTarget[]>>
      ebPutTargets: (busName: string, ruleName: string, targets: { id: string, arn: string, input?: string }[]) => Promise<IpcResult<number>>
      ebRemoveTargets: (busName: string, ruleName: string, targetIds: string[]) => Promise<IpcResult<number>>
      ebPutEvents: (busName: string, entries: EbEventEntry[]) => Promise<IpcResult<number>>

      // --- EventBridge Scheduler ---
      schedulerReinit: (endpoint: string, region: string) => Promise<IpcResult>
      schedulerListGroups: () => Promise<IpcResult<EbScheduleGroup[]>>
      schedulerCreateGroup: (name: string) => Promise<IpcResult<string>>
      schedulerDeleteGroup: (name: string) => Promise<IpcResult>
      schedulerListSchedules: (groupName?: string) => Promise<IpcResult<EbSchedule[]>>
      schedulerGetSchedule: (name: string, groupName?: string) => Promise<IpcResult<EbSchedule>>
      schedulerCreateSchedule: (params: {
        name: string
        groupName?: string
        scheduleExpression: string
        scheduleExpressionTimezone?: string
        description?: string
        state?: 'ENABLED' | 'DISABLED'
        targetArn: string
        targetRoleArn: string
        targetInput?: string
      }) => Promise<IpcResult<string>>
      schedulerUpdateSchedule: (params: {
        name: string
        groupName?: string
        scheduleExpression: string
        scheduleExpressionTimezone?: string
        description?: string
        state?: 'ENABLED' | 'DISABLED'
        targetArn: string
        targetRoleArn: string
        targetInput?: string
      }) => Promise<IpcResult<string>>
      schedulerDeleteSchedule: (name: string, groupName?: string) => Promise<IpcResult>

      // --- SES (Simple Email Service) ---
      sesReinit: (endpoint: string, region: string) => Promise<IpcResult>
      sesListIdentities: () => Promise<IpcResult<SesIdentity[]>>
      sesVerifyEmail: (email: string) => Promise<IpcResult>
      sesVerifyDomain: (domain: string) => Promise<IpcResult<string>>
      sesDeleteIdentity: (identity: string) => Promise<IpcResult>
      sesSendEmail: (params: {
        source: string
        toAddresses: string[]
        ccAddresses?: string[]
        bccAddresses?: string[]
        subject: string
        bodyText?: string
        bodyHtml?: string
      }) => Promise<IpcResult<string>>

      // --- KMS (Key Management Service) ---
      kmsReinit: (endpoint: string, region: string) => Promise<IpcResult>
      kmsListKeysWithAliases: () => Promise<IpcResult<KmsKey[]>>
      kmsCreateKey: (description?: string) => Promise<IpcResult<string>>
      kmsScheduleKeyDeletion: (keyId: string, pendingWindowInDays?: number) => Promise<IpcResult>
      kmsCancelKeyDeletion: (keyId: string) => Promise<IpcResult>
      kmsEnableKey: (keyId: string) => Promise<IpcResult>
      kmsDisableKey: (keyId: string) => Promise<IpcResult>
      kmsCreateAlias: (aliasName: string, targetKeyId: string) => Promise<IpcResult>
      kmsEncryptData: (keyId: string, plaintext: string) => Promise<IpcResult<string>>
      kmsDecryptData: (ciphertextBase64: string) => Promise<IpcResult<string>>

      // --- IAM (Identity & Access Management) ---
      iamReinit: (endpoint: string, region: string) => Promise<IpcResult>
      iamListUsers: () => Promise<IpcResult<IamUser[]>>
      iamCreateUser: (userName: string) => Promise<IpcResult<string>>
      iamDeleteUser: (userName: string) => Promise<IpcResult>
      iamListRoles: () => Promise<IpcResult<IamRole[]>>
      iamCreateRole: (roleName: string, assumeRolePolicyDocument: string) => Promise<IpcResult<string>>
      iamDeleteRole: (roleName: string) => Promise<IpcResult>
      iamListGroups: () => Promise<IpcResult<IamGroup[]>>
      iamCreateGroup: (groupName: string) => Promise<IpcResult<string>>
      iamDeleteGroup: (groupName: string) => Promise<IpcResult>
      iamGetGroupUsers: (groupName: string) => Promise<IpcResult<IamUser[]>>
      iamListGroupsForUser: (userName: string) => Promise<IpcResult<IamGroup[]>>
      iamAddUserToGroup: (groupName: string, userName: string) => Promise<IpcResult>
      iamRemoveUserFromGroup: (groupName: string, userName: string) => Promise<IpcResult>
      iamCreatePolicy: (policyName: string, policyDocument: string, description?: string) => Promise<IpcResult<string>>
      iamListPolicies: (scope?: 'Local' | 'AWS' | 'All') => Promise<IpcResult<IamPolicy[]>>

      // --- STS (Security Token Service) ---
      stsReinit: (endpoint: string, region: string) => Promise<void>
      stsGetCallerIdentity: () => Promise<IpcResult<StsCallerIdentity>>
      stsAssumeRole: (roleArn: string, sessionName: string, durationSeconds?: number, policy?: string) => Promise<IpcResult<StsAssumedRoleResult>>
      stsGetSessionToken: (durationSeconds?: number, serialNumber?: string, tokenCode?: string) => Promise<IpcResult<StsCredentials>>
      stsGetFederationToken: (name: string, durationSeconds?: number, policy?: string) => Promise<IpcResult<StsFederatedUserResult>>
      stsAssumeRoleWithWebIdentity: (roleArn: string, roleSessionName: string, webIdentityToken: string, durationSeconds?: number) => Promise<IpcResult<StsAssumedRoleResult>>

      // API Gateway
      apigwReinit: (endpoint: string, region: string) => Promise<IpcResult>
      apigwListRestApis: () => Promise<IpcResult<ApigwRestApi[]>>
      apigwCreateRestApi: (name: string, description?: string) => Promise<IpcResult<string>>
      apigwDeleteRestApi: (restApiId: string) => Promise<IpcResult>
      apigwGetResources: (restApiId: string) => Promise<IpcResult<ApigwResource[]>>
      apigwCreateResource: (restApiId: string, parentId: string, pathPart: string) => Promise<IpcResult<string>>
      apigwDeleteResource: (restApiId: string, resourceId: string) => Promise<IpcResult>
      apigwPutMethod: (restApiId: string, resourceId: string, httpMethod: string) => Promise<IpcResult>
      apigwDeleteMethod: (restApiId: string, resourceId: string, httpMethod: string) => Promise<IpcResult>
      apigwPutIntegration: (restApiId: string, resourceId: string, httpMethod: string, type: string, integrationHttpMethod: string, uri?: string) => Promise<IpcResult>
      apigwCreateDeployment: (restApiId: string, stageName: string, description?: string) => Promise<IpcResult<string>>
      apigwGetStages: (restApiId: string) => Promise<IpcResult<ApigwStage[]>>

      // Firehose
      firehoseReinit: (endpoint: string, region: string) => Promise<IpcResult>
      firehoseListDeliveryStreams: () => Promise<IpcResult<string[]>>
      firehoseDescribeDeliveryStream: (name: string) => Promise<IpcResult<FirehoseDeliveryStream>>
      firehoseCreateDeliveryStream: (name: string, bucketArn: string, roleArn: string) => Promise<IpcResult<string>>
      firehoseDeleteDeliveryStream: (name: string) => Promise<IpcResult>
      firehosePutRecord: (name: string, data: string) => Promise<IpcResult<string>>

      // Lambda
      lambdaReinit: (endpoint: string, region: string) => Promise<IpcResult>
      lambdaListFunctions: () => Promise<IpcResult<LambdaFunction[]>>
      lambdaGetFunction: (name: string) => Promise<IpcResult<any>>
      lambdaGetFunctionCode: (name: string) => Promise<any>
      lambdaUpdateFunctionCode: (name: string, updatedFiles: { path: string, content: string }[]) => Promise<any>
      lambdaCreateFunction: (name: string, roleArn: string, zipFilePath: string | null, handler?: string, runtime?: string, description?: string, timeout?: number, memorySize?: number, s3Config?: { bucket: string, key: string }, envVars?: Record<string, string>, inlineCode?: string | null) => Promise<IpcResult<any>>
      lambdaDeleteFunction: (name: string) => Promise<IpcResult>
      lambdaInvokeFunction: (name: string, payload: string) => Promise<IpcResult<any>>

      // CloudWatch
      cloudwatchReinit: (endpoint: string, region: string) => Promise<void>
      cloudwatchListLogGroups: () => Promise<IpcResult<CloudWatchLogGroup[]>>
      cloudwatchCreateLogGroup: (name: string) => Promise<IpcResult>
      cloudwatchDeleteLogGroup: (name: string) => Promise<IpcResult>
      cloudwatchListLogStreams: (groupName: string) => Promise<IpcResult<CloudWatchLogStream[]>>
      cloudwatchGetLogEvents: (groupName: string, streamName: string, options?: { limit?: number, nextToken?: string }) => Promise<IpcResult<{ events: CloudWatchLogEvent[], nextForwardToken?: string, nextBackwardToken?: string }>>
      cloudwatchFilterLogEvents: (groupName: string, options?: { filterPattern?: string, limit?: number, nextToken?: string }) => Promise<IpcResult<{ events: CloudWatchLogEvent[], nextToken?: string }>>
      cloudwatchListMetrics: () => Promise<IpcResult<CloudWatchMetric[]>>
      cloudwatchGetMetricData: (params: any) => Promise<IpcResult<any[]>>
      cloudwatchPutMetricData: (namespace: string, metricName: string, value: number) => Promise<IpcResult>
      cloudwatchListAlarms: () => Promise<IpcResult<{ metricAlarms: CloudWatchAlarm[], compositeAlarms: any[] }>>
      cloudwatchPutMetricAlarm: (params: any) => Promise<IpcResult>
      cloudwatchDeleteAlarms: (names: string[]) => Promise<IpcResult>
      cloudwatchSetAlarmState: (name: string, state: string, reason: string) => Promise<IpcResult>

      // Redshift
      redshiftReinit: (endpoint: string, region: string) => Promise<void>
      redshiftListClusters: () => Promise<IpcResult<RedshiftCluster[]>>
      redshiftDescribeCluster: (clusterId: string) => Promise<IpcResult<RedshiftCluster>>
      redshiftCreateCluster: (params: any) => Promise<IpcResult<RedshiftCluster>>
      redshiftDeleteCluster: (clusterId: string) => Promise<IpcResult<RedshiftCluster>>

      // Kinesis
      kinesisReinit: (endpoint: string, region: string) => Promise<void>
      kinesisListStreams: (endpoint: string, region: string) => Promise<IpcResult<string[]>>
      kinesisDescribeStream: (endpoint: string, region: string, streamName: string) => Promise<IpcResult<KinesisStream>>
      kinesisCreateStream: (endpoint: string, region: string, params: any) => Promise<IpcResult>
      kinesisDeleteStream: (endpoint: string, region: string, streamName: string) => Promise<IpcResult>

      // OpenSearch
      opensearchReinit: (endpoint: string, region: string) => Promise<void>
      opensearchListDomains: (endpoint: string, region: string) => Promise<IpcResult<string[]>>
      opensearchDescribeDomain: (endpoint: string, region: string, domainName: string) => Promise<IpcResult<OpenSearchDomain>>
      opensearchCreateDomain: (endpoint: string, region: string, params: { domainName: string; engineVersion?: string; instanceType?: string; instanceCount?: number }) => Promise<IpcResult>
      opensearchDeleteDomain: (endpoint: string, region: string, domainName: string) => Promise<IpcResult>
      opensearchGetClusterHealth: (domainEndpoint: string) => Promise<IpcResult<OpenSearchClusterHealth>>
      opensearchListIndices: (domainEndpoint: string) => Promise<IpcResult<OpenSearchIndex[]>>
      opensearchCreateIndex: (domainEndpoint: string, indexName: string, settings?: object) => Promise<IpcResult>
      opensearchDeleteIndex: (domainEndpoint: string, indexName: string) => Promise<IpcResult>
      opensearchGetMapping: (domainEndpoint: string, indexName: string) => Promise<IpcResult<any>>
      opensearchSearchDocuments: (domainEndpoint: string, indexName: string, query: object, size?: number) => Promise<IpcResult<any>>
      opensearchIndexDocument: (domainEndpoint: string, indexName: string, document: object, docId?: string) => Promise<IpcResult<any>>
      opensearchDeleteDocument: (domainEndpoint: string, indexName: string, docId: string) => Promise<IpcResult>

      // EC2
      ec2Reinit: (endpoint: string, region: string) => Promise<void>
      ec2ListInstances: () => Promise<IpcResult<Ec2Instance[]>>
      ec2LaunchInstance: (params: { imageId: string; instanceType: string; keyName?: string; securityGroupIds?: string[]; subnetId?: string; minCount?: number; maxCount?: number; userData?: string; tagName?: string }) => Promise<IpcResult<string>>
      ec2StartInstances: (instanceIds: string[]) => Promise<IpcResult>
      ec2StopInstances: (instanceIds: string[]) => Promise<IpcResult>
      ec2RebootInstances: (instanceIds: string[]) => Promise<IpcResult>
      ec2TerminateInstances: (instanceIds: string[]) => Promise<IpcResult>
      ec2ListImages: (owners?: string[]) => Promise<IpcResult<Ec2Image[]>>
      ec2ListKeyPairs: () => Promise<IpcResult<Ec2KeyPair[]>>
      ec2CreateKeyPair: (keyName: string) => Promise<IpcResult<{ keyPairId?: string; keyName?: string; keyMaterial?: string }>>
      ec2DeleteKeyPair: (keyName: string) => Promise<IpcResult>
      ec2ListSecurityGroups: () => Promise<IpcResult<Ec2SecurityGroup[]>>
      ec2CreateSecurityGroup: (params: { groupName: string; description: string; vpcId?: string }) => Promise<IpcResult<string>>
      ec2DeleteSecurityGroup: (groupId: string) => Promise<IpcResult>
      ec2AuthorizeSecurityGroupIngress: (params: { groupId: string; protocol: string; fromPort: number; toPort: number; cidrIp: string }) => Promise<IpcResult>
      ec2RevokeSecurityGroupIngress: (params: { groupId: string; protocol: string; fromPort: number; toPort: number; cidrIp: string }) => Promise<IpcResult>
      ec2ListVpcs: () => Promise<IpcResult<Ec2Vpc[]>>
      ec2CreateVpc: (cidrBlock: string) => Promise<IpcResult<string>>
      ec2DeleteVpc: (vpcId: string) => Promise<IpcResult>
      ec2ListSubnets: (vpcId?: string) => Promise<IpcResult<Ec2Subnet[]>>
      ec2ListVolumes: () => Promise<IpcResult<Ec2Volume[]>>
      ec2CreateVolume: (params: { availabilityZone: string; size: number; volumeType?: string }) => Promise<IpcResult<string>>
      ec2DeleteVolume: (volumeId: string) => Promise<IpcResult>
      ec2AttachVolume: (params: { volumeId: string; instanceId: string; device: string }) => Promise<IpcResult>
      ec2DetachVolume: (volumeId: string) => Promise<IpcResult>

      // Transcribe
      transcribeReinit: (endpoint: string, region: string) => Promise<void>
      transcribeListJobs: (statusFilter?: string) => Promise<IpcResult<TranscribeJob[]>>
      transcribeGetJob: (jobName: string) => Promise<IpcResult<TranscribeJob>>
      transcribeStartJob: (params: { jobName: string; languageCode: string; mediaUri: string; mediaFormat?: string; outputBucketName?: string }) => Promise<IpcResult<TranscribeJob>>
      transcribeDeleteJob: (jobName: string) => Promise<IpcResult>

      // Route 53
      route53Reinit: (endpoint: string, region: string) => Promise<void>
      route53ListHostedZones: () => Promise<IpcResult<Route53HostedZone[]>>
      route53GetHostedZone: (zoneId: string) => Promise<IpcResult<Route53HostedZone>>
      route53CreateHostedZone: (params: { name: string; comment?: string; privateZone?: boolean }) => Promise<IpcResult<Route53HostedZone>>
      route53DeleteHostedZone: (zoneId: string) => Promise<IpcResult>
      route53ListRecordSets: (zoneId: string) => Promise<IpcResult<Route53RecordSet[]>>
      route53CreateRecord: (zoneId: string, record: Route53RecordSet) => Promise<IpcResult>
      route53UpsertRecord: (zoneId: string, record: Route53RecordSet) => Promise<IpcResult>
      route53DeleteRecord: (zoneId: string, record: Route53RecordSet) => Promise<IpcResult>
      route53ListHealthChecks: () => Promise<IpcResult<Route53HealthCheck[]>>
      route53GetHealthCheck: (checkId: string) => Promise<IpcResult<Route53HealthCheck>>
      route53CreateHealthCheck: (params: Route53HealthCheckParams) => Promise<IpcResult<Route53HealthCheck>>
      route53DeleteHealthCheck: (checkId: string) => Promise<IpcResult>

      // ACM (Certificate Manager)
      acmReinit: (endpoint: string, region: string) => Promise<void>
      acmListCertificates: () => Promise<IpcResult<AcmCertificate[]>>
      acmDescribeCertificate: (arn: string) => Promise<IpcResult<AcmCertificate>>
      acmRequestCertificate: (params: { domainName: string; subjectAlternativeNames?: string[]; validationMethod?: 'DNS' | 'EMAIL'; tags?: AcmTag[] }) => Promise<IpcResult<string>>
      acmImportCertificate: (params: { certificate: string; privateKey: string; certificateChain?: string; existingArn?: string }) => Promise<IpcResult<string>>
      acmGetCertificatePem: (arn: string) => Promise<IpcResult<{ certificate: string; certificateChain?: string }>>
      acmDeleteCertificate: (arn: string) => Promise<IpcResult>
      acmListTagsForCertificate: (arn: string) => Promise<IpcResult<AcmTag[]>>
      acmAddTagsToCertificate: (arn: string, tags: AcmTag[]) => Promise<IpcResult>
      acmRenewCertificate: (arn: string) => Promise<IpcResult>

      // SWF (Simple Workflow Service)
      swfReinit: (endpoint: string, region: string) => Promise<void>
      swfListDomains: (registrationStatus?: 'REGISTERED' | 'DEPRECATED') => Promise<IpcResult<SwfDomain[]>>
      swfRegisterDomain: (name: string, description: string, retentionDays: string) => Promise<IpcResult>
      swfDescribeDomain: (name: string) => Promise<IpcResult<SwfDomain>>
      swfDeprecateDomain: (name: string) => Promise<IpcResult>
      swfListWorkflowTypes: (domain: string, registrationStatus?: 'REGISTERED' | 'DEPRECATED') => Promise<IpcResult<SwfWorkflowType[]>>
      swfRegisterWorkflowType: (domain: string, name: string, version: string, description?: string, defaultTaskList?: string, defaultExecutionStartToCloseTimeout?: string, defaultTaskStartToCloseTimeout?: string) => Promise<IpcResult>
      swfDeprecateWorkflowType: (domain: string, name: string, version: string) => Promise<IpcResult>
      swfListActivityTypes: (domain: string, registrationStatus?: 'REGISTERED' | 'DEPRECATED') => Promise<IpcResult<SwfActivityType[]>>
      swfRegisterActivityType: (domain: string, name: string, version: string, description?: string, defaultTaskList?: string, defaultScheduleToCloseTimeout?: string, defaultScheduleToStartTimeout?: string, defaultStartToCloseTimeout?: string, defaultHeartbeatTimeout?: string) => Promise<IpcResult>
      swfDeprecateActivityType: (domain: string, name: string, version: string) => Promise<IpcResult>
      swfListOpenExecutions: (domain: string) => Promise<IpcResult<SwfExecution[]>>
      swfListClosedExecutions: (domain: string) => Promise<IpcResult<SwfExecution[]>>
      swfDescribeExecution: (domain: string, workflowId: string, runId: string) => Promise<IpcResult<SwfExecutionDetail>>
      swfStartExecution: (domain: string, workflowId: string, workflowName: string, workflowVersion: string, input?: string, tagList?: string[], executionStartToCloseTimeout?: string, taskStartToCloseTimeout?: string) => Promise<IpcResult<string>>
      swfTerminateExecution: (domain: string, workflowId: string, runId: string, reason?: string) => Promise<IpcResult>
      swfSignalExecution: (domain: string, workflowId: string, runId: string, signalName: string, input?: string) => Promise<IpcResult>
      swfGetExecutionHistory: (domain: string, workflowId: string, runId: string) => Promise<IpcResult<SwfHistoryEvent[]>>
      swfRequestCancelExecution: (domain: string, workflowId: string, runId: string) => Promise<IpcResult>
      // SFN (Step Functions)
      sfnReinit: (endpoint: string, region: string) => Promise<void>
      sfnListStateMachines: () => Promise<IpcResult<SfnStateMachine[]>>
      sfnCreateStateMachine: (name: string, definition: string, roleArn: string, type: 'STANDARD' | 'EXPRESS', tags?: Record<string, string>) => Promise<IpcResult<string>>
      sfnDescribeStateMachine: (stateMachineArn: string) => Promise<IpcResult<SfnStateMachineDetail>>
      sfnUpdateStateMachine: (stateMachineArn: string, definition?: string, roleArn?: string) => Promise<IpcResult>
      sfnDeleteStateMachine: (stateMachineArn: string) => Promise<IpcResult>
      sfnStartExecution: (stateMachineArn: string, name?: string, input?: string) => Promise<IpcResult<string>>
      sfnListExecutions: (stateMachineArn: string, statusFilter?: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED') => Promise<IpcResult<SfnExecution[]>>
      sfnDescribeExecution: (executionArn: string) => Promise<IpcResult<SfnExecutionDetail>>
      sfnStopExecution: (executionArn: string, error?: string, cause?: string) => Promise<IpcResult>
      sfnGetExecutionHistory: (executionArn: string) => Promise<IpcResult<SfnHistoryEvent[]>>
      sfnListTagsForResource: (resourceArn: string) => Promise<IpcResult<Record<string, string>>>
      sfnTagResource: (resourceArn: string, tags: Record<string, string>) => Promise<IpcResult>
      sfnUntagResource: (resourceArn: string, tagKeys: string[]) => Promise<IpcResult>
      // Support
      supportReinit: (endpoint: string, region: string) => Promise<void>
      supportDescribeCases: (includeResolvedCases?: boolean) => Promise<IpcResult<SupportCase[]>>
      supportCreateCase: (subject: string, communicationBody: string, serviceCode?: string, severityCode?: string, categoryCode?: string, language?: string) => Promise<IpcResult<string>>
      supportResolveCase: (caseId: string) => Promise<IpcResult<string>>
      supportDescribeTrustedAdvisorChecks: (language?: string) => Promise<IpcResult<TrustedAdvisorCheck[]>>
      supportRefreshTrustedAdvisorCheck: (checkId: string) => Promise<IpcResult<string>>

      // Resource Groups
      rgReinit: (endpoint: string, region: string) => Promise<void>
      rgListGroups: () => Promise<IpcResult<RgGroup[]>>
      rgCreateGroup: (name: string, description: string, queryType: string, queryJson: string) => Promise<IpcResult<RgGroup>>
      rgDeleteGroup: (groupName: string) => Promise<IpcResult>
      rgGetGroup: (groupName: string) => Promise<IpcResult<{
        group: RgGroup; query?: { type: string; query: string }; tags?: Record<string, string>; configuration?: any[]
      }>>
      rgUpdateGroup: (groupName: string, description: string) => Promise<IpcResult>
      rgUpdateGroupQuery: (groupName: string, queryType: string, queryJson: string) => Promise<IpcResult>
      rgPutGroupConfiguration: (groupName: string, configuration: any[]) => Promise<IpcResult>
      rgListTagSyncTasks: (groupName?: string) => Promise<IpcResult<RgTagSyncTask[]>>
      rgGetTagSyncTask: (taskArn: string) => Promise<IpcResult<RgTagSyncTask>>
      rgStartTagSyncTask: (groupArn: string, tagKey: string, tagValue: string, roleArn: string) => Promise<IpcResult<string>>
      rgCancelTagSyncTask: (taskArn: string) => Promise<IpcResult>
      rgGetTagKeys: () => Promise<IpcResult<string[]>>
      rgGetTagValues: (key: string) => Promise<IpcResult<string[]>>
      rgGetResources: (tagFilters?: { key: string; values: string[] }[], resourceTypes?: string[]) => Promise<IpcResult<RgTaggedResource[]>>
      rgTagResources: (resourceArns: string[], tags: Record<string, string>) => Promise<IpcResult>
      rgUntagResources: (resourceArns: string[], tagKeys: string[]) => Promise<IpcResult>

      // AWS Config
      configReinit: (endpoint: string, region: string) => Promise<void>
      configDescribeRecorders: () => Promise<IpcResult<ConfigRecorder[]>>
      configPutRecorder: (name: string, roleARN: string, allSupported: boolean, includeGlobal: boolean, resourceTypes: string[]) => Promise<IpcResult>
      configStartRecorder: (name: string) => Promise<IpcResult>
      configStopRecorder: (name: string) => Promise<IpcResult>
      configDeleteRecorder: (name: string) => Promise<IpcResult>
      configDescribeChannels: () => Promise<IpcResult<ConfigDeliveryChannel[]>>
      configPutChannel: (name: string, s3Bucket: string, s3Prefix?: string, snsTopic?: string, frequency?: string) => Promise<IpcResult>
      configDeleteChannel: (name: string) => Promise<IpcResult>
      configDescribeRules: () => Promise<IpcResult<ConfigRule[]>>
      configPutRule: (name: string, sourceOwner: string, sourceIdentifier: string, description?: string, tagKey?: string, tagValue?: string, resourceTypes?: string[]) => Promise<IpcResult>
      configDeleteRule: (name: string) => Promise<IpcResult>
      configGetComplianceByRule: () => Promise<IpcResult<ConfigComplianceResult[]>>
      configGetComplianceDetailsByRule: (ruleName: string) => Promise<IpcResult<ConfigComplianceResult[]>>
      configListDiscoveredResources: (resourceType: string) => Promise<IpcResult<ConfigDiscoveredResource[]>>
      configGetResourceConfigHistory: (resourceType: string, resourceId: string) => Promise<IpcResult<ConfigResourceHistory[]>>
      configListTags: (resourceArn: string) => Promise<IpcResult<Record<string, string>>>
      configTagResource: (resourceArn: string, tags: Record<string, string>) => Promise<IpcResult>
      configUntagResource: (resourceArn: string, tagKeys: string[]) => Promise<IpcResult>

      // Route 53 Resolver
      r53rReinit: (endpoint: string, region: string) => Promise<void>
      r53rListEndpoints: () => Promise<IpcResult<R53ResolverEndpoint[]>>
      r53rCreateEndpoint: (name: string, direction: string, sgIds: string[], ips: { SubnetId: string; Ip?: string }[]) => Promise<IpcResult<string>>
      r53rGetEndpoint: (id: string) => Promise<IpcResult<R53ResolverEndpoint>>
      r53rUpdateEndpoint: (id: string, name: string) => Promise<IpcResult>
      r53rDeleteEndpoint: (id: string) => Promise<IpcResult>
      r53rListEndpointIps: (id: string) => Promise<IpcResult<{ ip?: string; subnetId?: string; status?: string; ipId?: string }[]>>
      r53rAssociateEndpointIp: (endpointId: string, subnetId: string, ip?: string) => Promise<IpcResult>
      r53rDisassociateEndpointIp: (endpointId: string, ipId: string) => Promise<IpcResult>
      r53rListRules: () => Promise<IpcResult<R53ResolverRule[]>>
      r53rCreateRule: (name: string, domainName: string, ruleType: string, endpointId?: string, targetIps?: { Ip: string; Port?: number }[]) => Promise<IpcResult<string>>
      r53rUpdateRule: (id: string, name: string, targetIps?: { Ip: string; Port?: number }[]) => Promise<IpcResult>
      r53rDeleteRule: (id: string) => Promise<IpcResult>
      r53rAssociateRule: (ruleId: string, vpcId: string, name?: string) => Promise<IpcResult>
      r53rDisassociateRule: (associationId: string) => Promise<IpcResult>
      r53rListRuleAssociations: () => Promise<IpcResult<R53RuleAssociation[]>>
      r53rListFwRuleGroups: () => Promise<IpcResult<R53FirewallRuleGroup[]>>
      r53rCreateFwRuleGroup: (name: string) => Promise<IpcResult<string>>
      r53rDeleteFwRuleGroup: (id: string) => Promise<IpcResult>
      r53rListFwRules: (groupId: string) => Promise<IpcResult<R53FirewallRule[]>>
      r53rCreateFwRule: (groupId: string, domainListId: string, name: string, priority: number, action: string, blockResponse?: string, blockOverrideDomain?: string) => Promise<IpcResult>
      r53rDeleteFwRule: (groupId: string, domainListId: string) => Promise<IpcResult>
      r53rAssociateFwRuleGroup: (groupId: string, vpcId: string, priority: number, name: string) => Promise<IpcResult>
      r53rDisassociateFwRuleGroup: (associationId: string) => Promise<IpcResult>
      r53rListFwRuleGroupAssociations: () => Promise<IpcResult<R53FirewallRuleGroupAssociation[]>>
      r53rListFwDomainLists: () => Promise<IpcResult<R53FirewallDomainList[]>>
      r53rCreateFwDomainList: (name: string) => Promise<IpcResult<string>>
      r53rDeleteFwDomainList: (id: string) => Promise<IpcResult>
      r53rListFwDomains: (domainListId: string) => Promise<IpcResult<string[]>>
      r53rUpdateFwDomains: (domainListId: string, operation: string, domains: string[]) => Promise<IpcResult>
      r53rListTags: (resourceArn: string) => Promise<IpcResult<Record<string, string>>>
      r53rTagResource: (resourceArn: string, tags: Record<string, string>) => Promise<IpcResult>
      r53rUntagResource: (resourceArn: string, tagKeys: string[]) => Promise<IpcResult>
      // S3 Control
      s3controlReinit: (endpoint: string, region: string) => Promise<void>
      s3controlListAccessPoints: (bucket?: string) => Promise<IpcResult<S3ControlAccessPoint[]>>
      s3controlCreateAccessPoint: (name: string, bucket: string, vpcId?: string) => Promise<IpcResult<string>>
      s3controlDeleteAccessPoint: (name: string) => Promise<IpcResult>
      s3controlGetAccessPointPolicy: (name: string) => Promise<IpcResult<string | null>>
      s3controlPutAccessPointPolicy: (name: string, policy: string) => Promise<IpcResult>
      s3controlDeleteAccessPointPolicy: (name: string) => Promise<IpcResult>
      s3controlListMRAPs: () => Promise<IpcResult<S3ControlMRAP[]>>
      s3controlCreateMRAP: (name: string, regions: Array<{ bucket: string }>, blockPublicAcls: boolean, ignorePublicAcls: boolean, blockPublicPolicy: boolean, restrictPublicBuckets: boolean) => Promise<IpcResult<string>>
      s3controlDeleteMRAP: (name: string) => Promise<IpcResult>
      s3controlGetMRAPPolicy: (name: string) => Promise<IpcResult<string | null>>
      s3controlPutMRAPPolicy: (name: string, policy: string) => Promise<IpcResult>
      s3controlGetPublicAccessBlock: () => Promise<IpcResult<S3ControlPublicAccessBlock | null>>
      s3controlPutPublicAccessBlock: (config: S3ControlPublicAccessBlock) => Promise<IpcResult>
      s3controlDeletePublicAccessBlock: () => Promise<IpcResult>
    }
  }
}
