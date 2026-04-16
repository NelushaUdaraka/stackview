import { IpcMain } from 'electron'
import {
  initRoute53Client,
  listHostedZones,
  getHostedZone,
  createHostedZone,
  deleteHostedZone,
  listRecordSets,
  createRecord,
  upsertRecord,
  deleteRecord,
  listHealthChecks,
  getHealthCheck,
  createHealthCheck,
  deleteHealthCheck,
} from '../services/route53Service'

export function registerRoute53Handlers(ipcMain: IpcMain): void {
  ipcMain.handle('route53:reinit', (_event, endpoint: string, region: string) => {
    initRoute53Client(endpoint, region)
  })

  ipcMain.handle('route53:listHostedZones', async () => {
    try { return { success: true, data: await listHostedZones() }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:getHostedZone', async (_event, zoneId: string) => {
    try { return { success: true, data: await getHostedZone(zoneId) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:createHostedZone', async (_event, params: any) => {
    try { return { success: true, data: await createHostedZone(params) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:deleteHostedZone', async (_event, zoneId: string) => {
    try { await deleteHostedZone(zoneId); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:listRecordSets', async (_event, zoneId: string) => {
    try { return { success: true, data: await listRecordSets(zoneId) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:createRecord', async (_event, zoneId: string, record: any) => {
    try { await createRecord(zoneId, record); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:upsertRecord', async (_event, zoneId: string, record: any) => {
    try { await upsertRecord(zoneId, record); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:deleteRecord', async (_event, zoneId: string, record: any) => {
    try { await deleteRecord(zoneId, record); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:listHealthChecks', async () => {
    try { return { success: true, data: await listHealthChecks() }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:getHealthCheck', async (_event, checkId: string) => {
    try { return { success: true, data: await getHealthCheck(checkId) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:createHealthCheck', async (_event, params: any) => {
    try { return { success: true, data: await createHealthCheck(params) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('route53:deleteHealthCheck', async (_event, checkId: string) => {
    try { await deleteHealthCheck(checkId); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })
}
