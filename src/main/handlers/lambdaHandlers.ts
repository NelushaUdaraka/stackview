import { IpcMain } from 'electron'
import {
  initLambdaClient,
  reinitLambda,
  listFunctions,
  getFunction,
  getFunctionCode,
  updateFunctionCode,
  createFunction,
  deleteFunction,
  invokeFunction,
} from '../services/lambdaService'

export function registerLambdaHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('lambda:reinit', (_event, endpoint: string, region: string) => {
    reinitLambda(endpoint, region)
    return { success: true }
  })

  ipcMain.handle('lambda:listFunctions', async () => {
    try { return { success: true, data: await listFunctions() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('lambda:getFunction', async (_event, name: string) => {
    try { return { success: true, data: await getFunction(name) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('lambda:getFunctionCode', async (_event, name: string) => {
    try { return await getFunctionCode(name); }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('lambda:updateFunctionCode', async (_event, name: string, updatedFiles: { path: string, content: string }[]) => {
    try { return await updateFunctionCode(name, updatedFiles); }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('lambda:createFunction', async (_event, name: string, roleArn: string, zipFilePath: string | null, handler?: string, runtime?: string, description?: string, timeout?: number, memorySize?: number, s3Config?: { bucket: string, key: string }, envVars?: Record<string, string>, inlineCode?: string | null) => {
    try { return { success: true, data: await createFunction(name, roleArn, zipFilePath, handler, runtime, description, timeout, memorySize, s3Config, envVars, inlineCode) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('lambda:deleteFunction', async (_event, name: string) => {
    try { await deleteFunction(name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('lambda:invokeFunction', async (_event, name: string, payload: string) => {
    try { return { success: true, data: await invokeFunction(name, payload) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
