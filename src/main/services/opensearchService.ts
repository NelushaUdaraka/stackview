import {
  OpenSearchClient,
  ListDomainNamesCommand,
  DescribeDomainCommand,
  CreateDomainCommand,
  DeleteDomainCommand,
} from '@aws-sdk/client-opensearch'

let osClient: OpenSearchClient | null = null

function getClient(endpoint: string, region: string): OpenSearchClient {
  if (!osClient) {
    osClient = new OpenSearchClient({
      endpoint,
      region,
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
      tls: false,
    })
  }
  return osClient
}

export const opensearchReinit = (endpoint: string, region: string): void => {
  osClient = new OpenSearchClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    tls: false,
  })
}

// ── Control Plane (AWS SDK) ──────────────────────────────────────────────────

export const opensearchListDomains = async (endpoint: string, region: string) => {
  try {
    const client = getClient(endpoint, region)
    const res = await client.send(new ListDomainNamesCommand({}))
    const names = (res.DomainNames ?? []).map((d) => d.DomainName ?? '')
    return { success: true, data: names.filter(Boolean) }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchDescribeDomain = async (endpoint: string, region: string, domainName: string) => {
  try {
    const client = getClient(endpoint, region)
    const res = await client.send(new DescribeDomainCommand({ DomainName: domainName }))
    const status = res.DomainStatus
    if (!status) return { success: false, error: 'No domain status returned' }

    // LocalStack exposes the data plane at http://<domain>.<region>.es.localhost.localstack.cloud:4566
    // but also sets Endpoint or Endpoints in DescribeDomain. Use whichever is available.
    let domainEndpoint =
      status.Endpoint ??
      (status.Endpoints ? Object.values(status.Endpoints)[0] : undefined)

    if (!domainEndpoint) {
      // Fallback: derive a domain-specific endpoint from the control-plane base URL
      const baseUrl = new URL(endpoint)
      domainEndpoint = `${baseUrl.protocol}//${domainName}.${region}.es.${baseUrl.host}`
    } else {
      if (!domainEndpoint.startsWith('http')) {
        domainEndpoint = `http://${domainEndpoint}`
      }
      // LocalStack often returns a generic base URL (e.g. localhost.localstack.cloud:4566)
      // that lacks the domain-specific subdomain needed for OpenSearch REST routing.
      // If the domain name isn't in the hostname, prepend it.
      try {
        const parsed = new URL(domainEndpoint)
        if (!parsed.hostname.includes(domainName)) {
          domainEndpoint = `${parsed.protocol}//${domainName}.${region}.es.${parsed.host}`
        }
      } catch {
        // keep as-is
      }
    }

    return {
      success: true,
      data: {
        name: status.DomainName ?? domainName,
        arn: status.ARN,
        status: status.Processing ? 'Processing' : status.Created ? 'Active' : 'Creating',
        endpoint: domainEndpoint,
        engineVersion: status.EngineVersion,
        clusterConfig: status.ClusterConfig,
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchCreateDomain = async (
  endpoint: string,
  region: string,
  params: { domainName: string; engineVersion?: string; instanceType?: string; instanceCount?: number }
) => {
  try {
    const client = getClient(endpoint, region)
    await client.send(
      new CreateDomainCommand({
        DomainName: params.domainName,
        EngineVersion: params.engineVersion ?? 'OpenSearch_2.11',
        ClusterConfig: {
          InstanceType: (params.instanceType as any) ?? 't3.small.search',
          InstanceCount: params.instanceCount ?? 1,
        },
      })
    )
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchDeleteDomain = async (endpoint: string, region: string, domainName: string) => {
  try {
    const client = getClient(endpoint, region)
    await client.send(new DeleteDomainCommand({ DomainName: domainName }))
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ── Data Plane (direct HTTP to OpenSearch REST API) ──────────────────────────

async function osRequest(
  domainEndpoint: string,
  method: string,
  path: string,
  body?: unknown
): Promise<any> {
  const url = `${domainEndpoint.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) }
  } catch {
    return { ok: res.ok, status: res.status, data: text }
  }
}

export const opensearchGetClusterHealth = async (domainEndpoint: string) => {
  const path = '/_cluster/health'
  try {
    const r = await osRequest(domainEndpoint, 'GET', path)
    if (!r.ok) return { success: false, error: `HTTP ${r.status} — ${domainEndpoint}${path}` }
    return { success: true, data: r.data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchListIndices = async (domainEndpoint: string) => {
  const path = '/_cat/indices?format=json&v=true&s=index'
  try {
    const r = await osRequest(domainEndpoint, 'GET', path)
    if (!r.ok) return { success: false, error: `HTTP ${r.status} — ${domainEndpoint}${path}` }
    return { success: true, data: r.data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchCreateIndex = async (
  domainEndpoint: string,
  indexName: string,
  settings?: object
) => {
  try {
    const r = await osRequest(domainEndpoint, 'PUT', `/${encodeURIComponent(indexName)}`, settings ?? {})
    if (!r.ok) return { success: false, error: r.data?.error?.reason ?? `HTTP ${r.status}` }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchDeleteIndex = async (domainEndpoint: string, indexName: string) => {
  try {
    const r = await osRequest(domainEndpoint, 'DELETE', `/${encodeURIComponent(indexName)}`)
    if (!r.ok) return { success: false, error: r.data?.error?.reason ?? `HTTP ${r.status}` }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchGetMapping = async (domainEndpoint: string, indexName: string) => {
  try {
    const r = await osRequest(domainEndpoint, 'GET', `/${encodeURIComponent(indexName)}/_mapping`)
    if (!r.ok) return { success: false, error: `HTTP ${r.status}` }
    return { success: true, data: r.data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchSearchDocuments = async (
  domainEndpoint: string,
  indexName: string,
  query: object,
  size: number = 20
) => {
  try {
    const body = { size, ...query }
    const r = await osRequest(domainEndpoint, 'POST', `/${encodeURIComponent(indexName)}/_search`, body)
    if (!r.ok) return { success: false, error: r.data?.error?.reason ?? `HTTP ${r.status}` }
    return { success: true, data: r.data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchIndexDocument = async (
  domainEndpoint: string,
  indexName: string,
  document: object,
  docId?: string
) => {
  try {
    const path = docId
      ? `/${encodeURIComponent(indexName)}/_doc/${encodeURIComponent(docId)}`
      : `/${encodeURIComponent(indexName)}/_doc`
    const method = docId ? 'PUT' : 'POST'
    const r = await osRequest(domainEndpoint, method, path, document)
    if (!r.ok) return { success: false, error: r.data?.error?.reason ?? `HTTP ${r.status}` }
    return { success: true, data: r.data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const opensearchDeleteDocument = async (
  domainEndpoint: string,
  indexName: string,
  docId: string
) => {
  try {
    const r = await osRequest(
      domainEndpoint,
      'DELETE',
      `/${encodeURIComponent(indexName)}/_doc/${encodeURIComponent(docId)}`
    )
    if (!r.ok) return { success: false, error: r.data?.error?.reason ?? `HTTP ${r.status}` }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
