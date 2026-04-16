import {
  STSClient,
  GetCallerIdentityCommand,
  AssumeRoleCommand,
  GetSessionTokenCommand,
  GetFederationTokenCommand,
  AssumeRoleWithWebIdentityCommand,
} from '@aws-sdk/client-sts'

let client: STSClient | null = null

export function reinitStsClient(endpoint: string, region: string) {
  client = new STSClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
}

function getClient(): STSClient {
  if (!client) throw new Error('STSClient not initialized')
  return client
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Operations ────────────────────────────────────────────────────────────────

export async function getCallerIdentity(): Promise<StsCallerIdentity> {
  const c = getClient()
  const res = await c.send(new GetCallerIdentityCommand({}))
  return {
    account: res.Account || '',
    userId: res.UserId || '',
    arn: res.Arn || '',
  }
}

export async function assumeRole(
  roleArn: string,
  sessionName: string,
  durationSeconds?: number,
  policy?: string
): Promise<StsAssumedRoleResult> {
  const c = getClient()
  const res = await c.send(new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: sessionName,
    DurationSeconds: durationSeconds || undefined,
    Policy: policy || undefined,
  }))
  return {
    assumedRoleArn: res.AssumedRoleUser?.Arn || '',
    assumedRoleId: res.AssumedRoleUser?.AssumedRoleId || '',
    sessionName,
    credentials: {
      accessKeyId: res.Credentials?.AccessKeyId || '',
      secretAccessKey: res.Credentials?.SecretAccessKey || '',
      sessionToken: res.Credentials?.SessionToken || '',
      expiration: res.Credentials?.Expiration?.toISOString() || '',
    },
  }
}

export async function getSessionToken(
  durationSeconds?: number,
  serialNumber?: string,
  tokenCode?: string
): Promise<StsCredentials> {
  const c = getClient()
  const res = await c.send(new GetSessionTokenCommand({
    DurationSeconds: durationSeconds || undefined,
    SerialNumber: serialNumber || undefined,
    TokenCode: tokenCode || undefined,
  }))
  return {
    accessKeyId: res.Credentials?.AccessKeyId || '',
    secretAccessKey: res.Credentials?.SecretAccessKey || '',
    sessionToken: res.Credentials?.SessionToken || '',
    expiration: res.Credentials?.Expiration?.toISOString() || '',
  }
}

export async function getFederationToken(
  name: string,
  durationSeconds?: number,
  policy?: string
): Promise<StsFederatedUserResult> {
  const c = getClient()
  const res = await c.send(new GetFederationTokenCommand({
    Name: name,
    DurationSeconds: durationSeconds || undefined,
    Policy: policy || undefined,
  }))
  return {
    federatedUserId: res.FederatedUser?.FederatedUserId || '',
    arn: res.FederatedUser?.Arn || '',
    credentials: {
      accessKeyId: res.Credentials?.AccessKeyId || '',
      secretAccessKey: res.Credentials?.SecretAccessKey || '',
      sessionToken: res.Credentials?.SessionToken || '',
      expiration: res.Credentials?.Expiration?.toISOString() || '',
    },
  }
}

export async function assumeRoleWithWebIdentity(
  roleArn: string,
  roleSessionName: string,
  webIdentityToken: string,
  durationSeconds?: number
): Promise<StsAssumedRoleResult> {
  const c = getClient()
  const res = await c.send(new AssumeRoleWithWebIdentityCommand({
    RoleArn: roleArn,
    RoleSessionName: roleSessionName,
    WebIdentityToken: webIdentityToken,
    DurationSeconds: durationSeconds || undefined,
  }))
  return {
    assumedRoleArn: res.AssumedRoleUser?.Arn || '',
    assumedRoleId: res.AssumedRoleUser?.AssumedRoleId || '',
    sessionName: roleSessionName,
    credentials: {
      accessKeyId: res.Credentials?.AccessKeyId || '',
      secretAccessKey: res.Credentials?.SecretAccessKey || '',
      sessionToken: res.Credentials?.SessionToken || '',
      expiration: res.Credentials?.Expiration?.toISOString() || '',
    },
  }
}
