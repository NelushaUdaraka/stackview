import { IpcMain } from 'electron'
import {
  reinitFirehose,
  listDeliveryStreams,
  describeDeliveryStream,
  createDeliveryStream,
  deleteDeliveryStream,
  putRecord,
} from '../services/firehoseService'

export function registerFirehoseHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('firehose:reinit', (_event, endpoint: string, region: string) => {
    reinitFirehose(endpoint, region)
    return { success: true }
  })

  ipcMain.handle('firehose:listDeliveryStreams', async () => {
    try { return { success: true, data: await listDeliveryStreams() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('firehose:describeDeliveryStream', async (_event, name: string) => {
    try { return { success: true, data: await describeDeliveryStream(name) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('firehose:createDeliveryStream', async (_event, name: string, bucketArn: string, roleArn: string) => {
    try { return { success: true, data: await createDeliveryStream(name, bucketArn, roleArn) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('firehose:deleteDeliveryStream', async (_event, name: string) => {
    try { await deleteDeliveryStream(name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('firehose:putRecord', async (_event, name: string, data: string) => {
    try { return { success: true, data: await putRecord(name, data) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
