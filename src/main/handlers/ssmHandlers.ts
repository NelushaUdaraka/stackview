import { IpcMain } from 'electron'
import {
  initSsmClient,
  listParameters,
  getParameter,
  putParameter,
  deleteParameter,
  deleteParameters as deleteParametersBulk,
  getParameterHistory,
} from '../services/ssmService'

export function registerSsmHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('ssm:reinit', (_event, endpoint: string, region: string) => {
    initSsmClient(endpoint, region)
    return { success: true }
  })

  ipcMain.handle('ssm:listParameters', async (_event, path?: string, recursive?: boolean) => {
    try { return { success: true, data: await listParameters(path, recursive) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ssm:getParameter', async (_event, name: string, withDecryption?: boolean) => {
    try { return { success: true, data: await getParameter(name, withDecryption) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ssm:putParameter', async (
    _event,
    name: string,
    value: string,
    type: 'String' | 'StringList' | 'SecureString',
    description?: string,
    kmsKeyId?: string,
    overwrite?: boolean
  ) => {
    try { return { success: true, data: await putParameter(name, value, type, description, kmsKeyId, overwrite) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ssm:deleteParameter', async (_event, name: string) => {
    try { await deleteParameter(name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ssm:deleteParameters', async (_event, names: string[]) => {
    try { return { success: true, data: await deleteParametersBulk(names) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ssm:getParameterHistory', async (_event, name: string) => {
    try { return { success: true, data: await getParameterHistory(name) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
