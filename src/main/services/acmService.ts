import {
  ACMClient,
  ListCertificatesCommand,
  DescribeCertificateCommand,
  RequestCertificateCommand,
  DeleteCertificateCommand,
  ImportCertificateCommand,
  GetCertificateCommand,
  AddTagsToCertificateCommand,
  ListTagsForCertificateCommand,
  RenewCertificateCommand,
  type CertificateSummary,
  type CertificateDetail,
  type Tag,
} from '@aws-sdk/client-acm'

let client: ACMClient | null = null

export function reinitAcmClient(endpoint: string, region: string) {
  client = new ACMClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
}

function getClient(): ACMClient {
  if (!client) throw new Error('ACMClient not initialized')
  return client
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AcmCertificate {
  CertificateArn: string
  DomainName: string
  SubjectAlternativeNames?: string[]
  Status?: string
  Type?: string
  KeyAlgorithm?: string
  SignatureAlgorithm?: string
  InUseBy?: string[]
  IssuedAt?: string
  CreatedAt?: string
  NotBefore?: string
  NotAfter?: string
  Serial?: string
  Subject?: string
  Issuer?: string
  RenewalEligibility?: string
  DomainValidationOptions?: AcmDomainValidation[]
  Tags?: AcmTag[]
}

export interface AcmDomainValidation {
  DomainName: string
  ValidationStatus?: string
  ValidationMethod?: string
  ResourceRecord?: {
    Name: string
    Type: string
    Value: string
  }
}

export interface AcmTag {
  Key: string
  Value?: string
}

export interface RequestCertificateParams {
  domainName: string
  subjectAlternativeNames?: string[]
  validationMethod?: 'DNS' | 'EMAIL'
  tags?: AcmTag[]
}

export interface ImportCertificateParams {
  certificate: string
  privateKey: string
  certificateChain?: string
  existingArn?: string
}

// ── List / Describe ───────────────────────────────────────────────────────────

export async function listCertificates(): Promise<AcmCertificate[]> {
  const c = getClient()
  const summaries: CertificateSummary[] = []

  let nextToken: string | undefined
  do {
    const res = await c.send(new ListCertificatesCommand({ NextToken: nextToken, MaxItems: 100 }))
    summaries.push(...(res.CertificateSummaryList || []))
    nextToken = res.NextToken
  } while (nextToken)

  const results: AcmCertificate[] = []
  for (const s of summaries) {
    if (!s.CertificateArn) continue
    try {
      const detail = await describeCertificate(s.CertificateArn)
      results.push(detail)
    } catch {
      // Return minimal info if describe fails
      results.push({
        CertificateArn: s.CertificateArn,
        DomainName: s.DomainName || '',
        Status: s.Status,
      })
    }
  }
  return results
}

export async function describeCertificate(arn: string): Promise<AcmCertificate> {
  const c = getClient()
  const res = await c.send(new DescribeCertificateCommand({ CertificateArn: arn }))
  const d: CertificateDetail = res.Certificate || {}

  let tags: AcmTag[] | undefined
  try {
    tags = await listTagsForCertificate(arn)
  } catch {
    tags = []
  }

  return {
    CertificateArn: d.CertificateArn || arn,
    DomainName: d.DomainName || '',
    SubjectAlternativeNames: d.SubjectAlternativeNames,
    Status: d.Status,
    Type: d.Type,
    KeyAlgorithm: d.KeyAlgorithm,
    SignatureAlgorithm: d.SignatureAlgorithm,
    InUseBy: d.InUseBy,
    IssuedAt: d.IssuedAt?.toISOString(),
    CreatedAt: d.CreatedAt?.toISOString(),
    NotBefore: d.NotBefore?.toISOString(),
    NotAfter: d.NotAfter?.toISOString(),
    Serial: d.Serial,
    Subject: d.Subject,
    Issuer: d.Issuer,
    RenewalEligibility: d.RenewalEligibility,
    DomainValidationOptions: (d.DomainValidationOptions || []).map(v => ({
      DomainName: v.DomainName || '',
      ValidationStatus: v.ValidationStatus,
      ValidationMethod: v.ValidationMethod,
      ResourceRecord: v.ResourceRecord ? {
        Name: v.ResourceRecord.Name || '',
        Type: v.ResourceRecord.Type || '',
        Value: v.ResourceRecord.Value || '',
      } : undefined,
    })),
    Tags: tags,
  }
}

// ── Request / Import ──────────────────────────────────────────────────────────

export async function requestCertificate(params: RequestCertificateParams): Promise<string> {
  const c = getClient()
  const res = await c.send(new RequestCertificateCommand({
    DomainName: params.domainName,
    SubjectAlternativeNames: params.subjectAlternativeNames?.length ? params.subjectAlternativeNames : undefined,
    ValidationMethod: params.validationMethod ?? 'DNS',
    Tags: params.tags?.map(t => ({ Key: t.Key, Value: t.Value })),
  }))
  return res.CertificateArn || ''
}

export async function importCertificate(params: ImportCertificateParams): Promise<string> {
  const c = getClient()
  const res = await c.send(new ImportCertificateCommand({
    CertificateArn: params.existingArn,
    Certificate: Buffer.from(params.certificate),
    PrivateKey: Buffer.from(params.privateKey),
    CertificateChain: params.certificateChain ? Buffer.from(params.certificateChain) : undefined,
  }))
  return res.CertificateArn || ''
}

// ── Get Certificate PEM ───────────────────────────────────────────────────────

export async function getCertificatePem(arn: string): Promise<{ certificate: string; certificateChain?: string }> {
  const c = getClient()
  const res = await c.send(new GetCertificateCommand({ CertificateArn: arn }))
  return {
    certificate: res.Certificate || '',
    certificateChain: res.CertificateChain,
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCertificate(arn: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteCertificateCommand({ CertificateArn: arn }))
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function listTagsForCertificate(arn: string): Promise<AcmTag[]> {
  const c = getClient()
  const res = await c.send(new ListTagsForCertificateCommand({ CertificateArn: arn }))
  return (res.Tags || []).map(t => ({ Key: t.Key || '', Value: t.Value }))
}

export async function addTagsToCertificate(arn: string, tags: AcmTag[]): Promise<void> {
  const c = getClient()
  await c.send(new AddTagsToCertificateCommand({
    CertificateArn: arn,
    Tags: tags.map(t => ({ Key: t.Key, Value: t.Value })),
  }))
}

// ── Renew ─────────────────────────────────────────────────────────────────────

export async function renewCertificate(arn: string): Promise<void> {
  const c = getClient()
  await c.send(new RenewCertificateCommand({ CertificateArn: arn }))
}
