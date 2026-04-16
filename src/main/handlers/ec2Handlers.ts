import { IpcMain } from 'electron'
import {
  initEC2Client,
  listInstances,
  launchInstance,
  startInstances,
  stopInstances,
  rebootInstances,
  terminateInstances,
  listImages,
  listKeyPairs,
  createKeyPair,
  deleteKeyPair,
  listSecurityGroups,
  createSecurityGroup,
  deleteSecurityGroup,
  authorizeSecurityGroupIngress,
  revokeSecurityGroupIngress,
  listVpcs,
  createVpc,
  deleteVpc,
  listSubnets,
  listVolumes,
  createVolume,
  deleteVolume,
  attachVolume,
  detachVolume,
} from '../services/ec2Service'

export function registerEc2Handlers(ipcMain: IpcMain): void {
  ipcMain.handle('ec2:reinit', (_event, endpoint: string, region: string) => initEC2Client(endpoint, region))

  ipcMain.handle('ec2:listInstances', async () => {
    try { return { success: true, data: await listInstances() }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:launchInstance', async (_event, params: any) => {
    try { return { success: true, data: await launchInstance(params) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:startInstances', async (_event, instanceIds: string[]) => {
    try { await startInstances(instanceIds); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:stopInstances', async (_event, instanceIds: string[]) => {
    try { await stopInstances(instanceIds); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:rebootInstances', async (_event, instanceIds: string[]) => {
    try { await rebootInstances(instanceIds); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:terminateInstances', async (_event, instanceIds: string[]) => {
    try { await terminateInstances(instanceIds); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:listImages', async (_event, owners?: string[]) => {
    try { return { success: true, data: await listImages(owners) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:listKeyPairs', async () => {
    try { return { success: true, data: await listKeyPairs() }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:createKeyPair', async (_event, keyName: string) => {
    try { return { success: true, data: await createKeyPair(keyName) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:deleteKeyPair', async (_event, keyName: string) => {
    try { await deleteKeyPair(keyName); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:listSecurityGroups', async () => {
    try { return { success: true, data: await listSecurityGroups() }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:createSecurityGroup', async (_event, params: any) => {
    try { return { success: true, data: await createSecurityGroup(params) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:deleteSecurityGroup', async (_event, groupId: string) => {
    try { await deleteSecurityGroup(groupId); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:authorizeSecurityGroupIngress', async (_event, params: any) => {
    try { await authorizeSecurityGroupIngress(params); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:revokeSecurityGroupIngress', async (_event, params: any) => {
    try { await revokeSecurityGroupIngress(params); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:listVpcs', async () => {
    try { return { success: true, data: await listVpcs() }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:createVpc', async (_event, cidrBlock: string) => {
    try { return { success: true, data: await createVpc(cidrBlock) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:deleteVpc', async (_event, vpcId: string) => {
    try { await deleteVpc(vpcId); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:listSubnets', async (_event, vpcId?: string) => {
    try { return { success: true, data: await listSubnets(vpcId) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:listVolumes', async () => {
    try { return { success: true, data: await listVolumes() }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:createVolume', async (_event, params: any) => {
    try { return { success: true, data: await createVolume(params) }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:deleteVolume', async (_event, volumeId: string) => {
    try { await deleteVolume(volumeId); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:attachVolume', async (_event, params: any) => {
    try { await attachVolume(params); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('ec2:detachVolume', async (_event, volumeId: string) => {
    try { await detachVolume(volumeId); return { success: true }; }
    catch (err) { return { success: false, error: String(err) }; }
  })
}
