import {
  SupportClient,
  CreateCaseCommand,
  DescribeCasesCommand,
  ResolveCaseCommand,
  DescribeTrustedAdvisorChecksCommand,
  RefreshTrustedAdvisorCheckCommand,
} from '@aws-sdk/client-support'
import type { SupportCase, TrustedAdvisorCheck } from '../../shared/types'

let supportClient: SupportClient | null = null

export function initSupportClient(endpoint: string, _region: string): void {
  supportClient = new SupportClient({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

export function getSupportClient(): SupportClient {
  if (!supportClient) throw new Error('Support client not initialized')
  return supportClient
}

export async function describeCases(
  includeResolvedCases = false,
  caseIdList?: string[]
): Promise<SupportCase[]> {
  const client = getSupportClient()
  const cases: SupportCase[] = []
  let nextToken: string | undefined

  do {
    const result = await client.send(
      new DescribeCasesCommand({
        includeResolvedCases,
        caseIdList: caseIdList && caseIdList.length > 0 ? caseIdList : undefined,
        nextToken,
        maxResults: 100,
      })
    )
    for (const c of result.cases ?? []) {
      cases.push({
        caseId: c.caseId ?? '',
        displayId: c.displayId,
        subject: c.subject ?? '',
        status: c.status,
        serviceCode: c.serviceCode,
        categoryCode: c.categoryCode,
        severityCode: c.severityCode,
        submittedBy: c.submittedBy,
        timeCreated: c.timeCreated,
        language: c.language,
      })
    }
    nextToken = result.nextToken
  } while (nextToken)

  return cases
}

export async function createCase(
  subject: string,
  communicationBody: string,
  serviceCode?: string,
  severityCode?: string,
  categoryCode?: string,
  language?: string
): Promise<string> {
  const client = getSupportClient()
  const result = await client.send(
    new CreateCaseCommand({
      subject,
      communicationBody,
      serviceCode: serviceCode || undefined,
      severityCode: severityCode || undefined,
      categoryCode: categoryCode || undefined,
      language: language || 'en',
    })
  )
  return result.caseId ?? ''
}

export async function resolveCase(caseId: string): Promise<string> {
  const client = getSupportClient()
  const result = await client.send(new ResolveCaseCommand({ caseId }))
  return result.finalCaseStatus ?? ''
}

export async function describeTrustedAdvisorChecks(
  language = 'en'
): Promise<TrustedAdvisorCheck[]> {
  const client = getSupportClient()
  const result = await client.send(
    new DescribeTrustedAdvisorChecksCommand({ language })
  )
  return (result.checks ?? []).map((c) => ({
    id: c.id ?? '',
    name: c.name ?? '',
    description: c.description ?? '',
    category: c.category ?? '',
    metadata: c.metadata ?? [],
  }))
}

export async function refreshTrustedAdvisorCheck(checkId: string): Promise<string> {
  const client = getSupportClient()
  const result = await client.send(
    new RefreshTrustedAdvisorCheckCommand({ checkId })
  )
  return result.status?.status ?? ''
}
