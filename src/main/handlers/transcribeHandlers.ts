import { IpcMain } from 'electron'
import {
  reinitTranscribeClient,
  listTranscriptionJobs,
  getTranscriptionJob,
  startTranscriptionJob,
  deleteTranscriptionJob,
} from '../services/transcribeService'

export function registerTranscribeHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('transcribe:reinit', (_event, endpoint: string, region: string) => {
    reinitTranscribeClient(endpoint, region)
  })

  ipcMain.handle('transcribe:listJobs', async (_event, statusFilter?: string) => {
    try { return { success: true, data: await listTranscriptionJobs(statusFilter) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('transcribe:getJob', async (_event, jobName: string) => {
    try { return { success: true, data: await getTranscriptionJob(jobName) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('transcribe:startJob', async (_event, params: any) => {
    try { return { success: true, data: await startTranscriptionJob(params) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('transcribe:deleteJob', async (_event, jobName: string) => {
    try { await deleteTranscriptionJob(jobName); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })
}
