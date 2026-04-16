import { IpcMain } from 'electron'
import {
  initConfigClient,
  describeConfigurationRecorders,
  putConfigurationRecorder,
  startConfigurationRecorder,
  stopConfigurationRecorder,
  deleteConfigurationRecorder,
  describeDeliveryChannels,
  putDeliveryChannel,
  deleteDeliveryChannel,
  describeConfigRules,
  putConfigRule,
  deleteConfigRule,
  getComplianceByConfigRule,
  getComplianceDetailsByRule,
  listDiscoveredResources,
  getResourceConfigHistory,
  listConfigTags,
  tagConfigResource,
  untagConfigResource,
} from '../services/configService'

export function registerConfigHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('config:reinit', (_event, endpoint: string, region: string) => {
    initConfigClient(endpoint, region)
  })

  // Recorders
  ipcMain.handle('config:describeRecorders', async () => {
    try { return { success: true, data: await describeConfigurationRecorders() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:putRecorder', async (_e, name: string, roleARN: string, allSupported: boolean, includeGlobal: boolean, resourceTypes: string[]) => {
    try { await putConfigurationRecorder(name, roleARN, allSupported, includeGlobal, resourceTypes); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:startRecorder', async (_e, name: string) => {
    try { await startConfigurationRecorder(name); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:stopRecorder', async (_e, name: string) => {
    try { await stopConfigurationRecorder(name); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:deleteRecorder', async (_e, name: string) => {
    try { await deleteConfigurationRecorder(name); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  // Delivery Channels
  ipcMain.handle('config:describeChannels', async () => {
    try { return { success: true, data: await describeDeliveryChannels() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:putChannel', async (_e, name: string, s3Bucket: string, s3Prefix?: string, snsTopic?: string, frequency?: string) => {
    try { await putDeliveryChannel(name, s3Bucket, s3Prefix, snsTopic, frequency); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:deleteChannel', async (_e, name: string) => {
    try { await deleteDeliveryChannel(name); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  // Config Rules
  ipcMain.handle('config:describeRules', async () => {
    try { return { success: true, data: await describeConfigRules() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:putRule', async (_e, name: string, sourceOwner: string, sourceIdentifier: string, description?: string, tagKey?: string, tagValue?: string, resourceTypes?: string[]) => {
    try { await putConfigRule(name, sourceOwner as 'AWS' | 'CUSTOM_LAMBDA', sourceIdentifier, description, tagKey, tagValue, resourceTypes); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:deleteRule', async (_e, name: string) => {
    try { await deleteConfigRule(name); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:getComplianceByRule', async () => {
    try { return { success: true, data: await getComplianceByConfigRule() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:getComplianceDetailsByRule', async (_e, ruleName: string) => {
    try { return { success: true, data: await getComplianceDetailsByRule(ruleName) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  // Resource Discovery
  ipcMain.handle('config:listDiscoveredResources', async (_e, resourceType: string) => {
    try { return { success: true, data: await listDiscoveredResources(resourceType) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:getResourceConfigHistory', async (_e, resourceType: string, resourceId: string) => {
    try { return { success: true, data: await getResourceConfigHistory(resourceType, resourceId) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  // Tags
  ipcMain.handle('config:listTags', async (_e, resourceArn: string) => {
    try { return { success: true, data: await listConfigTags(resourceArn) } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:tagResource', async (_e, resourceArn: string, tags: Record<string, string>) => {
    try { await tagConfigResource(resourceArn, tags); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  ipcMain.handle('config:untagResource', async (_e, resourceArn: string, tagKeys: string[]) => {
    try { await untagConfigResource(resourceArn, tagKeys); return { success: true } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })
}
