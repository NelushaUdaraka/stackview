import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  GetBucketLocationCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createReadStream, createWriteStream } from 'fs'
import { stat } from 'fs/promises'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { lookup as mimeLookup } from 'mime-types'

let s3Client: S3Client | null = null

export function initS3Client(endpoint: string, region: string): void {
  s3Client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    forcePathStyle: true
  })
}

export function getS3Client(): S3Client {
  if (!s3Client) throw new Error('S3 client not initialized')
  return s3Client
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

export async function listBuckets(): Promise<S3BucketInfo[]> {
  const client = getS3Client()
  const result = await client.send(new ListBucketsCommand({}))
  return (result.Buckets ?? []).map((b) => ({
    name: b.Name!,
    creationDate: b.CreationDate?.toISOString()
  }))
}

export async function createBucket(name: string, region: string): Promise<void> {
  const client = getS3Client()
  const cmd: ConstructorParameters<typeof CreateBucketCommand>[0] = { Bucket: name }
  if (region && region !== 'us-east-1') {
    cmd.CreateBucketConfiguration = { LocationConstraint: region as never }
  }
  await client.send(new CreateBucketCommand(cmd))
}

export async function deleteBucket(name: string): Promise<void> {
  const client = getS3Client()
  await client.send(new DeleteBucketCommand({ Bucket: name }))
}

export async function listObjects(
  bucket: string,
  prefix = '',
  continuationToken?: string,
  maxKeys = 200
): Promise<S3ListResult> {
  const client = getS3Client()
  const result = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      Delimiter: '/',
      ContinuationToken: continuationToken,
      MaxKeys: maxKeys
    })
  )

  const prefixes = (result.CommonPrefixes ?? []).map((p) => p.Prefix ?? '')

  const objects: S3ObjectInfo[] = (result.Contents ?? [])
    .filter((o) => o.Key !== prefix)
    .map((o) => ({
      key: o.Key!,
      size: o.Size,
      lastModified: o.LastModified?.toISOString(),
      etag: o.ETag?.replace(/"/g, ''),
      isFolder: false
    }))

  return {
    objects,
    prefixes,
    nextToken: result.NextContinuationToken,
    totalCount: (result.KeyCount ?? 0)
  }
}

export async function headObject(bucket: string, key: string): Promise<S3ObjectMeta> {
  const client = getS3Client()
  const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  return {
    key,
    size: result.ContentLength,
    lastModified: result.LastModified?.toISOString(),
    etag: result.ETag?.replace(/"/g, ''),
    contentType: result.ContentType,
    metadata: result.Metadata
  }
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  const client = getS3Client()
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

export async function deleteObjects(bucket: string, keys: string[]): Promise<number> {
  const client = getS3Client()
  const result = await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((k) => ({ Key: k })),
        Quiet: false
      }
    })
  )
  return result.Deleted?.length ?? 0
}

export async function copyObject(
  srcBucket: string,
  srcKey: string,
  destBucket: string,
  destKey: string
): Promise<void> {
  const client = getS3Client()
  await client.send(
    new CopyObjectCommand({
      Bucket: destBucket,
      Key: destKey,
      CopySource: `${srcBucket}/${srcKey}`
    })
  )
}

export async function uploadObject(
  bucket: string,
  key: string,
  filePath: string
): Promise<void> {
  const client = getS3Client()
  const stats = await stat(filePath)
  const contentType = (mimeLookup(filePath) || 'application/octet-stream') as string
  const stream = createReadStream(filePath)
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentType: contentType,
      ContentLength: stats.size
    })
  )
}

export async function downloadObject(
  bucket: string,
  key: string,
  destPath: string
): Promise<void> {
  const client = getS3Client()
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const body = result.Body as Readable
  const writer = createWriteStream(destPath)
  await pipeline(body, writer)
}

export async function getPresignedUrl(
  bucket: string,
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client()
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key })
  return getSignedUrl(client, cmd, { expiresIn })
}

export async function getBucketLocation(bucket: string): Promise<string> {
  const client = getS3Client()
  const result = await client.send(new GetBucketLocationCommand({ Bucket: bucket }))
  return result.LocationConstraint ?? 'us-east-1'
}

export async function createFolder(bucket: string, folderKey: string): Promise<void> {
  const client = getS3Client()
  const key = folderKey.endsWith('/') ? folderKey : `${folderKey}/`
  // LocalStack requires a non-empty body for PutObject; a single newline is the
  // conventional minimal content used by S3 clients for folder markers.
  const body = Buffer.from('\n')
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentLength: body.byteLength,
    ContentType: 'application/x-directory'
  }))
}
