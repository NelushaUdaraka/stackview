import { IpcMain } from 'electron'
import {
  reinitStsClient,
  getCallerIdentity,
  assumeRole,
  getSessionToken,
  getFederationToken,
  assumeRoleWithWebIdentity,
} from '../services/stsService'

export function registerStsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('sts:reinit', (_event, endpoint: string, region: string) => {
    reinitStsClient(endpoint, region)
  })

  ipcMain.handle('sts:getCallerIdentity', async () => {
    try { return { success: true, data: await getCallerIdentity() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sts:assumeRole', async (_event, roleArn: string, sessionName: string, durationSeconds?: number, policy?: string) => {
    try { return { success: true, data: await assumeRole(roleArn, sessionName, durationSeconds, policy) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sts:getSessionToken', async (_event, durationSeconds?: number, serialNumber?: string, tokenCode?: string) => {
    try { return { success: true, data: await getSessionToken(durationSeconds, serialNumber, tokenCode) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sts:getFederationToken', async (_event, name: string, durationSeconds?: number, policy?: string) => {
    try { return { success: true, data: await getFederationToken(name, durationSeconds, policy) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sts:assumeRoleWithWebIdentity', async (_event, roleArn: string, roleSessionName: string, webIdentityToken: string, durationSeconds?: number) => {
    try { return { success: true, data: await assumeRoleWithWebIdentity(roleArn, roleSessionName, webIdentityToken, durationSeconds) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
