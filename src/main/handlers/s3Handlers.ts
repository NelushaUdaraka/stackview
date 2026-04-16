import { IpcMain } from 'electron'
import {
  initS3Client,
  listBuckets,
  createBucket,
  deleteBucket,
  listObjects,
  headObject,
  deleteObject,
  deleteObjects,
  copyObject,
  uploadObject,
  downloadObject,
  getPresignedUrl,
  getBucketLocation,
  createFolder,
} from '../services/s3Service'

export function registerS3Handlers(ipcMain: IpcMain): void {
  ipcMain.handle('s3:reinit', (_event, endpoint: string, region: string) => {
    initS3Client(endpoint, region)
  })

  ipcMain.handle('s3:listBuckets', async () => {
    try {
      const buckets = await listBuckets()
      return { success: true, data: buckets }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3:createBucket', async (_event, name: string, region: string) => {
    try {
      await createBucket(name, region)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3:deleteBucket', async (_event, name: string) => {
    try {
      await deleteBucket(name)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3:getBucketLocation', async (_event, name: string) => {
    try {
      const location = await getBucketLocation(name)
      return { success: true, data: location }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    's3:listObjects',
    async (
      _event,
      bucket: string,
      prefix: string,
      continuationToken?: string,
    ) => {
      try {
        const result = await listObjects(bucket, prefix, continuationToken)
        return { success: true, data: result }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle('s3:headObject', async (_event, bucket: string, key: string) => {
    try {
      const meta = await headObject(bucket, key)
      return { success: true, data: meta }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3:deleteObject', async (_event, bucket: string, key: string) => {
    try {
      await deleteObject(bucket, key)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    's3:deleteObjects',
    async (_event, bucket: string, keys: string[]) => {
      try {
        const count = await deleteObjects(bucket, keys)
        return { success: true, data: count }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle(
    's3:copyObject',
    async (
      _event,
      srcBucket: string,
      srcKey: string,
      destBucket: string,
      destKey: string,
    ) => {
      try {
        await copyObject(srcBucket, srcKey, destBucket, destKey)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle(
    's3:uploadObject',
    async (_event, bucket: string, key: string, filePath: string) => {
      try {
        await uploadObject(bucket, key, filePath)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle(
    's3:downloadObject',
    async (_event, bucket: string, key: string, destPath: string) => {
      try {
        await downloadObject(bucket, key, destPath)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle(
    's3:getPresignedUrl',
    async (_event, bucket: string, key: string, expiresIn: number) => {
      try {
        const url = await getPresignedUrl(bucket, key, expiresIn)
        return { success: true, data: url }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle(
    's3:createFolder',
    async (_event, bucket: string, folderKey: string) => {
      try {
        await createFolder(bucket, folderKey)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )
}
