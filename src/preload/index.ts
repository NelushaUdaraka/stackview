import { contextBridge, ipcRenderer } from 'electron'
import type {
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
} from '../shared/types'
import type { Theme } from '../shared/themes'

// Re-export so consumers of this module can still use these types
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
  S3ControlAccessPoint,
  S3ControlPublicAccessBlock,
  S3ControlMRAP,
}

const electronAPI = {
  // Platform info
  platform: process.platform,

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Theme
  getTheme: () => ipcRenderer.invoke('theme:get') as Promise<Theme>,
  setTheme: (theme: Theme) =>
    ipcRenderer.invoke('theme:set', theme),

  // Icon mode
  getIconMode: () => ipcRenderer.invoke('iconMode:get') as Promise<'lucide' | 'aws'>,
  setIconMode: (mode: 'lucide' | 'aws') => ipcRenderer.invoke('iconMode:set', mode),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get') as Promise<AppSettings>,
  saveSettings: (endpoint: string, region: string) =>
    ipcRenderer.invoke('settings:save', endpoint, region),

  // Auto-updater
  getAppVersion: () => ipcRenderer.invoke('updater:get-version') as Promise<string>,
  getAutoUpdate: () => ipcRenderer.invoke('updater:get-auto-update') as Promise<boolean>,
  setAutoUpdate: (value: boolean) => ipcRenderer.invoke('updater:set-auto-update', value) as Promise<void>,
  checkForUpdates: () => ipcRenderer.invoke('updater:check') as Promise<void>,
  installUpdate: () => ipcRenderer.invoke('updater:install') as Promise<void>,
  onUpdaterStatus: (cb: (status: UpdaterStatus) => void) => {
    const handler = (_: Electron.IpcRendererEvent, status: UpdaterStatus) => cb(status)
    ipcRenderer.on('updater:status', handler)
    return () => ipcRenderer.removeListener('updater:status', handler)
  },

  // Dialog helpers
  openFiles: () =>
    ipcRenderer.invoke('dialog:openFiles') as Promise<{ canceled: boolean; filePaths: string[] }>,
  saveFile: (defaultName: string) =>
    ipcRenderer.invoke('dialog:saveFile', defaultName) as Promise<{ canceled: boolean; filePath?: string }>,

  // SQS Connection
  connect: (endpoint: string, region: string) =>
    ipcRenderer.invoke('sqs:connect', endpoint, region) as Promise<IpcResult>,
  reinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('sqs:reinit', endpoint, region),

  // SQS Queues
  listQueues: () =>
    ipcRenderer.invoke('sqs:listQueues') as Promise<IpcResult<string[]>>,
  createQueue: (
    queueName: string,
    isFifo: boolean,
    attributes: Record<string, string>
  ) =>
    ipcRenderer.invoke(
      'sqs:createQueue',
      queueName,
      isFifo,
      attributes
    ) as Promise<IpcResult<string>>,
  deleteQueue: (queueUrl: string) =>
    ipcRenderer.invoke('sqs:deleteQueue', queueUrl) as Promise<IpcResult>,
  purgeQueue: (queueUrl: string) =>
    ipcRenderer.invoke('sqs:purgeQueue', queueUrl) as Promise<IpcResult>,
  getQueueAttributes: (queueUrl: string) =>
    ipcRenderer.invoke(
      'sqs:getQueueAttributes',
      queueUrl
    ) as Promise<IpcResult<Record<string, string>>>,
  setQueueAttributes: (queueUrl: string, attributes: Record<string, string>) =>
    ipcRenderer.invoke(
      'sqs:setQueueAttributes',
      queueUrl,
      attributes
    ) as Promise<IpcResult>,
  getQueueTags: (queueUrl: string) =>
    ipcRenderer.invoke(
      'sqs:getQueueTags',
      queueUrl
    ) as Promise<IpcResult<Record<string, string>>>,

  // SQS Messages
  sendMessage: (
    queueUrl: string,
    body: string,
    delaySeconds?: number,
    messageGroupId?: string,
    messageDeduplicationId?: string,
    messageAttributes?: Record<string, { DataType: string; StringValue: string }>
  ) =>
    ipcRenderer.invoke(
      'sqs:sendMessage',
      queueUrl,
      body,
      delaySeconds,
      messageGroupId,
      messageDeduplicationId,
      messageAttributes
    ) as Promise<IpcResult<string>>,
  receiveMessages: (
    queueUrl: string,
    maxMessages: number,
    visibilityTimeout: number,
    waitTimeSeconds: number
  ) =>
    ipcRenderer.invoke(
      'sqs:receiveMessages',
      queueUrl,
      maxMessages,
      visibilityTimeout,
      waitTimeSeconds
    ) as Promise<IpcResult<SQSMessage[]>>,
  deleteMessage: (queueUrl: string, receiptHandle: string) =>
    ipcRenderer.invoke(
      'sqs:deleteMessage',
      queueUrl,
      receiptHandle
    ) as Promise<IpcResult>,

  // S3 init
  s3Reinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('s3:reinit', endpoint, region),

  // S3 Buckets
  s3ListBuckets: () =>
    ipcRenderer.invoke('s3:listBuckets') as Promise<IpcResult<S3BucketInfo[]>>,
  s3CreateBucket: (name: string, region: string) =>
    ipcRenderer.invoke('s3:createBucket', name, region) as Promise<IpcResult>,
  s3DeleteBucket: (name: string) =>
    ipcRenderer.invoke('s3:deleteBucket', name) as Promise<IpcResult>,
  s3GetBucketLocation: (name: string) =>
    ipcRenderer.invoke('s3:getBucketLocation', name) as Promise<IpcResult<string>>,

  // S3 Objects
  s3ListObjects: (bucket: string, prefix: string, continuationToken?: string) =>
    ipcRenderer.invoke(
      's3:listObjects',
      bucket,
      prefix,
      continuationToken
    ) as Promise<IpcResult<S3ListResult>>,
  s3HeadObject: (bucket: string, key: string) =>
    ipcRenderer.invoke('s3:headObject', bucket, key) as Promise<IpcResult<S3ObjectMeta>>,
  s3DeleteObject: (bucket: string, key: string) =>
    ipcRenderer.invoke('s3:deleteObject', bucket, key) as Promise<IpcResult>,
  s3DeleteObjects: (bucket: string, keys: string[]) =>
    ipcRenderer.invoke('s3:deleteObjects', bucket, keys) as Promise<IpcResult<number>>,
  s3CopyObject: (srcBucket: string, srcKey: string, destBucket: string, destKey: string) =>
    ipcRenderer.invoke(
      's3:copyObject',
      srcBucket,
      srcKey,
      destBucket,
      destKey
    ) as Promise<IpcResult>,
  s3UploadObject: (bucket: string, key: string, filePath: string) =>
    ipcRenderer.invoke('s3:uploadObject', bucket, key, filePath) as Promise<IpcResult>,
  s3DownloadObject: (bucket: string, key: string, destPath: string) =>
    ipcRenderer.invoke('s3:downloadObject', bucket, key, destPath) as Promise<IpcResult>,
  s3GetPresignedUrl: (bucket: string, key: string, expiresIn: number) =>
    ipcRenderer.invoke(
      's3:getPresignedUrl',
      bucket,
      key,
      expiresIn
    ) as Promise<IpcResult<string>>,
  s3CreateFolder: (bucket: string, folderKey: string) =>
    ipcRenderer.invoke('s3:createFolder', bucket, folderKey) as Promise<IpcResult>,

  // Secrets Manager
  secretsManagerReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('secretsmanager:reinit', endpoint, region),
  secretsManagerListSecrets: () =>
    ipcRenderer.invoke('secretsmanager:listSecrets') as Promise<IpcResult<SecretInfo[]>>,
  secretsManagerCreateSecret: (name: string, description: string, secretString: string) =>
    ipcRenderer.invoke('secretsmanager:createSecret', name, description, secretString) as Promise<IpcResult>,
  secretsManagerGetSecretValue: (secretId: string) =>
    ipcRenderer.invoke('secretsmanager:getSecretValue', secretId) as Promise<IpcResult<SecretValue>>,
  secretsManagerPutSecretValue: (secretId: string, secretString: string) =>
    ipcRenderer.invoke('secretsmanager:putSecretValue', secretId, secretString) as Promise<IpcResult>,
  secretsManagerDeleteSecret: (secretId: string) =>
    ipcRenderer.invoke('secretsmanager:deleteSecret', secretId) as Promise<IpcResult>,

  // DynamoDB
  dynamoDbReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('dynamodb:reinit', endpoint, region),
  dynamoDbListTables: () =>
    ipcRenderer.invoke('dynamodb:listTables') as Promise<IpcResult<string[]>>,
  dynamoDbDescribeTable: (tableName: string) =>
    ipcRenderer.invoke('dynamodb:describeTable', tableName) as Promise<IpcResult<any>>,
  dynamoDbCreateTable: (
    tableName: string,
    attributeDefinitions: any[],
    keySchema: any[],
    gsiList?: any[],
    lsiList?: any[]
  ) =>
    ipcRenderer.invoke(
      'dynamodb:createTable',
      tableName,
      attributeDefinitions,
      keySchema,
      gsiList,
      lsiList
    ) as Promise<IpcResult>,
  dynamoDbDeleteTable: (tableName: string) =>
    ipcRenderer.invoke('dynamodb:deleteTable', tableName) as Promise<IpcResult>,
  dynamoDbScanItems: (tableName: string, limit?: number, exclusiveStartKey?: Record<string, any>) =>
    ipcRenderer.invoke('dynamodb:scanItems', tableName, limit, exclusiveStartKey) as Promise<IpcResult<{ items: DynamoItem[], lastEvaluatedKey?: Record<string, any> }>>,
  dynamoDbQueryItems: (tableName: string, options: DynamoQueryOptions) =>
    ipcRenderer.invoke('dynamodb:queryItems', tableName, options) as Promise<IpcResult<{ items: DynamoItem[], lastEvaluatedKey?: Record<string, any> }>>,
  dynamoDbPutItem: (tableName: string, item: Record<string, any>) =>
    ipcRenderer.invoke('dynamodb:putItem', tableName, item) as Promise<IpcResult>,
  dynamoDbDeleteItem: (tableName: string, key: Record<string, any>) =>
    ipcRenderer.invoke('dynamodb:deleteItem', tableName, key) as Promise<IpcResult>,
  dynamoDbListStreams: (tableName?: string) =>
    ipcRenderer.invoke('dynamodb:listStreams', tableName) as Promise<IpcResult<DynamoStream[]>>,
  dynamoDbDescribeStream: (streamArn: string) =>
    ipcRenderer.invoke('dynamodb:describeStream', streamArn) as Promise<IpcResult<{
      streamArn: string; tableName?: string; streamStatus?: string;
      streamViewType?: string; creationDateTime?: string; shards: DynamoStreamShard[]
    }>>,
  dynamoDbGetShardIterator: (
    streamArn: string,
    shardId: string,
    iteratorType: 'TRIM_HORIZON' | 'LATEST' | 'AT_SEQUENCE_NUMBER' | 'AFTER_SEQUENCE_NUMBER',
    sequenceNumber?: string
  ) =>
    ipcRenderer.invoke('dynamodb:getShardIterator', streamArn, shardId, iteratorType, sequenceNumber) as Promise<IpcResult<string>>,
  dynamoDbGetRecords: (shardIterator: string, limit?: number) =>
    ipcRenderer.invoke('dynamodb:getRecords', shardIterator, limit) as Promise<IpcResult<{ records: DynamoStreamRecord[]; nextShardIterator?: string }>>,
  dynamoDbUpdateTableStream: (tableName: string, enabled: boolean, viewType?: 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY') =>
    ipcRenderer.invoke('dynamodb:updateTableStream', tableName, enabled, viewType) as Promise<IpcResult>,

  // CloudFormation
  cfnReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('cfn:reinit', endpoint, region) as Promise<IpcResult>,
  cfnListStacks: (statusFilter?: string[]) =>
    ipcRenderer.invoke('cfn:listStacks', statusFilter) as Promise<IpcResult<any[]>>,
  cfnDescribeStack: (stackName: string) =>
    ipcRenderer.invoke('cfn:describeStack', stackName) as Promise<IpcResult<any>>,
  cfnDescribeStackResources: (stackName: string) =>
    ipcRenderer.invoke('cfn:describeStackResources', stackName) as Promise<IpcResult<any[]>>,
  cfnDescribeStackEvents: (stackName: string) =>
    ipcRenderer.invoke('cfn:describeStackEvents', stackName) as Promise<IpcResult<any[]>>,
  cfnGetTemplate: (stackName: string) =>
    ipcRenderer.invoke('cfn:getTemplate', stackName) as Promise<IpcResult<string>>,
  cfnCreateStack: (stackName: string, templateBody: string, parameters?: any[], capabilities?: string[]) =>
    ipcRenderer.invoke('cfn:createStack', stackName, templateBody, parameters, capabilities) as Promise<IpcResult<string>>,
  cfnUpdateStack: (stackName: string, templateBody: string, parameters?: any[], capabilities?: string[]) =>
    ipcRenderer.invoke('cfn:updateStack', stackName, templateBody, parameters, capabilities) as Promise<IpcResult<string>>,
  cfnDeleteStack: (stackName: string) =>
    ipcRenderer.invoke('cfn:deleteStack', stackName) as Promise<IpcResult>,
  cfnValidateTemplate: (templateBody: string) =>
    ipcRenderer.invoke('cfn:validateTemplate', templateBody) as Promise<IpcResult<any>>,
  cfnListExports: () =>
    ipcRenderer.invoke('cfn:listExports') as Promise<IpcResult<any[]>>,

  // SSM Parameter Store
  ssmReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('ssm:reinit', endpoint, region) as Promise<IpcResult>,
  ssmListParameters: (path?: string, recursive?: boolean) =>
    ipcRenderer.invoke('ssm:listParameters', path, recursive) as Promise<IpcResult<any[]>>,
  ssmGetParameter: (name: string, withDecryption?: boolean) =>
    ipcRenderer.invoke('ssm:getParameter', name, withDecryption) as Promise<IpcResult<any>>,
  ssmPutParameter: (name: string, value: string, type: string, description?: string, kmsKeyId?: string, overwrite?: boolean) =>
    ipcRenderer.invoke('ssm:putParameter', name, value, type, description, kmsKeyId, overwrite) as Promise<IpcResult<number>>,
  ssmDeleteParameter: (name: string) =>
    ipcRenderer.invoke('ssm:deleteParameter', name) as Promise<IpcResult>,
  ssmDeleteParameters: (names: string[]) =>
    ipcRenderer.invoke('ssm:deleteParameters', names) as Promise<IpcResult<string[]>>,
  ssmGetParameterHistory: (name: string) =>
    ipcRenderer.invoke('ssm:getParameterHistory', name) as Promise<IpcResult<any[]>>,

  // Simple Notification Service (SNS)
  snsReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('sns:reinit', endpoint, region) as Promise<IpcResult>,
  snsListTopics: () =>
    ipcRenderer.invoke('sns:listTopics') as Promise<IpcResult<any[]>>,
  snsCreateTopic: (name: string) =>
    ipcRenderer.invoke('sns:createTopic', name) as Promise<IpcResult<string>>,
  snsDeleteTopic: (topicArn: string) =>
    ipcRenderer.invoke('sns:deleteTopic', topicArn) as Promise<IpcResult>,
  snsListSubscriptionsByTopic: (topicArn: string) =>
    ipcRenderer.invoke('sns:listSubscriptionsByTopic', topicArn) as Promise<IpcResult<any[]>>,
  snsSubscribe: (topicArn: string, protocol: string, endpoint: string) =>
    ipcRenderer.invoke('sns:subscribe', topicArn, protocol, endpoint) as Promise<IpcResult<string>>,
  snsUnsubscribe: (subscriptionArn: string) =>
    ipcRenderer.invoke('sns:unsubscribe', subscriptionArn) as Promise<IpcResult>,
  snsPublish: (topicArn: string, message: string, subject?: string) =>
    ipcRenderer.invoke('sns:publish', topicArn, message, subject) as Promise<IpcResult<string>>,

  // --- EventBridge ---
  ebReinit: (endpoint: string, region: string) => ipcRenderer.invoke('eb:reinit', endpoint, region) as Promise<IpcResult>,
  ebListBuses: () => ipcRenderer.invoke('eb:listBuses') as Promise<IpcResult<EbBus[]>>,
  ebCreateBus: (name: string) => ipcRenderer.invoke('eb:createBus', name) as Promise<IpcResult<string>>,
  ebDeleteBus: (name: string) => ipcRenderer.invoke('eb:deleteBus', name) as Promise<IpcResult>,
  ebListRules: (busName: string) => ipcRenderer.invoke('eb:listRules', busName) as Promise<IpcResult<EbRule[]>>,
  ebPutRule: (busName: string, name: string, pattern?: string, schedule?: string, desc?: string, state?: 'ENABLED' | 'DISABLED') => ipcRenderer.invoke('eb:putRule', busName, name, pattern, schedule, desc, state) as Promise<IpcResult<string>>,
  ebDeleteRule: (busName: string, name: string) => ipcRenderer.invoke('eb:deleteRule', busName, name) as Promise<IpcResult>,
  ebEnableRule: (busName: string, name: string) => ipcRenderer.invoke('eb:enableRule', busName, name) as Promise<IpcResult>,
  ebDisableRule: (busName: string, name: string) => ipcRenderer.invoke('eb:disableRule', busName, name) as Promise<IpcResult>,
  ebListTargetsByRule: (busName: string, ruleName: string) => ipcRenderer.invoke('eb:listTargetsByRule', busName, ruleName) as Promise<IpcResult<EbTarget[]>>,
  ebPutTargets: (busName: string, ruleName: string, targets: { id: string, arn: string, input?: string }[]) => ipcRenderer.invoke('eb:putTargets', busName, ruleName, targets) as Promise<IpcResult<number>>,
  ebRemoveTargets: (busName: string, ruleName: string, targetIds: string[]) => ipcRenderer.invoke('eb:removeTargets', busName, ruleName, targetIds) as Promise<IpcResult<number>>,
  ebPutEvents: (busName: string, entries: EbEventEntry[]) => ipcRenderer.invoke('eb:putEvents', busName, entries) as Promise<IpcResult<number>>,

  // Scheduler
  schedulerReinit: (endpoint: string, region: string) => ipcRenderer.invoke('scheduler:reinit', endpoint, region) as Promise<IpcResult>,
  schedulerListGroups: () => ipcRenderer.invoke('scheduler:listGroups') as Promise<IpcResult<any[]>>,
  schedulerCreateGroup: (name: string) => ipcRenderer.invoke('scheduler:createGroup', name) as Promise<IpcResult<string>>,
  schedulerDeleteGroup: (name: string) => ipcRenderer.invoke('scheduler:deleteGroup', name) as Promise<IpcResult>,
  schedulerListSchedules: (groupName?: string) => ipcRenderer.invoke('scheduler:listSchedules', groupName) as Promise<IpcResult<any[]>>,
  schedulerGetSchedule: (name: string, groupName?: string) => ipcRenderer.invoke('scheduler:getSchedule', name, groupName) as Promise<IpcResult<any>>,
  schedulerCreateSchedule: (params: any) => ipcRenderer.invoke('scheduler:createSchedule', params) as Promise<IpcResult<string>>,
  schedulerUpdateSchedule: (params: any) => ipcRenderer.invoke('scheduler:updateSchedule', params) as Promise<IpcResult<string>>,
  schedulerDeleteSchedule: (name: string, groupName?: string) => ipcRenderer.invoke('scheduler:deleteSchedule', name, groupName) as Promise<IpcResult>,

  // SES
  sesReinit: (endpoint: string, region: string) => ipcRenderer.invoke('ses:reinit', endpoint, region) as Promise<IpcResult>,
  sesListIdentities: () => ipcRenderer.invoke('ses:listIdentities') as Promise<IpcResult<any[]>>,
  sesVerifyEmail: (email: string) => ipcRenderer.invoke('ses:verifyEmail', email) as Promise<IpcResult>,
  sesVerifyDomain: (domain: string) => ipcRenderer.invoke('ses:verifyDomain', domain) as Promise<IpcResult<string>>,
  sesDeleteIdentity: (identity: string) => ipcRenderer.invoke('ses:deleteIdentity', identity) as Promise<IpcResult>,
  sesSendEmail: (params: any) => ipcRenderer.invoke('ses:sendEmail', params) as Promise<IpcResult<string>>,

  // KMS
  kmsReinit: (endpoint: string, region: string) => ipcRenderer.invoke('kms:reinit', endpoint, region) as Promise<IpcResult>,
  kmsListKeysWithAliases: () => ipcRenderer.invoke('kms:listKeysWithAliases') as Promise<IpcResult<any[]>>,
  kmsCreateKey: (description?: string) => ipcRenderer.invoke('kms:createKey', description) as Promise<IpcResult<string>>,
  kmsScheduleKeyDeletion: (keyId: string, pendingWindowInDays?: number) => ipcRenderer.invoke('kms:scheduleKeyDeletion', keyId, pendingWindowInDays) as Promise<IpcResult>,
  kmsCancelKeyDeletion: (keyId: string) => ipcRenderer.invoke('kms:cancelKeyDeletion', keyId) as Promise<IpcResult>,
  kmsEnableKey: (keyId: string) => ipcRenderer.invoke('kms:enableKey', keyId) as Promise<IpcResult>,
  kmsDisableKey: (keyId: string) => ipcRenderer.invoke('kms:disableKey', keyId) as Promise<IpcResult>,
  kmsCreateAlias: (aliasName: string, targetKeyId: string) => ipcRenderer.invoke('kms:createAlias', aliasName, targetKeyId) as Promise<IpcResult>,
  kmsEncryptData: (keyId: string, plaintext: string) => ipcRenderer.invoke('kms:encryptData', keyId, plaintext) as Promise<IpcResult<string>>,
  kmsDecryptData: (ciphertextBase64: string) => ipcRenderer.invoke('kms:decryptData', ciphertextBase64) as Promise<IpcResult<string>>,

  // IAM
  iamReinit: (endpoint: string, region: string) => ipcRenderer.invoke('iam:reinit', endpoint, region) as Promise<IpcResult>,
  iamListUsers: () => ipcRenderer.invoke('iam:listUsers') as Promise<IpcResult<any[]>>,
  iamCreateUser: (userName: string) => ipcRenderer.invoke('iam:createUser', userName) as Promise<IpcResult<string>>,
  iamDeleteUser: (userName: string) => ipcRenderer.invoke('iam:deleteUser', userName) as Promise<IpcResult>,
  iamListRoles: () => ipcRenderer.invoke('iam:listRoles') as Promise<IpcResult<any[]>>,
  iamCreateRole: (roleName: string, assumeRolePolicyDocument: string) => ipcRenderer.invoke('iam:createRole', roleName, assumeRolePolicyDocument) as Promise<IpcResult<string>>,
  iamDeleteRole: (roleName: string) => ipcRenderer.invoke('iam:deleteRole', roleName) as Promise<IpcResult>,
  iamListGroups: () => ipcRenderer.invoke('iam:listGroups') as Promise<IpcResult<any[]>>,
  iamCreateGroup: (groupName: string) => ipcRenderer.invoke('iam:createGroup', groupName) as Promise<IpcResult<string>>,
  iamDeleteGroup: (groupName: string) => ipcRenderer.invoke('iam:deleteGroup', groupName) as Promise<IpcResult>,
  iamGetGroupUsers: (groupName: string) => ipcRenderer.invoke('iam:getGroupUsers', groupName) as Promise<IpcResult<any[]>>,
  iamListGroupsForUser: (userName: string) => ipcRenderer.invoke('iam:listGroupsForUser', userName) as Promise<IpcResult<any[]>>,
  iamAddUserToGroup: (groupName: string, userName: string) => ipcRenderer.invoke('iam:addUserToGroup', groupName, userName) as Promise<IpcResult>,
  iamRemoveUserFromGroup: (groupName: string, userName: string) => ipcRenderer.invoke('iam:removeUserFromGroup', groupName, userName) as Promise<IpcResult>,
  iamCreatePolicy: (policyName: string, policyDocument: string, description?: string) => ipcRenderer.invoke('iam:createPolicy', policyName, policyDocument, description) as Promise<IpcResult<string>>,
  iamListPolicies: (scope?: 'Local' | 'AWS' | 'All') => ipcRenderer.invoke('iam:listPolicies', scope) as Promise<IpcResult<any[]>>,

  // STS (Security Token Service)
  stsReinit: (endpoint: string, region: string) => ipcRenderer.invoke('sts:reinit', endpoint, region) as Promise<void>,
  stsGetCallerIdentity: () => ipcRenderer.invoke('sts:getCallerIdentity') as Promise<IpcResult<any>>,
  stsAssumeRole: (roleArn: string, sessionName: string, durationSeconds?: number, policy?: string) => ipcRenderer.invoke('sts:assumeRole', roleArn, sessionName, durationSeconds, policy) as Promise<IpcResult<any>>,
  stsGetSessionToken: (durationSeconds?: number, serialNumber?: string, tokenCode?: string) => ipcRenderer.invoke('sts:getSessionToken', durationSeconds, serialNumber, tokenCode) as Promise<IpcResult<any>>,
  stsGetFederationToken: (name: string, durationSeconds?: number, policy?: string) => ipcRenderer.invoke('sts:getFederationToken', name, durationSeconds, policy) as Promise<IpcResult<any>>,
  stsAssumeRoleWithWebIdentity: (roleArn: string, roleSessionName: string, webIdentityToken: string, durationSeconds?: number) => ipcRenderer.invoke('sts:assumeRoleWithWebIdentity', roleArn, roleSessionName, webIdentityToken, durationSeconds) as Promise<IpcResult<any>>,

  // API Gateway
  apigwReinit: (endpoint: string, region: string) => ipcRenderer.invoke('apigw:reinit', endpoint, region) as Promise<IpcResult>,
  apigwListRestApis: () => ipcRenderer.invoke('apigw:listRestApis') as Promise<IpcResult<any[]>>,
  apigwCreateRestApi: (name: string, description?: string) => ipcRenderer.invoke('apigw:createRestApi', name, description) as Promise<IpcResult<string>>,
  apigwDeleteRestApi: (restApiId: string) => ipcRenderer.invoke('apigw:deleteRestApi', restApiId) as Promise<IpcResult>,
  apigwGetResources: (restApiId: string) => ipcRenderer.invoke('apigw:getResources', restApiId) as Promise<IpcResult<any[]>>,
  apigwCreateResource: (restApiId: string, parentId: string, pathPart: string) => ipcRenderer.invoke('apigw:createResource', restApiId, parentId, pathPart) as Promise<IpcResult<string>>,
  apigwDeleteResource: (restApiId: string, resourceId: string) => ipcRenderer.invoke('apigw:deleteResource', restApiId, resourceId) as Promise<IpcResult>,
  apigwPutMethod: (restApiId: string, resourceId: string, httpMethod: string) => ipcRenderer.invoke('apigw:putMethod', restApiId, resourceId, httpMethod) as Promise<IpcResult>,
  apigwDeleteMethod: (restApiId: string, resourceId: string, httpMethod: string) => ipcRenderer.invoke('apigw:deleteMethod', restApiId, resourceId, httpMethod) as Promise<IpcResult>,
  apigwPutIntegration: (restApiId: string, resourceId: string, httpMethod: string, type: string, integrationHttpMethod: string, uri?: string) => ipcRenderer.invoke('apigw:putIntegration', restApiId, resourceId, httpMethod, type, integrationHttpMethod, uri) as Promise<IpcResult>,
  apigwCreateDeployment: (restApiId: string, stageName: string, description?: string) => ipcRenderer.invoke('apigw:createDeployment', restApiId, stageName, description) as Promise<IpcResult<string>>,
  apigwGetStages: (restApiId: string) => ipcRenderer.invoke('apigw:getStages', restApiId) as Promise<IpcResult<any[]>>,

  // Firehose
  firehoseReinit: (endpoint: string, region: string) => ipcRenderer.invoke('firehose:reinit', endpoint, region) as Promise<IpcResult>,
  firehoseListDeliveryStreams: () => ipcRenderer.invoke('firehose:listDeliveryStreams') as Promise<IpcResult<string[]>>,
  firehoseDescribeDeliveryStream: (name: string) => ipcRenderer.invoke('firehose:describeDeliveryStream', name) as Promise<IpcResult<any>>,
  firehoseCreateDeliveryStream: (name: string, bucketArn: string, roleArn: string) => ipcRenderer.invoke('firehose:createDeliveryStream', name, bucketArn, roleArn) as Promise<IpcResult>,
  firehoseDeleteDeliveryStream: (name: string) => ipcRenderer.invoke('firehose:deleteDeliveryStream', name) as Promise<IpcResult>,
  firehosePutRecord: (name: string, data: string) => ipcRenderer.invoke('firehose:putRecord', name, data) as Promise<IpcResult<string>>,

  // Lambda
  lambdaReinit: (endpoint: string, region: string) => ipcRenderer.invoke('lambda:reinit', endpoint, region) as Promise<IpcResult>,
  lambdaListFunctions: () => ipcRenderer.invoke('lambda:listFunctions') as Promise<IpcResult<any[]>>,
  lambdaGetFunction: (name: string) => ipcRenderer.invoke('lambda:getFunction', name) as Promise<IpcResult<any>>,
  lambdaGetFunctionCode: (name: string) => ipcRenderer.invoke('lambda:getFunctionCode', name) as Promise<IpcResult<any>>,
  lambdaUpdateFunctionCode: (name: string, updatedFiles: { path: string, content: string }[]) => ipcRenderer.invoke('lambda:updateFunctionCode', name, updatedFiles) as Promise<IpcResult<any>>,
  lambdaCreateFunction: (name: string, roleArn: string, zipFilePath: string | null, handler?: string, runtime?: string, description?: string, timeout?: number, memorySize?: number, s3Config?: { bucket: string, key: string }, envVars?: Record<string, string>, inlineCode?: string | null) => ipcRenderer.invoke('lambda:createFunction', name, roleArn, zipFilePath, handler, runtime, description, timeout, memorySize, s3Config, envVars, inlineCode) as Promise<IpcResult>,
  lambdaDeleteFunction: (name: string) => ipcRenderer.invoke('lambda:deleteFunction', name) as Promise<IpcResult>,
  lambdaInvokeFunction: (name: string, payload: string) => ipcRenderer.invoke('lambda:invokeFunction', name, payload) as Promise<IpcResult<any>>,

  // --- CloudWatch ---
  cloudwatchReinit: (endpoint: string, region: string) => ipcRenderer.invoke('cloudwatch:reinit', endpoint, region) as Promise<void>,
  cloudwatchListLogGroups: () => ipcRenderer.invoke('cloudwatch:listLogGroups') as Promise<IpcResult<any[]>>,
  cloudwatchCreateLogGroup: (name: string) => ipcRenderer.invoke('cloudwatch:createLogGroup', name) as Promise<IpcResult>,
  cloudwatchDeleteLogGroup: (name: string) => ipcRenderer.invoke('cloudwatch:deleteLogGroup', name) as Promise<IpcResult>,
  cloudwatchListLogStreams: (groupName: string) => ipcRenderer.invoke('cloudwatch:listLogStreams', groupName) as Promise<IpcResult<any[]>>,
  cloudwatchGetLogEvents: (groupName: string, streamName: string, options?: any) => ipcRenderer.invoke('cloudwatch:getLogEvents', groupName, streamName, options) as Promise<IpcResult<any>>,
  cloudwatchFilterLogEvents: (groupName: string, options?: any) => ipcRenderer.invoke('cloudwatch:filterLogEvents', groupName, options) as Promise<IpcResult<any>>,
  cloudwatchListMetrics: () => ipcRenderer.invoke('cloudwatch:listMetrics') as Promise<IpcResult<any[]>>,
  cloudwatchGetMetricData: (params: any) => ipcRenderer.invoke('cloudwatch:getMetricData', params) as Promise<IpcResult<any[]>>,
  cloudwatchPutMetricData: (namespace: string, metricName: string, value: number) => ipcRenderer.invoke('cloudwatch:putMetricData', namespace, metricName, value) as Promise<IpcResult>,
  cloudwatchListAlarms: () => ipcRenderer.invoke('cloudwatch:listAlarms') as Promise<IpcResult<any>>,
  cloudwatchPutMetricAlarm: (params: any) => ipcRenderer.invoke('cloudwatch:putMetricAlarm', params) as Promise<IpcResult>,
  cloudwatchDeleteAlarms: (names: string[]) => ipcRenderer.invoke('cloudwatch:deleteAlarms', names) as Promise<IpcResult>,
  cloudwatchSetAlarmState: (name: string, state: string, reason: string) => ipcRenderer.invoke('cloudwatch:setAlarmState', name, state, reason) as Promise<IpcResult>,

  // Redshift
  redshiftReinit: (endpoint: string, region: string) => ipcRenderer.invoke('redshift:reinit', endpoint, region) as Promise<void>,
  redshiftListClusters: () => ipcRenderer.invoke('redshift:listClusters') as Promise<IpcResult<RedshiftCluster[]>>,
  redshiftDescribeCluster: (clusterId: string) => ipcRenderer.invoke('redshift:describeCluster', clusterId) as Promise<IpcResult<RedshiftCluster>>,
  redshiftCreateCluster: (params: any) => ipcRenderer.invoke('redshift:createCluster', params) as Promise<IpcResult<RedshiftCluster>>,
  redshiftDeleteCluster: (clusterId: string) => ipcRenderer.invoke('redshift:deleteCluster', clusterId) as Promise<IpcResult<RedshiftCluster>>,

  // Kinesis
  kinesisReinit: (endpoint: string, region: string) => ipcRenderer.invoke('kinesis:reinit', endpoint, region) as Promise<void>,
  kinesisListStreams: (endpoint: string, region: string) => ipcRenderer.invoke('kinesis:listStreams', endpoint, region) as Promise<IpcResult<string[]>>,
  kinesisDescribeStream: (endpoint: string, region: string, streamName: string) => ipcRenderer.invoke('kinesis:describeStream', endpoint, region, streamName) as Promise<IpcResult<KinesisStream>>,
  kinesisCreateStream: (endpoint: string, region: string, params: any) => ipcRenderer.invoke('kinesis:createStream', endpoint, region, params) as Promise<IpcResult>,
  kinesisDeleteStream: (endpoint: string, region: string, streamName: string) => ipcRenderer.invoke('kinesis:deleteStream', endpoint, region, streamName) as Promise<IpcResult>,

  // OpenSearch
  opensearchReinit: (endpoint: string, region: string) => ipcRenderer.invoke('opensearch:reinit', endpoint, region) as Promise<void>,
  opensearchListDomains: (endpoint: string, region: string) => ipcRenderer.invoke('opensearch:listDomains', endpoint, region) as Promise<IpcResult<string[]>>,
  opensearchDescribeDomain: (endpoint: string, region: string, domainName: string) => ipcRenderer.invoke('opensearch:describeDomain', endpoint, region, domainName) as Promise<IpcResult<any>>,
  opensearchCreateDomain: (endpoint: string, region: string, params: any) => ipcRenderer.invoke('opensearch:createDomain', endpoint, region, params) as Promise<IpcResult>,
  opensearchDeleteDomain: (endpoint: string, region: string, domainName: string) => ipcRenderer.invoke('opensearch:deleteDomain', endpoint, region, domainName) as Promise<IpcResult>,
  opensearchGetClusterHealth: (domainEndpoint: string) => ipcRenderer.invoke('opensearch:getClusterHealth', domainEndpoint) as Promise<IpcResult<any>>,
  opensearchListIndices: (domainEndpoint: string) => ipcRenderer.invoke('opensearch:listIndices', domainEndpoint) as Promise<IpcResult<any[]>>,
  opensearchCreateIndex: (domainEndpoint: string, indexName: string, settings?: object) => ipcRenderer.invoke('opensearch:createIndex', domainEndpoint, indexName, settings) as Promise<IpcResult>,
  opensearchDeleteIndex: (domainEndpoint: string, indexName: string) => ipcRenderer.invoke('opensearch:deleteIndex', domainEndpoint, indexName) as Promise<IpcResult>,
  opensearchGetMapping: (domainEndpoint: string, indexName: string) => ipcRenderer.invoke('opensearch:getMapping', domainEndpoint, indexName) as Promise<IpcResult<any>>,
  opensearchSearchDocuments: (domainEndpoint: string, indexName: string, query: object, size?: number) => ipcRenderer.invoke('opensearch:searchDocuments', domainEndpoint, indexName, query, size) as Promise<IpcResult<any>>,
  opensearchIndexDocument: (domainEndpoint: string, indexName: string, document: object, docId?: string) => ipcRenderer.invoke('opensearch:indexDocument', domainEndpoint, indexName, document, docId) as Promise<IpcResult<any>>,
  opensearchDeleteDocument: (domainEndpoint: string, indexName: string, docId: string) => ipcRenderer.invoke('opensearch:deleteDocument', domainEndpoint, indexName, docId) as Promise<IpcResult>,

  // EC2
  ec2Reinit: (endpoint: string, region: string) => ipcRenderer.invoke('ec2:reinit', endpoint, region) as Promise<void>,
  ec2ListInstances: () => ipcRenderer.invoke('ec2:listInstances') as Promise<IpcResult<any[]>>,
  ec2LaunchInstance: (params: any) => ipcRenderer.invoke('ec2:launchInstance', params) as Promise<IpcResult<string>>,
  ec2StartInstances: (instanceIds: string[]) => ipcRenderer.invoke('ec2:startInstances', instanceIds) as Promise<IpcResult>,
  ec2StopInstances: (instanceIds: string[]) => ipcRenderer.invoke('ec2:stopInstances', instanceIds) as Promise<IpcResult>,
  ec2RebootInstances: (instanceIds: string[]) => ipcRenderer.invoke('ec2:rebootInstances', instanceIds) as Promise<IpcResult>,
  ec2TerminateInstances: (instanceIds: string[]) => ipcRenderer.invoke('ec2:terminateInstances', instanceIds) as Promise<IpcResult>,
  ec2ListImages: (owners?: string[]) => ipcRenderer.invoke('ec2:listImages', owners) as Promise<IpcResult<any[]>>,
  ec2ListKeyPairs: () => ipcRenderer.invoke('ec2:listKeyPairs') as Promise<IpcResult<any[]>>,
  ec2CreateKeyPair: (keyName: string) => ipcRenderer.invoke('ec2:createKeyPair', keyName) as Promise<IpcResult<any>>,
  ec2DeleteKeyPair: (keyName: string) => ipcRenderer.invoke('ec2:deleteKeyPair', keyName) as Promise<IpcResult>,
  ec2ListSecurityGroups: () => ipcRenderer.invoke('ec2:listSecurityGroups') as Promise<IpcResult<any[]>>,
  ec2CreateSecurityGroup: (params: any) => ipcRenderer.invoke('ec2:createSecurityGroup', params) as Promise<IpcResult<string>>,
  ec2DeleteSecurityGroup: (groupId: string) => ipcRenderer.invoke('ec2:deleteSecurityGroup', groupId) as Promise<IpcResult>,
  ec2AuthorizeSecurityGroupIngress: (params: any) => ipcRenderer.invoke('ec2:authorizeSecurityGroupIngress', params) as Promise<IpcResult>,
  ec2RevokeSecurityGroupIngress: (params: any) => ipcRenderer.invoke('ec2:revokeSecurityGroupIngress', params) as Promise<IpcResult>,
  ec2ListVpcs: () => ipcRenderer.invoke('ec2:listVpcs') as Promise<IpcResult<any[]>>,
  ec2CreateVpc: (cidrBlock: string) => ipcRenderer.invoke('ec2:createVpc', cidrBlock) as Promise<IpcResult<string>>,
  ec2DeleteVpc: (vpcId: string) => ipcRenderer.invoke('ec2:deleteVpc', vpcId) as Promise<IpcResult>,
  ec2ListSubnets: (vpcId?: string) => ipcRenderer.invoke('ec2:listSubnets', vpcId) as Promise<IpcResult<any[]>>,
  ec2ListVolumes: () => ipcRenderer.invoke('ec2:listVolumes') as Promise<IpcResult<any[]>>,
  ec2CreateVolume: (params: any) => ipcRenderer.invoke('ec2:createVolume', params) as Promise<IpcResult<string>>,
  ec2DeleteVolume: (volumeId: string) => ipcRenderer.invoke('ec2:deleteVolume', volumeId) as Promise<IpcResult>,
  ec2AttachVolume: (params: any) => ipcRenderer.invoke('ec2:attachVolume', params) as Promise<IpcResult>,
  ec2DetachVolume: (volumeId: string) => ipcRenderer.invoke('ec2:detachVolume', volumeId) as Promise<IpcResult>,

  // Transcribe
  transcribeReinit: (endpoint: string, region: string) => ipcRenderer.invoke('transcribe:reinit', endpoint, region) as Promise<void>,
  transcribeListJobs: (statusFilter?: string) => ipcRenderer.invoke('transcribe:listJobs', statusFilter) as Promise<IpcResult<any[]>>,
  transcribeGetJob: (jobName: string) => ipcRenderer.invoke('transcribe:getJob', jobName) as Promise<IpcResult<any>>,
  transcribeStartJob: (params: { jobName: string; languageCode: string; mediaUri: string; mediaFormat?: string; outputBucketName?: string }) => ipcRenderer.invoke('transcribe:startJob', params) as Promise<IpcResult<any>>,
  transcribeDeleteJob: (jobName: string) => ipcRenderer.invoke('transcribe:deleteJob', jobName) as Promise<IpcResult>,

  // Route 53
  route53Reinit: (endpoint: string, region: string) => ipcRenderer.invoke('route53:reinit', endpoint, region) as Promise<void>,
  route53ListHostedZones: () => ipcRenderer.invoke('route53:listHostedZones') as Promise<IpcResult<any[]>>,
  route53GetHostedZone: (zoneId: string) => ipcRenderer.invoke('route53:getHostedZone', zoneId) as Promise<IpcResult<any>>,
  route53CreateHostedZone: (params: { name: string; comment?: string; privateZone?: boolean }) => ipcRenderer.invoke('route53:createHostedZone', params) as Promise<IpcResult<any>>,
  route53DeleteHostedZone: (zoneId: string) => ipcRenderer.invoke('route53:deleteHostedZone', zoneId) as Promise<IpcResult>,
  route53ListRecordSets: (zoneId: string) => ipcRenderer.invoke('route53:listRecordSets', zoneId) as Promise<IpcResult<any[]>>,
  route53CreateRecord: (zoneId: string, record: any) => ipcRenderer.invoke('route53:createRecord', zoneId, record) as Promise<IpcResult>,
  route53UpsertRecord: (zoneId: string, record: any) => ipcRenderer.invoke('route53:upsertRecord', zoneId, record) as Promise<IpcResult>,
  route53DeleteRecord: (zoneId: string, record: any) => ipcRenderer.invoke('route53:deleteRecord', zoneId, record) as Promise<IpcResult>,
  route53ListHealthChecks: () => ipcRenderer.invoke('route53:listHealthChecks') as Promise<IpcResult<any[]>>,
  route53GetHealthCheck: (checkId: string) => ipcRenderer.invoke('route53:getHealthCheck', checkId) as Promise<IpcResult<any>>,
  route53CreateHealthCheck: (params: any) => ipcRenderer.invoke('route53:createHealthCheck', params) as Promise<IpcResult<any>>,
  route53DeleteHealthCheck: (checkId: string) => ipcRenderer.invoke('route53:deleteHealthCheck', checkId) as Promise<IpcResult>,

  // ACM (Certificate Manager)
  acmReinit: (endpoint: string, region: string) => ipcRenderer.invoke('acm:reinit', endpoint, region) as Promise<void>,
  acmListCertificates: () => ipcRenderer.invoke('acm:listCertificates') as Promise<IpcResult<any[]>>,
  acmDescribeCertificate: (arn: string) => ipcRenderer.invoke('acm:describeCertificate', arn) as Promise<IpcResult<any>>,
  acmRequestCertificate: (params: { domainName: string; subjectAlternativeNames?: string[]; validationMethod?: 'DNS' | 'EMAIL'; tags?: { Key: string; Value?: string }[] }) => ipcRenderer.invoke('acm:requestCertificate', params) as Promise<IpcResult<string>>,
  acmImportCertificate: (params: { certificate: string; privateKey: string; certificateChain?: string; existingArn?: string }) => ipcRenderer.invoke('acm:importCertificate', params) as Promise<IpcResult<string>>,
  acmGetCertificatePem: (arn: string) => ipcRenderer.invoke('acm:getCertificatePem', arn) as Promise<IpcResult<{ certificate: string; certificateChain?: string }>>,
  acmDeleteCertificate: (arn: string) => ipcRenderer.invoke('acm:deleteCertificate', arn) as Promise<IpcResult>,
  acmListTagsForCertificate: (arn: string) => ipcRenderer.invoke('acm:listTagsForCertificate', arn) as Promise<IpcResult<any[]>>,
  acmAddTagsToCertificate: (arn: string, tags: { Key: string; Value?: string }[]) => ipcRenderer.invoke('acm:addTagsToCertificate', arn, tags) as Promise<IpcResult>,
  acmRenewCertificate: (arn: string) => ipcRenderer.invoke('acm:renewCertificate', arn) as Promise<IpcResult>,

  // SWF (Simple Workflow Service)
  swfReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('swf:reinit', endpoint, region),
  swfListDomains: (registrationStatus?: 'REGISTERED' | 'DEPRECATED') =>
    ipcRenderer.invoke('swf:listDomains', registrationStatus) as Promise<IpcResult<SwfDomain[]>>,
  swfRegisterDomain: (name: string, description: string, retentionDays: string) =>
    ipcRenderer.invoke('swf:registerDomain', name, description, retentionDays) as Promise<IpcResult>,
  swfDescribeDomain: (name: string) =>
    ipcRenderer.invoke('swf:describeDomain', name) as Promise<IpcResult<SwfDomain>>,
  swfDeprecateDomain: (name: string) =>
    ipcRenderer.invoke('swf:deprecateDomain', name) as Promise<IpcResult>,
  swfListWorkflowTypes: (domain: string, registrationStatus?: 'REGISTERED' | 'DEPRECATED') =>
    ipcRenderer.invoke('swf:listWorkflowTypes', domain, registrationStatus) as Promise<IpcResult<SwfWorkflowType[]>>,
  swfRegisterWorkflowType: (domain: string, name: string, version: string, description?: string, defaultTaskList?: string, defaultExecutionStartToCloseTimeout?: string, defaultTaskStartToCloseTimeout?: string) =>
    ipcRenderer.invoke('swf:registerWorkflowType', domain, name, version, description, defaultTaskList, defaultExecutionStartToCloseTimeout, defaultTaskStartToCloseTimeout) as Promise<IpcResult>,
  swfDeprecateWorkflowType: (domain: string, name: string, version: string) =>
    ipcRenderer.invoke('swf:deprecateWorkflowType', domain, name, version) as Promise<IpcResult>,
  swfListActivityTypes: (domain: string, registrationStatus?: 'REGISTERED' | 'DEPRECATED') =>
    ipcRenderer.invoke('swf:listActivityTypes', domain, registrationStatus) as Promise<IpcResult<SwfActivityType[]>>,
  swfRegisterActivityType: (domain: string, name: string, version: string, description?: string, defaultTaskList?: string, defaultScheduleToCloseTimeout?: string, defaultScheduleToStartTimeout?: string, defaultStartToCloseTimeout?: string, defaultHeartbeatTimeout?: string) =>
    ipcRenderer.invoke('swf:registerActivityType', domain, name, version, description, defaultTaskList, defaultScheduleToCloseTimeout, defaultScheduleToStartTimeout, defaultStartToCloseTimeout, defaultHeartbeatTimeout) as Promise<IpcResult>,
  swfDeprecateActivityType: (domain: string, name: string, version: string) =>
    ipcRenderer.invoke('swf:deprecateActivityType', domain, name, version) as Promise<IpcResult>,
  swfListOpenExecutions: (domain: string) =>
    ipcRenderer.invoke('swf:listOpenExecutions', domain) as Promise<IpcResult<SwfExecution[]>>,
  swfListClosedExecutions: (domain: string) =>
    ipcRenderer.invoke('swf:listClosedExecutions', domain) as Promise<IpcResult<SwfExecution[]>>,
  swfDescribeExecution: (domain: string, workflowId: string, runId: string) =>
    ipcRenderer.invoke('swf:describeExecution', domain, workflowId, runId) as Promise<IpcResult<SwfExecutionDetail>>,
  swfStartExecution: (domain: string, workflowId: string, workflowName: string, workflowVersion: string, input?: string, tagList?: string[], executionStartToCloseTimeout?: string, taskStartToCloseTimeout?: string) =>
    ipcRenderer.invoke('swf:startExecution', domain, workflowId, workflowName, workflowVersion, input, tagList, executionStartToCloseTimeout, taskStartToCloseTimeout) as Promise<IpcResult<string>>,
  swfTerminateExecution: (domain: string, workflowId: string, runId: string, reason?: string) =>
    ipcRenderer.invoke('swf:terminateExecution', domain, workflowId, runId, reason) as Promise<IpcResult>,
  swfSignalExecution: (domain: string, workflowId: string, runId: string, signalName: string, input?: string) =>
    ipcRenderer.invoke('swf:signalExecution', domain, workflowId, runId, signalName, input) as Promise<IpcResult>,
  swfGetExecutionHistory: (domain: string, workflowId: string, runId: string) =>
    ipcRenderer.invoke('swf:getExecutionHistory', domain, workflowId, runId) as Promise<IpcResult<SwfHistoryEvent[]>>,
  swfRequestCancelExecution: (domain: string, workflowId: string, runId: string) =>
    ipcRenderer.invoke('swf:requestCancelExecution', domain, workflowId, runId) as Promise<IpcResult>,

  // SFN (Step Functions)
  sfnReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('sfn:reinit', endpoint, region),
  sfnListStateMachines: () =>
    ipcRenderer.invoke('sfn:listStateMachines') as Promise<IpcResult<SfnStateMachine[]>>,
  sfnCreateStateMachine: (name: string, definition: string, roleArn: string, type: 'STANDARD' | 'EXPRESS', tags?: Record<string, string>) =>
    ipcRenderer.invoke('sfn:createStateMachine', name, definition, roleArn, type, tags) as Promise<IpcResult<string>>,
  sfnDescribeStateMachine: (stateMachineArn: string) =>
    ipcRenderer.invoke('sfn:describeStateMachine', stateMachineArn) as Promise<IpcResult<SfnStateMachineDetail>>,
  sfnUpdateStateMachine: (stateMachineArn: string, definition?: string, roleArn?: string) =>
    ipcRenderer.invoke('sfn:updateStateMachine', stateMachineArn, definition, roleArn) as Promise<IpcResult>,
  sfnDeleteStateMachine: (stateMachineArn: string) =>
    ipcRenderer.invoke('sfn:deleteStateMachine', stateMachineArn) as Promise<IpcResult>,
  sfnStartExecution: (stateMachineArn: string, name?: string, input?: string) =>
    ipcRenderer.invoke('sfn:startExecution', stateMachineArn, name, input) as Promise<IpcResult<string>>,
  sfnListExecutions: (stateMachineArn: string, statusFilter?: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED') =>
    ipcRenderer.invoke('sfn:listExecutions', stateMachineArn, statusFilter) as Promise<IpcResult<SfnExecution[]>>,
  sfnDescribeExecution: (executionArn: string) =>
    ipcRenderer.invoke('sfn:describeExecution', executionArn) as Promise<IpcResult<SfnExecutionDetail>>,
  sfnStopExecution: (executionArn: string, error?: string, cause?: string) =>
    ipcRenderer.invoke('sfn:stopExecution', executionArn, error, cause) as Promise<IpcResult>,
  sfnGetExecutionHistory: (executionArn: string) =>
    ipcRenderer.invoke('sfn:getExecutionHistory', executionArn) as Promise<IpcResult<SfnHistoryEvent[]>>,
  sfnListTagsForResource: (resourceArn: string) =>
    ipcRenderer.invoke('sfn:listTagsForResource', resourceArn) as Promise<IpcResult<Record<string, string>>>,
  sfnTagResource: (resourceArn: string, tags: Record<string, string>) =>
    ipcRenderer.invoke('sfn:tagResource', resourceArn, tags) as Promise<IpcResult>,
  sfnUntagResource: (resourceArn: string, tagKeys: string[]) =>
    ipcRenderer.invoke('sfn:untagResource', resourceArn, tagKeys) as Promise<IpcResult>,

  // Support
  supportReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('support:reinit', endpoint, region),
  supportDescribeCases: (includeResolvedCases?: boolean) =>
    ipcRenderer.invoke('support:describeCases', includeResolvedCases) as Promise<IpcResult<SupportCase[]>>,
  supportCreateCase: (subject: string, communicationBody: string, serviceCode?: string, severityCode?: string, categoryCode?: string, language?: string) =>
    ipcRenderer.invoke('support:createCase', subject, communicationBody, serviceCode, severityCode, categoryCode, language) as Promise<IpcResult<string>>,
  supportResolveCase: (caseId: string) =>
    ipcRenderer.invoke('support:resolveCase', caseId) as Promise<IpcResult<string>>,
  supportDescribeTrustedAdvisorChecks: (language?: string) =>
    ipcRenderer.invoke('support:describeTrustedAdvisorChecks', language) as Promise<IpcResult<TrustedAdvisorCheck[]>>,
  supportRefreshTrustedAdvisorCheck: (checkId: string) =>
    ipcRenderer.invoke('support:refreshTrustedAdvisorCheck', checkId) as Promise<IpcResult<string>>,

  // Resource Groups
  rgReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('rg:reinit', endpoint, region),
  rgListGroups: () =>
    ipcRenderer.invoke('rg:listGroups') as Promise<IpcResult<RgGroup[]>>,
  rgCreateGroup: (name: string, description: string, queryType: string, queryJson: string) =>
    ipcRenderer.invoke('rg:createGroup', name, description, queryType, queryJson) as Promise<IpcResult<RgGroup>>,
  rgDeleteGroup: (groupName: string) =>
    ipcRenderer.invoke('rg:deleteGroup', groupName) as Promise<IpcResult>,
  rgGetGroup: (groupName: string) =>
    ipcRenderer.invoke('rg:getGroup', groupName) as Promise<IpcResult<{
      group: RgGroup; query?: { type: string; query: string }; tags?: Record<string, string>; configuration?: any[]
    }>>,
  rgUpdateGroup: (groupName: string, description: string) =>
    ipcRenderer.invoke('rg:updateGroup', groupName, description) as Promise<IpcResult>,
  rgUpdateGroupQuery: (groupName: string, queryType: string, queryJson: string) =>
    ipcRenderer.invoke('rg:updateGroupQuery', groupName, queryType, queryJson) as Promise<IpcResult>,
  rgPutGroupConfiguration: (groupName: string, configuration: any[]) =>
    ipcRenderer.invoke('rg:putGroupConfiguration', groupName, configuration) as Promise<IpcResult>,
  rgListTagSyncTasks: (groupName?: string) =>
    ipcRenderer.invoke('rg:listTagSyncTasks', groupName) as Promise<IpcResult<RgTagSyncTask[]>>,
  rgGetTagSyncTask: (taskArn: string) =>
    ipcRenderer.invoke('rg:getTagSyncTask', taskArn) as Promise<IpcResult<RgTagSyncTask>>,
  rgStartTagSyncTask: (groupArn: string, tagKey: string, tagValue: string, roleArn: string) =>
    ipcRenderer.invoke('rg:startTagSyncTask', groupArn, tagKey, tagValue, roleArn) as Promise<IpcResult<string>>,
  rgCancelTagSyncTask: (taskArn: string) =>
    ipcRenderer.invoke('rg:cancelTagSyncTask', taskArn) as Promise<IpcResult>,
  rgGetTagKeys: () =>
    ipcRenderer.invoke('rg:getTagKeys') as Promise<IpcResult<string[]>>,
  rgGetTagValues: (key: string) =>
    ipcRenderer.invoke('rg:getTagValues', key) as Promise<IpcResult<string[]>>,
  rgGetResources: (tagFilters?: { key: string; values: string[] }[], resourceTypes?: string[]) =>
    ipcRenderer.invoke('rg:getResources', tagFilters, resourceTypes) as Promise<IpcResult<RgTaggedResource[]>>,
  rgTagResources: (resourceArns: string[], tags: Record<string, string>) =>
    ipcRenderer.invoke('rg:tagResources', resourceArns, tags) as Promise<IpcResult>,
  rgUntagResources: (resourceArns: string[], tagKeys: string[]) =>
    ipcRenderer.invoke('rg:untagResources', resourceArns, tagKeys) as Promise<IpcResult>,

  // AWS Config
  configReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('config:reinit', endpoint, region) as Promise<void>,
  configDescribeRecorders: () =>
    ipcRenderer.invoke('config:describeRecorders') as Promise<IpcResult<ConfigRecorder[]>>,
  configPutRecorder: (name: string, roleARN: string, allSupported: boolean, includeGlobal: boolean, resourceTypes: string[]) =>
    ipcRenderer.invoke('config:putRecorder', name, roleARN, allSupported, includeGlobal, resourceTypes) as Promise<IpcResult>,
  configStartRecorder: (name: string) =>
    ipcRenderer.invoke('config:startRecorder', name) as Promise<IpcResult>,
  configStopRecorder: (name: string) =>
    ipcRenderer.invoke('config:stopRecorder', name) as Promise<IpcResult>,
  configDeleteRecorder: (name: string) =>
    ipcRenderer.invoke('config:deleteRecorder', name) as Promise<IpcResult>,
  configDescribeChannels: () =>
    ipcRenderer.invoke('config:describeChannels') as Promise<IpcResult<ConfigDeliveryChannel[]>>,
  configPutChannel: (name: string, s3Bucket: string, s3Prefix?: string, snsTopic?: string, frequency?: string) =>
    ipcRenderer.invoke('config:putChannel', name, s3Bucket, s3Prefix, snsTopic, frequency) as Promise<IpcResult>,
  configDeleteChannel: (name: string) =>
    ipcRenderer.invoke('config:deleteChannel', name) as Promise<IpcResult>,
  configDescribeRules: () =>
    ipcRenderer.invoke('config:describeRules') as Promise<IpcResult<ConfigRule[]>>,
  configPutRule: (name: string, sourceOwner: string, sourceIdentifier: string, description?: string, tagKey?: string, tagValue?: string, resourceTypes?: string[]) =>
    ipcRenderer.invoke('config:putRule', name, sourceOwner, sourceIdentifier, description, tagKey, tagValue, resourceTypes) as Promise<IpcResult>,
  configDeleteRule: (name: string) =>
    ipcRenderer.invoke('config:deleteRule', name) as Promise<IpcResult>,
  configGetComplianceByRule: () =>
    ipcRenderer.invoke('config:getComplianceByRule') as Promise<IpcResult<ConfigComplianceResult[]>>,
  configGetComplianceDetailsByRule: (ruleName: string) =>
    ipcRenderer.invoke('config:getComplianceDetailsByRule', ruleName) as Promise<IpcResult<ConfigComplianceResult[]>>,
  configListDiscoveredResources: (resourceType: string) =>
    ipcRenderer.invoke('config:listDiscoveredResources', resourceType) as Promise<IpcResult<ConfigDiscoveredResource[]>>,
  configGetResourceConfigHistory: (resourceType: string, resourceId: string) =>
    ipcRenderer.invoke('config:getResourceConfigHistory', resourceType, resourceId) as Promise<IpcResult<ConfigResourceHistory[]>>,
  configListTags: (resourceArn: string) =>
    ipcRenderer.invoke('config:listTags', resourceArn) as Promise<IpcResult<Record<string, string>>>,
  configTagResource: (resourceArn: string, tags: Record<string, string>) =>
    ipcRenderer.invoke('config:tagResource', resourceArn, tags) as Promise<IpcResult>,
  configUntagResource: (resourceArn: string, tagKeys: string[]) =>
    ipcRenderer.invoke('config:untagResource', resourceArn, tagKeys) as Promise<IpcResult>,

  // Route 53 Resolver
  r53rReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('r53r:reinit', endpoint, region) as Promise<void>,
  r53rListEndpoints: () =>
    ipcRenderer.invoke('r53r:listEndpoints') as Promise<IpcResult<R53ResolverEndpoint[]>>,
  r53rCreateEndpoint: (name: string, direction: string, sgIds: string[], ips: { SubnetId: string; Ip?: string }[]) =>
    ipcRenderer.invoke('r53r:createEndpoint', name, direction, sgIds, ips) as Promise<IpcResult<string>>,
  r53rGetEndpoint: (id: string) =>
    ipcRenderer.invoke('r53r:getEndpoint', id) as Promise<IpcResult<R53ResolverEndpoint>>,
  r53rUpdateEndpoint: (id: string, name: string) =>
    ipcRenderer.invoke('r53r:updateEndpoint', id, name) as Promise<IpcResult>,
  r53rDeleteEndpoint: (id: string) =>
    ipcRenderer.invoke('r53r:deleteEndpoint', id) as Promise<IpcResult>,
  r53rListEndpointIps: (id: string) =>
    ipcRenderer.invoke('r53r:listEndpointIps', id) as Promise<IpcResult<{ ip?: string; subnetId?: string; status?: string; ipId?: string }[]>>,
  r53rAssociateEndpointIp: (endpointId: string, subnetId: string, ip?: string) =>
    ipcRenderer.invoke('r53r:associateEndpointIp', endpointId, subnetId, ip) as Promise<IpcResult>,
  r53rDisassociateEndpointIp: (endpointId: string, ipId: string) =>
    ipcRenderer.invoke('r53r:disassociateEndpointIp', endpointId, ipId) as Promise<IpcResult>,
  r53rListRules: () =>
    ipcRenderer.invoke('r53r:listRules') as Promise<IpcResult<R53ResolverRule[]>>,
  r53rCreateRule: (name: string, domainName: string, ruleType: string, endpointId?: string, targetIps?: { Ip: string; Port?: number }[]) =>
    ipcRenderer.invoke('r53r:createRule', name, domainName, ruleType, endpointId, targetIps) as Promise<IpcResult<string>>,
  r53rUpdateRule: (id: string, name: string, targetIps?: { Ip: string; Port?: number }[]) =>
    ipcRenderer.invoke('r53r:updateRule', id, name, targetIps) as Promise<IpcResult>,
  r53rDeleteRule: (id: string) =>
    ipcRenderer.invoke('r53r:deleteRule', id) as Promise<IpcResult>,
  r53rAssociateRule: (ruleId: string, vpcId: string, name?: string) =>
    ipcRenderer.invoke('r53r:associateRule', ruleId, vpcId, name) as Promise<IpcResult>,
  r53rDisassociateRule: (associationId: string) =>
    ipcRenderer.invoke('r53r:disassociateRule', associationId) as Promise<IpcResult>,
  r53rListRuleAssociations: () =>
    ipcRenderer.invoke('r53r:listRuleAssociations') as Promise<IpcResult<R53RuleAssociation[]>>,
  r53rListFwRuleGroups: () =>
    ipcRenderer.invoke('r53r:listFwRuleGroups') as Promise<IpcResult<R53FirewallRuleGroup[]>>,
  r53rCreateFwRuleGroup: (name: string) =>
    ipcRenderer.invoke('r53r:createFwRuleGroup', name) as Promise<IpcResult<string>>,
  r53rDeleteFwRuleGroup: (id: string) =>
    ipcRenderer.invoke('r53r:deleteFwRuleGroup', id) as Promise<IpcResult>,
  r53rListFwRules: (groupId: string) =>
    ipcRenderer.invoke('r53r:listFwRules', groupId) as Promise<IpcResult<R53FirewallRule[]>>,
  r53rCreateFwRule: (groupId: string, domainListId: string, name: string, priority: number, action: string, blockResponse?: string, blockOverrideDomain?: string) =>
    ipcRenderer.invoke('r53r:createFwRule', groupId, domainListId, name, priority, action, blockResponse, blockOverrideDomain) as Promise<IpcResult>,
  r53rDeleteFwRule: (groupId: string, domainListId: string) =>
    ipcRenderer.invoke('r53r:deleteFwRule', groupId, domainListId) as Promise<IpcResult>,
  r53rAssociateFwRuleGroup: (groupId: string, vpcId: string, priority: number, name: string) =>
    ipcRenderer.invoke('r53r:associateFwRuleGroup', groupId, vpcId, priority, name) as Promise<IpcResult>,
  r53rDisassociateFwRuleGroup: (associationId: string) =>
    ipcRenderer.invoke('r53r:disassociateFwRuleGroup', associationId) as Promise<IpcResult>,
  r53rListFwRuleGroupAssociations: () =>
    ipcRenderer.invoke('r53r:listFwRuleGroupAssociations') as Promise<IpcResult<R53FirewallRuleGroupAssociation[]>>,
  r53rListFwDomainLists: () =>
    ipcRenderer.invoke('r53r:listFwDomainLists') as Promise<IpcResult<R53FirewallDomainList[]>>,
  r53rCreateFwDomainList: (name: string) =>
    ipcRenderer.invoke('r53r:createFwDomainList', name) as Promise<IpcResult<string>>,
  r53rDeleteFwDomainList: (id: string) =>
    ipcRenderer.invoke('r53r:deleteFwDomainList', id) as Promise<IpcResult>,
  r53rListFwDomains: (domainListId: string) =>
    ipcRenderer.invoke('r53r:listFwDomains', domainListId) as Promise<IpcResult<string[]>>,
  r53rUpdateFwDomains: (domainListId: string, operation: string, domains: string[]) =>
    ipcRenderer.invoke('r53r:updateFwDomains', domainListId, operation, domains) as Promise<IpcResult>,
  r53rListTags: (resourceArn: string) =>
    ipcRenderer.invoke('r53r:listTags', resourceArn) as Promise<IpcResult<Record<string, string>>>,
  r53rTagResource: (resourceArn: string, tags: Record<string, string>) =>
    ipcRenderer.invoke('r53r:tagResource', resourceArn, tags) as Promise<IpcResult>,
  r53rUntagResource: (resourceArn: string, tagKeys: string[]) =>
    ipcRenderer.invoke('r53r:untagResource', resourceArn, tagKeys) as Promise<IpcResult>,

  // S3 Control
  s3controlReinit: (endpoint: string, region: string) =>
    ipcRenderer.invoke('s3control:reinit', endpoint, region),
  s3controlListAccessPoints: (bucket?: string) =>
    ipcRenderer.invoke('s3control:listAccessPoints', bucket) as Promise<IpcResult<S3ControlAccessPoint[]>>,
  s3controlCreateAccessPoint: (name: string, bucket: string, vpcId?: string) =>
    ipcRenderer.invoke('s3control:createAccessPoint', name, bucket, vpcId) as Promise<IpcResult<string>>,
  s3controlDeleteAccessPoint: (name: string) =>
    ipcRenderer.invoke('s3control:deleteAccessPoint', name) as Promise<IpcResult>,
  s3controlGetAccessPointPolicy: (name: string) =>
    ipcRenderer.invoke('s3control:getAccessPointPolicy', name) as Promise<IpcResult<string | null>>,
  s3controlPutAccessPointPolicy: (name: string, policy: string) =>
    ipcRenderer.invoke('s3control:putAccessPointPolicy', name, policy) as Promise<IpcResult>,
  s3controlDeleteAccessPointPolicy: (name: string) =>
    ipcRenderer.invoke('s3control:deleteAccessPointPolicy', name) as Promise<IpcResult>,
  s3controlListMRAPs: () =>
    ipcRenderer.invoke('s3control:listMRAPs') as Promise<IpcResult<S3ControlMRAP[]>>,
  s3controlCreateMRAP: (name: string, regions: Array<{ bucket: string }>, blockPublicAcls: boolean, ignorePublicAcls: boolean, blockPublicPolicy: boolean, restrictPublicBuckets: boolean) =>
    ipcRenderer.invoke('s3control:createMRAP', name, regions, blockPublicAcls, ignorePublicAcls, blockPublicPolicy, restrictPublicBuckets) as Promise<IpcResult<string>>,
  s3controlDeleteMRAP: (name: string) =>
    ipcRenderer.invoke('s3control:deleteMRAP', name) as Promise<IpcResult>,
  s3controlGetMRAPPolicy: (name: string) =>
    ipcRenderer.invoke('s3control:getMRAPPolicy', name) as Promise<IpcResult<string | null>>,
  s3controlPutMRAPPolicy: (name: string, policy: string) =>
    ipcRenderer.invoke('s3control:putMRAPPolicy', name, policy) as Promise<IpcResult>,
  s3controlGetPublicAccessBlock: () =>
    ipcRenderer.invoke('s3control:getPublicAccessBlock') as Promise<IpcResult<S3ControlPublicAccessBlock | null>>,
  s3controlPutPublicAccessBlock: (config: S3ControlPublicAccessBlock) =>
    ipcRenderer.invoke('s3control:putPublicAccessBlock', config) as Promise<IpcResult>,
  s3controlDeletePublicAccessBlock: () =>
    ipcRenderer.invoke('s3control:deletePublicAccessBlock') as Promise<IpcResult>,
}


contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
