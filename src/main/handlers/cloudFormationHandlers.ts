import { IpcMain } from 'electron'
import {
  initCfnClient,
  listStacks,
  describeStack,
  describeStackResources,
  describeStackEvents,
  getTemplate,
  createStack as cfnCreateStack,
  updateStack as cfnUpdateStack,
  deleteStack as cfnDeleteStack,
  validateTemplate,
  listExports,
} from '../services/cloudFormationService'

export function registerCloudFormationHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('cfn:reinit', (_event, endpoint: string, region: string) => {
    try { initCfnClient(endpoint, region); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:listStacks', async (_event, statusFilter?: string[]) => {
    try { return { success: true, data: await listStacks(statusFilter) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:describeStack', async (_event, stackName: string) => {
    try { return { success: true, data: await describeStack(stackName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:describeStackResources', async (_event, stackName: string) => {
    try { return { success: true, data: await describeStackResources(stackName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:describeStackEvents', async (_event, stackName: string) => {
    try { return { success: true, data: await describeStackEvents(stackName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:getTemplate', async (_event, stackName: string) => {
    try { return { success: true, data: await getTemplate(stackName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:createStack', async (_event, stackName: string, templateBody: string, parameters?: any[], capabilities?: string[]) => {
    try { return { success: true, data: await cfnCreateStack(stackName, templateBody, parameters, capabilities) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:updateStack', async (_event, stackName: string, templateBody: string, parameters?: any[], capabilities?: string[]) => {
    try { return { success: true, data: await cfnUpdateStack(stackName, templateBody, parameters, capabilities) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:deleteStack', async (_event, stackName: string) => {
    try { await cfnDeleteStack(stackName); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:validateTemplate', async (_event, templateBody: string) => {
    try { return { success: true, data: await validateTemplate(templateBody) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cfn:listExports', async () => {
    try { return { success: true, data: await listExports() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
