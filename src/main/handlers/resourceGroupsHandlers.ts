import { IpcMain } from 'electron'
import {
  initResourceGroupsClient,
  listGroups,
  createGroup,
  deleteGroup,
  getGroup,
  updateGroup,
  updateGroupQuery,
  putGroupConfiguration,
  listTagSyncTasks,
  getTagSyncTask,
  startTagSyncTask,
  cancelTagSyncTask,
  getTagKeys,
  getTagValues,
  getResources,
  tagResources,
  untagResources,
} from '../services/resourceGroupsService'

export function registerResourceGroupsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('rg:reinit', (_event, endpoint: string, region: string) => {
    initResourceGroupsClient(endpoint, region)
  })

  ipcMain.handle('rg:listGroups', async () => {
    try { return { success: true, data: await listGroups() } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:createGroup', async (_event, name: string, description: string, queryType: string, queryJson: string) => {
    try { return { success: true, data: await createGroup(name, description, queryType as any, queryJson) } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:deleteGroup', async (_event, groupName: string) => {
    try { await deleteGroup(groupName); return { success: true } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:getGroup', async (_event, groupName: string) => {
    try { return { success: true, data: await getGroup(groupName) } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:updateGroup', async (_event, groupName: string, description: string) => {
    try { await updateGroup(groupName, description); return { success: true } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:updateGroupQuery', async (_event, groupName: string, queryType: string, queryJson: string) => {
    try { await updateGroupQuery(groupName, queryType as any, queryJson); return { success: true } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:putGroupConfiguration', async (_event, groupName: string, configuration: any[]) => {
    try { await putGroupConfiguration(groupName, configuration); return { success: true } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:listTagSyncTasks', async (_event, groupName?: string) => {
    try { return { success: true, data: await listTagSyncTasks(groupName) } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:getTagSyncTask', async (_event, taskArn: string) => {
    try { return { success: true, data: await getTagSyncTask(taskArn) } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:startTagSyncTask', async (_event, groupArn: string, tagKey: string, tagValue: string, roleArn: string) => {
    try { return { success: true, data: await startTagSyncTask(groupArn, tagKey, tagValue, roleArn) } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:cancelTagSyncTask', async (_event, taskArn: string) => {
    try { await cancelTagSyncTask(taskArn); return { success: true } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:getTagKeys', async () => {
    try { return { success: true, data: await getTagKeys() } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:getTagValues', async (_event, key: string) => {
    try { return { success: true, data: await getTagValues(key) } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:getResources', async (_event, tagFilters?: any[], resourceTypes?: string[]) => {
    try { return { success: true, data: await getResources(tagFilters, resourceTypes) } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:tagResources', async (_event, resourceArns: string[], tags: Record<string, string>) => {
    try { await tagResources(resourceArns, tags); return { success: true } }
    catch (err) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('rg:untagResources', async (_event, resourceArns: string[], tagKeys: string[]) => {
    try { await untagResources(resourceArns, tagKeys); return { success: true } }
    catch (err) { return { success: false, error: String(err) } }
  })
}
