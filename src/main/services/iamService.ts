import {
  IAMClient,
  ListUsersCommand,
  CreateUserCommand,
  DeleteUserCommand,
  ListRolesCommand,
  CreateRoleCommand,
  DeleteRoleCommand,
  ListPoliciesCommand,
  ListGroupsCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
  CreatePolicyCommand,
  AddUserToGroupCommand,
  RemoveUserFromGroupCommand,
  GetGroupCommand,
  ListGroupsForUserCommand
} from '@aws-sdk/client-iam'

let client: IAMClient | null = null

export function reinitIamClient(endpoint: string, region: string) {
  client = new IAMClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
}

function getClient(): IAMClient {
  if (!client) throw new Error('IAMClient not initialized')
  return client
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface IamUser {
  userId: string
  userName: string
  arn: string
  createDate?: string
}

export interface IamRole {
  roleId: string
  roleName: string
  arn: string
  createDate?: string
  assumeRolePolicyDocument?: string
}

export interface IamGroup {
  groupId: string
  groupName: string
  arn: string
  createDate?: string
}

export interface IamPolicy {
  policyId: string
  policyName: string
  arn: string
  createDate?: string
  defaultVersionId?: string
  description?: string
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<IamUser[]> {
  const c = getClient()
  const res = await c.send(new ListUsersCommand({}))
  return (res.Users || []).map(u => ({
    userId: u.UserId || '',
    userName: u.UserName || '',
    arn: u.Arn || '',
    createDate: u.CreateDate?.toISOString()
  }))
}

export async function createUser(userName: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreateUserCommand({ UserName: userName }))
  return res.User?.UserId || ''
}

export async function deleteUser(userName: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteUserCommand({ UserName: userName }))
}

// ── Roles ────────────────────────────────────────────────────────────────────

export async function listRoles(): Promise<IamRole[]> {
  const c = getClient()
  const res = await c.send(new ListRolesCommand({}))
  return (res.Roles || []).map(r => ({
    roleId: r.RoleId || '',
    roleName: r.RoleName || '',
    arn: r.Arn || '',
    createDate: r.CreateDate?.toISOString(),
    assumeRolePolicyDocument: r.AssumeRolePolicyDocument ? decodeURIComponent(r.AssumeRolePolicyDocument) : undefined
  }))
}

export async function createRole(roleName: string, assumeRolePolicyDocument: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreateRoleCommand({ RoleName: roleName, AssumeRolePolicyDocument: assumeRolePolicyDocument }))
  return res.Role?.RoleId || ''
}

export async function deleteRole(roleName: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteRoleCommand({ RoleName: roleName }))
}

// ── Groups ───────────────────────────────────────────────────────────────────

export async function listGroups(): Promise<IamGroup[]> {
  const c = getClient()
  const res = await c.send(new ListGroupsCommand({}))
  return (res.Groups || []).map(g => ({
    groupId: g.GroupId || '',
    groupName: g.GroupName || '',
    arn: g.Arn || '',
    createDate: g.CreateDate?.toISOString()
  }))
}

export async function createGroup(groupName: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreateGroupCommand({ GroupName: groupName }))
  return res.Group?.GroupId || ''
}

export async function deleteGroup(groupName: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteGroupCommand({ GroupName: groupName }))
}

export async function getGroupUsers(groupName: string): Promise<IamUser[]> {
  const c = getClient()
  const res = await c.send(new GetGroupCommand({ GroupName: groupName }))
  return (res.Users || []).map(u => ({
    userId: u.UserId || '',
    userName: u.UserName || '',
    arn: u.Arn || '',
    createDate: u.CreateDate?.toISOString()
  }))
}

export async function listGroupsForUser(userName: string): Promise<IamGroup[]> {
  const c = getClient()
  const res = await c.send(new ListGroupsForUserCommand({ UserName: userName }))
  return (res.Groups || []).map(g => ({
    groupId: g.GroupId || '',
    groupName: g.GroupName || '',
    arn: g.Arn || '',
    createDate: g.CreateDate?.toISOString()
  }))
}

export async function addUserToGroup(groupName: string, userName: string): Promise<void> {
  const c = getClient()
  await c.send(new AddUserToGroupCommand({ GroupName: groupName, UserName: userName }))
}

export async function removeUserFromGroup(groupName: string, userName: string): Promise<void> {
  const c = getClient()
  await c.send(new RemoveUserFromGroupCommand({ GroupName: groupName, UserName: userName }))
}

// ── Policies ─────────────────────────────────────────────────────────────────

export async function listPolicies(scope: 'Local' | 'AWS' | 'All' = 'Local'): Promise<IamPolicy[]> {
  const c = getClient()
  const res = await c.send(new ListPoliciesCommand({ Scope: scope }))
  return (res.Policies || []).map(p => ({
    policyId: p.PolicyId || '',
    policyName: p.PolicyName || '',
    arn: p.Arn || '',
    createDate: p.CreateDate?.toISOString(),
    defaultVersionId: p.DefaultVersionId,
    description: p.Description
  }))
}

export async function createPolicy(policyName: string, policyDocument: string, description?: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreatePolicyCommand({ PolicyName: policyName, PolicyDocument: policyDocument, Description: description }))
  return res.Policy?.Arn || ''
}
