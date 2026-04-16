import { IpcMain } from 'electron'
import {
  reinitSchedulerClient,
  listScheduleGroups,
  createScheduleGroup,
  deleteScheduleGroup,
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../services/schedulerService'

export function registerSchedulerHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('scheduler:reinit', (_event, endpoint: string, region: string) => {
    reinitSchedulerClient(endpoint, region)
    return { success: true }
  })

  ipcMain.handle('scheduler:listGroups', async () => {
    try { return { success: true, data: await listScheduleGroups() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('scheduler:createGroup', async (_event, name: string) => {
    try { return { success: true, data: await createScheduleGroup(name) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('scheduler:deleteGroup', async (_event, name: string) => {
    try { await deleteScheduleGroup(name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('scheduler:listSchedules', async (_event, groupName?: string) => {
    try { return { success: true, data: await listSchedules(groupName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('scheduler:getSchedule', async (_event, name: string, groupName?: string) => {
    try { return { success: true, data: await getSchedule(name, groupName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('scheduler:createSchedule', async (_event, params: any) => {
    try { return { success: true, data: await createSchedule(params) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('scheduler:updateSchedule', async (_event, params: any) => {
    try { return { success: true, data: await updateSchedule(params) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('scheduler:deleteSchedule', async (_event, name: string, groupName?: string) => {
    try { await deleteSchedule(name, groupName); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
