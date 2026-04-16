import {
  APIGatewayClient,
  GetRestApisCommand,
  CreateRestApiCommand,
  DeleteRestApiCommand,
  GetResourcesCommand,
  CreateResourceCommand,
  DeleteResourceCommand,
  PutMethodCommand,
  DeleteMethodCommand,
  PutIntegrationCommand,
  CreateDeploymentCommand,
  GetStagesCommand
} from '@aws-sdk/client-api-gateway'

let client: APIGatewayClient | null = null

export function reinitApigwClient(endpoint: string, region: string) {
  client = new APIGatewayClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
}

function getClient(): APIGatewayClient {
  if (!client) throw new Error('APIGatewayClient not initialized')
  return client
}

export interface ApigwRestApi {
  id: string
  name: string
  description?: string
  createdDate?: string
}

export interface ApigwResource {
  id: string
  parentId?: string
  pathPart?: string
  path?: string
  resourceMethods?: Record<string, any>
}

export interface ApigwStage {
  stageName: string
  deploymentId?: string
  createdDate?: string
  lastUpdatedDate?: string
}

// APIs
export async function listRestApis(): Promise<ApigwRestApi[]> {
  const c = getClient()
  const res = await c.send(new GetRestApisCommand({}))
  return (res.items || []).map(api => ({
    id: api.id || '',
    name: api.name || '',
    description: api.description,
    createdDate: api.createdDate?.toISOString()
  }))
}

export async function createRestApi(name: string, description?: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreateRestApiCommand({ name, description }))
  return res.id || ''
}

export async function deleteRestApi(restApiId: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteRestApiCommand({ restApiId }))
}

// Resources
export async function getResources(restApiId: string): Promise<ApigwResource[]> {
  const c = getClient()
  const res = await c.send(new GetResourcesCommand({ restApiId }))
  return (res.items || []).map(r => ({
    id: r.id || '',
    parentId: r.parentId,
    pathPart: r.pathPart,
    path: r.path,
    resourceMethods: r.resourceMethods
  }))
}

export async function createResource(restApiId: string, parentId: string, pathPart: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreateResourceCommand({ restApiId, parentId, pathPart }))
  return res.id || ''
}

export async function deleteResource(restApiId: string, resourceId: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteResourceCommand({ restApiId, resourceId }))
}

// Methods & Integrations
export async function putMethod(restApiId: string, resourceId: string, httpMethod: string): Promise<void> {
  const c = getClient()
  await c.send(new PutMethodCommand({ restApiId, resourceId, httpMethod, authorizationType: 'NONE' }))
}

export async function deleteMethod(restApiId: string, resourceId: string, httpMethod: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteMethodCommand({ restApiId, resourceId, httpMethod }))
}

export async function putIntegration(restApiId: string, resourceId: string, httpMethod: string, type: string, integrationHttpMethod: string, uri?: string): Promise<void> {
  const c = getClient()
  await c.send(new PutIntegrationCommand({ restApiId, resourceId, httpMethod, type: type as any, integrationHttpMethod, uri }))
}

// Deployments & Stages
export async function createDeployment(restApiId: string, stageName: string, description?: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreateDeploymentCommand({ restApiId, stageName, description }))
  return res.id || ''
}

export async function getStages(restApiId: string): Promise<ApigwStage[]> {
  const c = getClient()
  const res = await c.send(new GetStagesCommand({ restApiId }))
  return (res.item || []).map(s => ({
    stageName: s.stageName || '',
    deploymentId: s.deploymentId,
    createdDate: s.createdDate?.toISOString(),
    lastUpdatedDate: s.lastUpdatedDate?.toISOString()
  }))
}
