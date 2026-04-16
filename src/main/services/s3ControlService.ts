import {
  S3ControlClient,
  ListAccessPointsCommand,
  CreateAccessPointCommand,
  DeleteAccessPointCommand,
  GetAccessPointPolicyCommand,
  PutAccessPointPolicyCommand,
  DeleteAccessPointPolicyCommand,
  ListMultiRegionAccessPointsCommand,
  CreateMultiRegionAccessPointCommand,
  DeleteMultiRegionAccessPointCommand,
  GetMultiRegionAccessPointPolicyCommand,
  PutMultiRegionAccessPointPolicyCommand,
  GetPublicAccessBlockCommand,
  PutPublicAccessBlockCommand,
  DeletePublicAccessBlockCommand,
} from '@aws-sdk/client-s3-control'
import type {
  S3ControlAccessPoint,
  S3ControlPublicAccessBlock,
  S3ControlMRAP,
} from '../../shared/types'

// LocalStack account ID for dummy credentials
const ACCOUNT_ID = '000000000000'

let s3ControlClient: S3ControlClient | null = null

export function initS3ControlClient(endpoint: string, region: string): void {
  s3ControlClient = new S3ControlClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

export function getS3ControlClient(): S3ControlClient {
  if (!s3ControlClient) throw new Error('S3 Control client not initialized')
  return s3ControlClient
}

// ── Access Points ─────────────────────────────────────────────────────────────

export async function listAccessPoints(bucket?: string): Promise<S3ControlAccessPoint[]> {
  const client = getS3ControlClient()
  const result = await client.send(
    new ListAccessPointsCommand({
      AccountId: ACCOUNT_ID,
      Bucket: bucket,
    })
  )
  return (result.AccessPointList ?? []).map((ap) => ({
    name: ap.Name ?? '',
    bucket: ap.Bucket ?? '',
    accessPointArn: ap.AccessPointArn,
    alias: ap.Alias,
    networkOrigin: ap.NetworkOrigin,
    vpcId: ap.VpcConfiguration?.VpcId,
  }))
}

export async function createAccessPoint(
  name: string,
  bucket: string,
  vpcId?: string
): Promise<string> {
  const client = getS3ControlClient()
  const result = await client.send(
    new CreateAccessPointCommand({
      AccountId: ACCOUNT_ID,
      Name: name,
      Bucket: bucket,
      VpcConfiguration: vpcId ? { VpcId: vpcId } : undefined,
    })
  )
  return result.AccessPointArn ?? name
}

export async function deleteAccessPoint(name: string): Promise<void> {
  const client = getS3ControlClient()
  await client.send(
    new DeleteAccessPointCommand({
      AccountId: ACCOUNT_ID,
      Name: name,
    })
  )
}

export async function getAccessPointPolicy(name: string): Promise<string | null> {
  const client = getS3ControlClient()
  try {
    const result = await client.send(
      new GetAccessPointPolicyCommand({
        AccountId: ACCOUNT_ID,
        Name: name,
      })
    )
    return result.Policy ?? null
  } catch {
    return null
  }
}

export async function putAccessPointPolicy(name: string, policy: string): Promise<void> {
  const client = getS3ControlClient()
  await client.send(
    new PutAccessPointPolicyCommand({
      AccountId: ACCOUNT_ID,
      Name: name,
      Policy: policy,
    })
  )
}

export async function deleteAccessPointPolicy(name: string): Promise<void> {
  const client = getS3ControlClient()
  await client.send(
    new DeleteAccessPointPolicyCommand({
      AccountId: ACCOUNT_ID,
      Name: name,
    })
  )
}

// ── Multi-Region Access Points ────────────────────────────────────────────────

export async function listMultiRegionAccessPoints(): Promise<S3ControlMRAP[]> {
  const client = getS3ControlClient()
  const result = await client.send(
    new ListMultiRegionAccessPointsCommand({ AccountId: ACCOUNT_ID })
  )
  return (result.AccessPoints ?? []).map((mrap) => ({
    name: mrap.Name ?? '',
    alias: mrap.Alias,
    arn: mrap.Name ? `arn:aws:s3::${ACCOUNT_ID}:accesspoint/${mrap.Alias}` : undefined,
    status: mrap.Status,
    createdAt: mrap.CreatedAt?.toISOString(),
    regions: (mrap.Regions ?? []).map((r) => ({
      bucket: r.Bucket ?? '',
      region: r.Region,
    })),
  }))
}

export async function createMultiRegionAccessPoint(
  name: string,
  regions: Array<{ bucket: string }>,
  blockPublicAcls = true,
  ignorePublicAcls = true,
  blockPublicPolicy = true,
  restrictPublicBuckets = true
): Promise<string> {
  const client = getS3ControlClient()
  const result = await client.send(
    new CreateMultiRegionAccessPointCommand({
      AccountId: ACCOUNT_ID,
      Details: {
        Name: name,
        Regions: regions.map((r) => ({ Bucket: r.bucket })),
        PublicAccessBlock: {
          BlockPublicAcls: blockPublicAcls,
          IgnorePublicAcls: ignorePublicAcls,
          BlockPublicPolicy: blockPublicPolicy,
          RestrictPublicBuckets: restrictPublicBuckets,
        },
      },
    })
  )
  return result.RequestTokenARN ?? name
}

export async function deleteMultiRegionAccessPoint(name: string): Promise<void> {
  const client = getS3ControlClient()
  await client.send(
    new DeleteMultiRegionAccessPointCommand({
      AccountId: ACCOUNT_ID,
      Details: { Name: name },
    })
  )
}

export async function getMRAPPolicy(mrapAlias: string): Promise<string | null> {
  const client = getS3ControlClient()
  try {
    const result = await client.send(
      new GetMultiRegionAccessPointPolicyCommand({
        AccountId: ACCOUNT_ID,
        Name: mrapAlias,
      })
    )
    return result.Policy?.Established?.Policy ?? null
  } catch {
    return null
  }
}

export async function putMRAPPolicy(mrapAlias: string, policy: string): Promise<void> {
  const client = getS3ControlClient()
  await client.send(
    new PutMultiRegionAccessPointPolicyCommand({
      AccountId: ACCOUNT_ID,
      Details: {
        Name: mrapAlias,
        Policy: policy,
      },
    })
  )
}

// ── Account Public Access Block ───────────────────────────────────────────────

export async function getPublicAccessBlock(): Promise<S3ControlPublicAccessBlock | null> {
  const client = getS3ControlClient()
  try {
    const result = await client.send(
      new GetPublicAccessBlockCommand({ AccountId: ACCOUNT_ID })
    )
    const cfg = result.PublicAccessBlockConfiguration
    if (!cfg) return null
    return {
      blockPublicAcls: cfg.BlockPublicAcls ?? false,
      ignorePublicAcls: cfg.IgnorePublicAcls ?? false,
      blockPublicPolicy: cfg.BlockPublicPolicy ?? false,
      restrictPublicBuckets: cfg.RestrictPublicBuckets ?? false,
    }
  } catch {
    return null
  }
}

export async function putPublicAccessBlock(config: S3ControlPublicAccessBlock): Promise<void> {
  const client = getS3ControlClient()
  await client.send(
    new PutPublicAccessBlockCommand({
      AccountId: ACCOUNT_ID,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: config.blockPublicAcls,
        IgnorePublicAcls: config.ignorePublicAcls,
        BlockPublicPolicy: config.blockPublicPolicy,
        RestrictPublicBuckets: config.restrictPublicBuckets,
      },
    })
  )
}

export async function deletePublicAccessBlock(): Promise<void> {
  const client = getS3ControlClient()
  await client.send(
    new DeletePublicAccessBlockCommand({ AccountId: ACCOUNT_ID })
  )
}
