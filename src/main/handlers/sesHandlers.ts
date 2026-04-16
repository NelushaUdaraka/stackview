import { IpcMain } from 'electron'
import {
  reinitSesClient,
  listIdentities,
  verifyEmailIdentity,
  verifyDomainIdentity,
  deleteIdentity,
  sendEmail,
} from '../services/sesService'

export function registerSesHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('ses:reinit', (_event, endpoint: string, region: string) => {
    reinitSesClient(endpoint, region)
    return { success: true }
  })

  ipcMain.handle('ses:listIdentities', async () => {
    try { return { success: true, data: await listIdentities() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ses:verifyEmail', async (_event, email: string) => {
    try { await verifyEmailIdentity(email); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ses:verifyDomain', async (_event, domain: string) => {
    try { return { success: true, data: await verifyDomainIdentity(domain) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ses:deleteIdentity', async (_event, identity: string) => {
    try {
      await deleteIdentity(identity)
      return { success: true }
    }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ses:sendEmail', async (_event, params: any) => {
    try { return { success: true, data: await sendEmail(params) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
