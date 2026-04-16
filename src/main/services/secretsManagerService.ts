import {
  SecretsManagerClient,
  ListSecretsCommand,
  CreateSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  DeleteSecretCommand
} from '@aws-sdk/client-secrets-manager'

let secretsClient: SecretsManagerClient | null = null

export function initSecretsManagerClient(endpoint: string, region: string): void {
  secretsClient = new SecretsManagerClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
}

export function getSecretsClient(): SecretsManagerClient {
  if (!secretsClient) throw new Error('Secrets Manager client not initialized')
  return secretsClient
}

export interface SecretInfo {
  name: string
  arn?: string
  description?: string
  createdDate?: string
}

export interface SecretValue {
  arn?: string
  name?: string
  secretString?: string
  secretBinary?: Uint8Array
  createdDate?: string
}

export async function listSecrets(): Promise<SecretInfo[]> {
  const client = getSecretsClient()
  const result = await client.send(new ListSecretsCommand({}))
  return (result.SecretList ?? []).map((s) => ({
    name: s.Name!,
    arn: s.ARN,
    description: s.Description,
    createdDate: s.CreatedDate?.toISOString()
  }))
}

export async function createSecret(name: string, description: string, secretString: string): Promise<void> {
  const client = getSecretsClient()
  await client.send(new CreateSecretCommand({
    Name: name,
    Description: description || undefined,
    SecretString: secretString
  }))
}

export async function getSecretValue(secretId: string): Promise<SecretValue> {
  const client = getSecretsClient()
  const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }))
  return {
    arn: result.ARN,
    name: result.Name,
    secretString: result.SecretString,
    secretBinary: result.SecretBinary,
    createdDate: result.CreatedDate?.toISOString()
  }
}

export async function putSecretValue(secretId: string, secretString: string): Promise<void> {
  const client = getSecretsClient()
  await client.send(new PutSecretValueCommand({
    SecretId: secretId,
    SecretString: secretString
  }))
}

export async function deleteSecret(secretId: string): Promise<void> {
  const client = getSecretsClient()
  await client.send(new DeleteSecretCommand({
    SecretId: secretId,
    ForceDeleteWithoutRecovery: true
  }))
}
