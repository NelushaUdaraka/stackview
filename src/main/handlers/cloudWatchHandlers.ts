import { IpcMain } from 'electron'
import {
  reinitCloudWatchClient,
  listLogGroups,
  createLogGroup,
  deleteLogGroup,
  listLogStreams,
  createLogStream,
  deleteLogStream,
  getLogEvents,
  filterLogEvents,
} from '../services/cloudwatchService'

export function registerCloudWatchHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('cloudwatch:reinit', (_event, endpoint: string, region: string) => {
    reinitCloudWatchClient(endpoint, region)
  })

  ipcMain.handle('cloudwatch:listLogGroups', async () => {
    try { return { success: true, data: await listLogGroups() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cloudwatch:createLogGroup', async (_event, name: string) => {
    try { await createLogGroup(name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cloudwatch:deleteLogGroup', async (_event, name: string) => {
    try { await deleteLogGroup(name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cloudwatch:listLogStreams', async (_event, groupName: string) => {
    try { return { success: true, data: await listLogStreams(groupName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cloudwatch:getLogEvents', async (_event, groupName: string, streamName: string, options: any) => {
    try { return { success: true, data: await getLogEvents(groupName, streamName, options) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('cloudwatch:filterLogEvents', async (_event, groupName: string, options: any) => {
    try { return { success: true, data: await filterLogEvents(groupName, options) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
