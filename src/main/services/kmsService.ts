import {
  KMSClient,
  ListKeysCommand,
  DescribeKeyCommand,
  ListAliasesCommand,
  CreateKeyCommand,
  ScheduleKeyDeletionCommand,
  CancelKeyDeletionCommand,
  EnableKeyCommand,
  DisableKeyCommand,
  CreateAliasCommand,
  EncryptCommand,
  DecryptCommand
} from '@aws-sdk/client-kms'

let client: KMSClient | null = null

export function reinitKmsClient(endpoint: string, region: string) {
  client = new KMSClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
}

function getClient(): KMSClient {
  if (!client) throw new Error('KMSClient not initialized')
  return client
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface KmsAlias {
  aliasName: string
  aliasArn: string
  targetKeyId: string
}

export interface KmsKey {
  keyId: string
  arn: string
  description?: string
  state: string
  creationDate?: string
  deletionDate?: string
  aliases: KmsAlias[]
}

// ── Keys & Aliases ────────────────────────────────────────────────────────────

export async function listKeysWithAliases(): Promise<KmsKey[]> {
  const c = getClient()
  
  // 1. Get all keys
  const keysRes = await c.send(new ListKeysCommand({}))
  const keyIds = (keysRes.Keys || []).map(k => k.KeyId).filter(Boolean) as string[]
  
  // 2. Describe each key (to get state, ARN, description)
  const fullKeys: Record<string, any> = {}
  for (const kid of keyIds) {
    try {
      const desc = await c.send(new DescribeKeyCommand({ KeyId: kid }))
      if (desc.KeyMetadata) {
        fullKeys[kid] = desc.KeyMetadata
      }
    } catch {
      // ignore deleted/unavailable keys
    }
  }

  // 3. Get Aliases
  const aliasRes = await c.send(new ListAliasesCommand({}))
  const allAliases = aliasRes.Aliases || []

  // 4. Assemble
  return Object.values(fullKeys).map(meta => {
    const kid = meta.KeyId as string
    const aliases = allAliases
      .filter(a => a.TargetKeyId === kid)
      .map(a => ({ aliasName: a.AliasName || '', aliasArn: a.AliasArn || '', targetKeyId: kid }))

    return {
      keyId: kid,
      arn: meta.Arn || '',
      description: meta.Description,
      state: meta.KeyState || 'Unknown',
      creationDate: meta.CreationDate?.toISOString(),
      deletionDate: meta.DeletionDate?.toISOString(),
      aliases
    } as KmsKey
  })
}

export async function createKey(description?: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new CreateKeyCommand({ Description: description }))
  return res.KeyMetadata?.KeyId || ''
}

export async function scheduleKeyDeletion(keyId: string, pendingWindowInDays: number = 7): Promise<void> {
  const c = getClient()
  await c.send(new ScheduleKeyDeletionCommand({ KeyId: keyId, PendingWindowInDays: pendingWindowInDays }))
}

export async function cancelKeyDeletion(keyId: string): Promise<void> {
  const c = getClient()
  await c.send(new CancelKeyDeletionCommand({ KeyId: keyId }))
}

export async function enableKey(keyId: string): Promise<void> {
  const c = getClient()
  await c.send(new EnableKeyCommand({ KeyId: keyId }))
}

export async function disableKey(keyId: string): Promise<void> {
  const c = getClient()
  await c.send(new DisableKeyCommand({ KeyId: keyId }))
}

export async function createAlias(aliasName: string, targetKeyId: string): Promise<void> {
  const c = getClient()
  await c.send(new CreateAliasCommand({
    AliasName: aliasName.startsWith('alias/') ? aliasName : `alias/${aliasName}`,
    TargetKeyId: targetKeyId
  }))
}

// ── Encrypt/Decrypt ──────────────────────────────────────────────────────────

export async function encryptData(keyId: string, plaintext: string): Promise<string> {
  const c = getClient()
  const val = new TextEncoder().encode(plaintext)
  const res = await c.send(new EncryptCommand({ KeyId: keyId, Plaintext: val }))
  return res.CiphertextBlob ? Buffer.from(res.CiphertextBlob).toString('base64') : ''
}

export async function decryptData(ciphertextBase64: string): Promise<string> {
  const c = getClient()
  const val = Buffer.from(ciphertextBase64, 'base64')
  const res = await c.send(new DecryptCommand({ CiphertextBlob: val }))
  return res.Plaintext ? new TextDecoder().decode(res.Plaintext) : ''
}
