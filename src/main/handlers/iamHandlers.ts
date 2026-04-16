import { IpcMain } from 'electron'
import {
  reinitIamClient,
  listUsers,
  createUser,
  deleteUser,
  listRoles,
  createRole,
  deleteRole,
  listGroups,
  createGroup as iamCreateGroup,
  deleteGroup as iamDeleteGroup,
  getGroupUsers,
  listGroupsForUser,
  addUserToGroup,
  removeUserFromGroup,
  createPolicy,
  listPolicies,
} from '../services/iamService'

export function registerIamHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('iam:reinit', (_event, endpoint: string, region: string) => {
    reinitIamClient(endpoint, region)
    return { success: true }
  })

  ipcMain.handle('iam:listUsers', async () => {
    try { return { success: true, data: await listUsers() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:createUser', async (_event, userName: string) => {
    try { return { success: true, data: await createUser(userName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:deleteUser', async (_event, userName: string) => {
    try { await deleteUser(userName); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:listRoles', async () => {
    try { return { success: true, data: await listRoles() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:createRole', async (_event, roleName: string, doc: string) => {
    try { return { success: true, data: await createRole(roleName, doc) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:deleteRole', async (_event, roleName: string) => {
    try { await deleteRole(roleName); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:listGroups', async () => {
    try { return { success: true, data: await listGroups() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:createGroup', async (_event, groupName: string) => {
    try { return { success: true, data: await iamCreateGroup(groupName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:deleteGroup', async (_event, groupName: string) => {
    try { await iamDeleteGroup(groupName); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:getGroupUsers', async (_event, groupName: string) => {
    try { return { success: true, data: await getGroupUsers(groupName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:listGroupsForUser', async (_event, userName: string) => {
    try { return { success: true, data: await listGroupsForUser(userName) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:addUserToGroup', async (_event, groupName: string, userName: string) => {
    try { await addUserToGroup(groupName, userName); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:removeUserFromGroup', async (_event, groupName: string, userName: string) => {
    try { await removeUserFromGroup(groupName, userName); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('iam:listPolicies', async (_event, scope: 'Local' | 'AWS' | 'All') => {
    try { return { success: true, data: await listPolicies(scope) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
