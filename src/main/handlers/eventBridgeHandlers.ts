import { IpcMain } from 'electron'
import {
  reinitEventBridgeClient,
  listEventBuses,
  createEventBus,
  deleteEventBus,
  listRules,
  putRule,
  deleteRule,
  enableRule,
  disableRule,
  listTargetsByRule,
  putTargets,
  removeTargets,
  putEvents,
} from '../services/eventbridgeService'

export function registerEventBridgeHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('eb:reinit', (_event, endpoint: string, region: string) => {
    reinitEventBridgeClient(endpoint, region)
    return { success: true }
  })

  ipcMain.handle('eb:listBuses', async () => {
    try { return { success: true, data: await listEventBuses() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:createBus', async (_event, name: string) => {
    try { return { success: true, data: await createEventBus(name) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:deleteBus', async (_event, name: string) => {
    try { await deleteEventBus(name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:listRules', async (_event, busName: string) => {
    try { return { success: true, data: await listRules(busName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:putRule', async (_event, busName: string, name: string, pattern?: string, schedule?: string, desc?: string, state?: 'ENABLED' | 'DISABLED') => {
    try { return { success: true, data: await putRule(busName, name, pattern, schedule, desc, state) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:deleteRule', async (_event, busName: string, name: string) => {
    try { await deleteRule(busName, name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:enableRule', async (_event, busName: string, name: string) => {
    try { await enableRule(busName, name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:disableRule', async (_event, busName: string, name: string) => {
    try { await disableRule(busName, name); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:listTargetsByRule', async (_event, busName: string, ruleName: string) => {
    try { return { success: true, data: await listTargetsByRule(busName, ruleName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:putTargets', async (_event, busName: string, ruleName: string, targets: any[]) => {
    try { return { success: true, data: await putTargets(busName, ruleName, targets) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:removeTargets', async (_event, busName: string, ruleName: string, targetIds: string[]) => {
    try { return { success: true, data: await removeTargets(busName, ruleName, targetIds) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('eb:putEvents', async (_event, busName: string, entries: any[]) => {
    try { return { success: true, data: await putEvents(busName, entries) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
