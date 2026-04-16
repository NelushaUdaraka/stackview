import { IpcMain } from 'electron'
import {
  reinitAcmClient,
  listCertificates,
  describeCertificate,
  requestCertificate,
  importCertificate,
  getCertificatePem,
  deleteCertificate,
  listTagsForCertificate,
  addTagsToCertificate,
  renewCertificate,
} from '../services/acmService'

export function registerAcmHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('acm:reinit', (_event, endpoint: string, region: string) => {
    reinitAcmClient(endpoint, region)
  })

  ipcMain.handle('acm:listCertificates', async () => {
    try { return { success: true, data: await listCertificates() }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('acm:describeCertificate', async (_event, arn: string) => {
    try { return { success: true, data: await describeCertificate(arn) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('acm:requestCertificate', async (_event, params: any) => {
    try { return { success: true, data: await requestCertificate(params) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('acm:importCertificate', async (_event, params: any) => {
    try { return { success: true, data: await importCertificate(params) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('acm:getCertificatePem', async (_event, arn: string) => {
    try { return { success: true, data: await getCertificatePem(arn) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('acm:deleteCertificate', async (_event, arn: string) => {
    try { await deleteCertificate(arn); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('acm:listTagsForCertificate', async (_event, arn: string) => {
    try { return { success: true, data: await listTagsForCertificate(arn) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('acm:addTagsToCertificate', async (_event, arn: string, tags: any[]) => {
    try { await addTagsToCertificate(arn, tags); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('acm:renewCertificate', async (_event, arn: string) => {
    try { await renewCertificate(arn); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })
}
