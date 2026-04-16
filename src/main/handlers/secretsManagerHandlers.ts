import { IpcMain } from 'electron'
import {
  initSecretsManagerClient,
  listSecrets,
  createSecret,
  getSecretValue,
  putSecretValue,
  deleteSecret,
} from '../services/secretsManagerService'

export function registerSecretsManagerHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('secretsmanager:reinit', (_event, endpoint: string, region: string) => {
    initSecretsManagerClient(endpoint, region)
  })

  ipcMain.handle('secretsmanager:listSecrets', async () => {
    try {
      const secrets = await listSecrets()
      return { success: true, data: secrets }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'secretsmanager:createSecret',
    async (_event, name: string, description: string, secretString: string) => {
      try {
        await createSecret(name, description, secretString)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('secretsmanager:getSecretValue', async (_event, secretId: string) => {
    try {
      const value = await getSecretValue(secretId)
      return { success: true, data: value }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'secretsmanager:putSecretValue',
    async (_event, secretId: string, secretString: string) => {
      try {
        await putSecretValue(secretId, secretString)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('secretsmanager:deleteSecret', async (_event, secretId: string) => {
    try {
      await deleteSecret(secretId)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })
}
