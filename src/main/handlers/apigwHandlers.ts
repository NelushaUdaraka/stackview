import { IpcMain } from 'electron'
import {
  reinitApigwClient,
  listRestApis,
  createRestApi,
  deleteRestApi,
  getResources,
  createResource,
  deleteResource,
  putMethod,
  deleteMethod,
  putIntegration,
  createDeployment,
  getStages,
} from '../services/apigwService'

export function registerApigwHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('apigw:reinit', (_event, endpoint: string, region: string) => {
    try { reinitApigwClient(endpoint, region); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:listRestApis', async () => {
    try { return { success: true, data: await listRestApis() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:createRestApi', async (_event, name: string, description?: string) => {
    try { return { success: true, data: await createRestApi(name, description) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:deleteRestApi', async (_event, restApiId: string) => {
    try { await deleteRestApi(restApiId); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:getResources', async (_event, restApiId: string) => {
    try { return { success: true, data: await getResources(restApiId) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:createResource', async (_event, restApiId: string, parentId: string, pathPart: string) => {
    try { return { success: true, data: await createResource(restApiId, parentId, pathPart) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:deleteResource', async (_event, restApiId: string, resourceId: string) => {
    try { await deleteResource(restApiId, resourceId); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:putMethod', async (_event, restApiId: string, resourceId: string, httpMethod: string) => {
    try { await putMethod(restApiId, resourceId, httpMethod); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:deleteMethod', async (_event, restApiId: string, resourceId: string, httpMethod: string) => {
    try { await deleteMethod(restApiId, resourceId, httpMethod); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:putIntegration', async (_event, restApiId: string, resourceId: string, httpMethod: string, type: string, integrationHttpMethod: string, uri?: string) => {
    try { await putIntegration(restApiId, resourceId, httpMethod, type, integrationHttpMethod, uri); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:createDeployment', async (_event, restApiId: string, stageName: string, description?: string) => {
    try { return { success: true, data: await createDeployment(restApiId, stageName, description) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('apigw:getStages', async (_event, restApiId: string) => {
    try { return { success: true, data: await getStages(restApiId) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
