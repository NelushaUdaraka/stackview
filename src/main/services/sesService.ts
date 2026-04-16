import {
  SESClient,
  ListIdentitiesCommand,
  VerifyEmailIdentityCommand,
  VerifyDomainIdentityCommand,
  DeleteIdentityCommand,
  GetIdentityVerificationAttributesCommand,
  SendEmailCommand,
} from '@aws-sdk/client-ses'

let client: SESClient | null = null

export function reinitSesClient(endpoint: string, region: string) {
  client = new SESClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
}

function getClient(): SESClient {
  if (!client) throw new Error('SESClient not initialized')
  return client
}

// ── Identities ───────────────────────────────────────────────────────────────

export interface SesIdentity {
  name: string
  type: 'Email' | 'Domain' | 'Unknown'
  verificationStatus: string
}

export async function listIdentities(): Promise<SesIdentity[]> {
  const c = getClient()
  const res = await c.send(new ListIdentitiesCommand({}))
  const identities = res.Identities || []

  if (identities.length === 0) return []

  // Batch get verification attributes
  const attrRes = await c.send(new GetIdentityVerificationAttributesCommand({ Identities: identities }))
  const attrs = attrRes.VerificationAttributes || {}

  return identities.map(id => ({
    name: id,
    type: id.includes('@') ? 'Email' : 'Domain',
    verificationStatus: attrs[id]?.VerificationStatus || 'Pending'
  }))
}

export async function verifyEmailIdentity(email: string): Promise<void> {
  const c = getClient()
  await c.send(new VerifyEmailIdentityCommand({ EmailAddress: email }))
}

export async function verifyDomainIdentity(domain: string): Promise<string> {
  const c = getClient()
  const res = await c.send(new VerifyDomainIdentityCommand({ Domain: domain }))
  return res.VerificationToken || ''
}

export async function deleteIdentity(identity: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteIdentityCommand({ Identity: identity }))
}

// ── Sending ───────────────────────────────────────────────────────────────────

export interface SendEmailParams {
  source: string
  toAddresses: string[]
  ccAddresses?: string[]
  bccAddresses?: string[]
  subject: string
  bodyText?: string
  bodyHtml?: string
}

export async function sendEmail(params: SendEmailParams): Promise<string> {
  const c = getClient()
  const res = await c.send(new SendEmailCommand({
    Source: params.source,
    Destination: {
      ToAddresses: params.toAddresses,
      CcAddresses: params.ccAddresses,
      BccAddresses: params.bccAddresses,
    },
    Message: {
      Subject: { Data: params.subject, Charset: 'UTF-8' },
      Body: {
        ...(params.bodyText ? { Text: { Data: params.bodyText, Charset: 'UTF-8' } } : {}),
        ...(params.bodyHtml ? { Html: { Data: params.bodyHtml, Charset: 'UTF-8' } } : {}),
      }
    }
  }))
  return res.MessageId || ''
}
