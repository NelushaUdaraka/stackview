import { IpcMain } from 'electron'
import {
  reinitKmsClient,
  listKeysWithAliases,
  createKey,
  scheduleKeyDeletion,
  cancelKeyDeletion,
  enableKey,
  disableKey,
  createAlias,
  encryptData,
  decryptData,
} from '../services/kmsService'

export function registerKmsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('kms:reinit', (_event, endpoint: string, region: string) => {
    reinitKmsClient(endpoint, region)
    return { success: true }
  })

  ipcMain.handle('kms:listKeysWithAliases', async () => {
    try { return { success: true, data: await listKeysWithAliases() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('kms:createKey', async (_event, description?: string) => {
    try { return { success: true, data: await createKey(description) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('kms:scheduleKeyDeletion', async (_event, keyId: string, days?: number) => {
    try { await scheduleKeyDeletion(keyId, days); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('kms:cancelKeyDeletion', async (_event, keyId: string) => {
    try { await cancelKeyDeletion(keyId); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('kms:enableKey', async (_event, keyId: string) => {
    try { await enableKey(keyId); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('kms:disableKey', async (_event, keyId: string) => {
    try { await disableKey(keyId); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('kms:createAlias', async (_event, aliasName: string, targetKeyId: string) => {
    try { await createAlias(aliasName, targetKeyId); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('kms:encryptData', async (_event, keyId: string, plaintext: string) => {
    try { return { success: true, data: await encryptData(keyId, plaintext) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('kms:decryptData', async (_event, ciphertext: string) => {
    try { return { success: true, data: await decryptData(ciphertext) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
