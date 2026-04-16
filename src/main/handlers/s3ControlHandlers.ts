import { IpcMain } from 'electron'
import {
  initS3ControlClient,
  listAccessPoints,
  createAccessPoint,
  deleteAccessPoint,
  getAccessPointPolicy,
  putAccessPointPolicy,
  deleteAccessPointPolicy,
  listMultiRegionAccessPoints,
  createMultiRegionAccessPoint,
  deleteMultiRegionAccessPoint,
  getMRAPPolicy,
  putMRAPPolicy,
  getPublicAccessBlock,
  putPublicAccessBlock,
  deletePublicAccessBlock,
} from '../services/s3ControlService'
import type { S3ControlPublicAccessBlock } from '../../shared/types'

export function registerS3ControlHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('s3control:reinit', (_event, endpoint: string, region: string) => {
    initS3ControlClient(endpoint, region)
  })

  // ── Access Points ────────────────────────────────────────────────────────────

  ipcMain.handle('s3control:listAccessPoints', async (_event, bucket?: string) => {
    try {
      const data = await listAccessPoints(bucket)
      return { success: true, data }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3control:createAccessPoint', async (_event, name: string, bucket: string, vpcId?: string) => {
    try {
      const arn = await createAccessPoint(name, bucket, vpcId)
      return { success: true, data: arn }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3control:deleteAccessPoint', async (_event, name: string) => {
    try {
      await deleteAccessPoint(name)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3control:getAccessPointPolicy', async (_event, name: string) => {
    try {
      const policy = await getAccessPointPolicy(name)
      return { success: true, data: policy }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3control:putAccessPointPolicy', async (_event, name: string, policy: string) => {
    try {
      await putAccessPointPolicy(name, policy)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3control:deleteAccessPointPolicy', async (_event, name: string) => {
    try {
      await deleteAccessPointPolicy(name)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // ── Multi-Region Access Points ───────────────────────────────────────────────

  ipcMain.handle('s3control:listMRAPs', async () => {
    try {
      const data = await listMultiRegionAccessPoints()
      return { success: true, data }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    's3control:createMRAP',
    async (_event, name: string, regions: Array<{ bucket: string }>, blockPublicAcls: boolean, ignorePublicAcls: boolean, blockPublicPolicy: boolean, restrictPublicBuckets: boolean) => {
      try {
        const token = await createMultiRegionAccessPoint(name, regions, blockPublicAcls, ignorePublicAcls, blockPublicPolicy, restrictPublicBuckets)
        return { success: true, data: token }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('s3control:deleteMRAP', async (_event, name: string) => {
    try {
      await deleteMultiRegionAccessPoint(name)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3control:getMRAPPolicy', async (_event, name: string) => {
    try {
      const policy = await getMRAPPolicy(name)
      return { success: true, data: policy }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3control:putMRAPPolicy', async (_event, name: string, policy: string) => {
    try {
      await putMRAPPolicy(name, policy)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // ── Account Public Access Block ───────────────────────────────────────────────

  ipcMain.handle('s3control:getPublicAccessBlock', async () => {
    try {
      const data = await getPublicAccessBlock()
      return { success: true, data }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3control:putPublicAccessBlock', async (_event, config: S3ControlPublicAccessBlock) => {
    try {
      await putPublicAccessBlock(config)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('s3control:deletePublicAccessBlock', async () => {
    try {
      await deletePublicAccessBlock()
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
