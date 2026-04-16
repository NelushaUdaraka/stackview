import {
  Route53Client,
  ListHostedZonesCommand,
  GetHostedZoneCommand,
  CreateHostedZoneCommand,
  DeleteHostedZoneCommand,
  ListResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommand,
  ListHealthChecksCommand,
  CreateHealthCheckCommand,
  DeleteHealthCheckCommand,
  GetHealthCheckCommand,
  ChangeAction,
  RRType,
  type HostedZone,
  type ResourceRecordSet,
  type HealthCheck,
} from '@aws-sdk/client-route-53'

let client: Route53Client | null = null

export function initRoute53Client(endpoint: string, region: string): void {
  client = new Route53Client({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

function getClient(): Route53Client {
  if (!client) throw new Error('Route53 client not initialized')
  return client
}

// ── Hosted Zones ───────────────────────────────────────────────────────────────

export interface Route53HostedZone {
  Id: string
  Name: string
  CallerReference: string
  Config?: { Comment?: string; PrivateZone?: boolean }
  ResourceRecordSetCount?: number
}

export async function listHostedZones(): Promise<Route53HostedZone[]> {
  const c = getClient()
  const zones: Route53HostedZone[] = []
  let marker: string | undefined

  do {
    const result = await c.send(new ListHostedZonesCommand({ Marker: marker }))
    for (const z of result.HostedZones ?? []) {
      zones.push({
        Id: z.Id ?? '',
        Name: z.Name ?? '',
        CallerReference: z.CallerReference ?? '',
        Config: z.Config,
        ResourceRecordSetCount: z.ResourceRecordSetCount,
      })
    }
    marker = result.IsTruncated ? result.NextMarker : undefined
  } while (marker)

  return zones
}

export async function getHostedZone(zoneId: string): Promise<Route53HostedZone> {
  const c = getClient()
  const id = normalizeZoneId(zoneId)
  const result = await c.send(new GetHostedZoneCommand({ Id: id }))
  const z = result.HostedZone
  if (!z) throw new Error('Hosted zone not found')
  return {
    Id: z.Id ?? '',
    Name: z.Name ?? '',
    CallerReference: z.CallerReference ?? '',
    Config: z.Config,
    ResourceRecordSetCount: z.ResourceRecordSetCount,
  }
}

export async function createHostedZone(params: {
  name: string
  comment?: string
  privateZone?: boolean
}): Promise<Route53HostedZone> {
  const c = getClient()
  const ref = `stackview-${Date.now()}`
  const result = await c.send(
    new CreateHostedZoneCommand({
      Name: params.name,
      CallerReference: ref,
      HostedZoneConfig: {
        Comment: params.comment ?? '',
        PrivateZone: params.privateZone ?? false,
      },
    })
  )
  const z = result.HostedZone
  if (!z) throw new Error('Failed to create hosted zone')
  return {
    Id: z.Id ?? '',
    Name: z.Name ?? '',
    CallerReference: z.CallerReference ?? '',
    Config: z.Config,
    ResourceRecordSetCount: z.ResourceRecordSetCount,
  }
}

export async function deleteHostedZone(zoneId: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteHostedZoneCommand({ Id: normalizeZoneId(zoneId) }))
}

// ── Record Sets ────────────────────────────────────────────────────────────────

export interface Route53RecordSet {
  Name: string
  Type: string
  TTL?: number
  Records?: string[]
  AliasTarget?: { DNSName: string; EvaluateTargetHealth: boolean; HostedZoneId: string }
  SetIdentifier?: string
  Weight?: number
  Region?: string
  Failover?: string
}

export async function listRecordSets(zoneId: string): Promise<Route53RecordSet[]> {
  const c = getClient()
  const id = normalizeZoneId(zoneId)
  const records: Route53RecordSet[] = []
  let nextName: string | undefined
  let nextType: RRType | undefined

  do {
    const result = await c.send(
      new ListResourceRecordSetsCommand({
        HostedZoneId: id,
        StartRecordName: nextName,
        StartRecordType: nextType,
      })
    )
    for (const r of result.ResourceRecordSets ?? []) {
      records.push({
        Name: r.Name ?? '',
        Type: r.Type ?? '',
        TTL: r.TTL,
        Records: r.ResourceRecords?.map(rr => rr.Value ?? ''),
        AliasTarget: r.AliasTarget
          ? {
              DNSName: r.AliasTarget.DNSName ?? '',
              EvaluateTargetHealth: r.AliasTarget.EvaluateTargetHealth ?? false,
              HostedZoneId: r.AliasTarget.HostedZoneId ?? '',
            }
          : undefined,
        SetIdentifier: r.SetIdentifier,
        Weight: r.Weight,
      })
    }
    if (result.IsTruncated) {
      nextName = result.NextRecordName
      nextType = result.NextRecordType as RRType
    } else {
      nextName = undefined
      nextType = undefined
    }
  } while (nextName)

  return records
}

export async function createRecord(
  zoneId: string,
  record: Route53RecordSet
): Promise<void> {
  const c = getClient()
  await c.send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: normalizeZoneId(zoneId),
      ChangeBatch: {
        Changes: [
          {
            Action: ChangeAction.CREATE,
            ResourceRecordSet: buildRRS(record),
          },
        ],
      },
    })
  )
}

export async function upsertRecord(
  zoneId: string,
  record: Route53RecordSet
): Promise<void> {
  const c = getClient()
  await c.send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: normalizeZoneId(zoneId),
      ChangeBatch: {
        Changes: [
          {
            Action: ChangeAction.UPSERT,
            ResourceRecordSet: buildRRS(record),
          },
        ],
      },
    })
  )
}

export async function deleteRecord(
  zoneId: string,
  record: Route53RecordSet
): Promise<void> {
  const c = getClient()
  await c.send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: normalizeZoneId(zoneId),
      ChangeBatch: {
        Changes: [
          {
            Action: ChangeAction.DELETE,
            ResourceRecordSet: buildRRS(record),
          },
        ],
      },
    })
  )
}

// ── Health Checks ──────────────────────────────────────────────────────────────

export interface Route53HealthCheck {
  Id: string
  CallerReference: string
  HealthCheckConfig?: {
    IPAddress?: string
    Port?: number
    Type?: string
    ResourcePath?: string
    FullyQualifiedDomainName?: string
    RequestInterval?: number
    FailureThreshold?: number
  }
  HealthCheckVersion?: number
}

export async function listHealthChecks(): Promise<Route53HealthCheck[]> {
  const c = getClient()
  const checks: Route53HealthCheck[] = []
  let marker: string | undefined

  do {
    const result = await c.send(new ListHealthChecksCommand({ Marker: marker }))
    for (const h of result.HealthChecks ?? []) {
      checks.push({
        Id: h.Id ?? '',
        CallerReference: h.CallerReference ?? '',
        HealthCheckConfig: h.HealthCheckConfig,
        HealthCheckVersion: h.HealthCheckVersion,
      })
    }
    marker = result.IsTruncated ? result.NextMarker : undefined
  } while (marker)

  return checks
}

export async function getHealthCheck(checkId: string): Promise<Route53HealthCheck> {
  const c = getClient()
  const result = await c.send(new GetHealthCheckCommand({ HealthCheckId: checkId }))
  const h = result.HealthCheck
  if (!h) throw new Error('Health check not found')
  return {
    Id: h.Id ?? '',
    CallerReference: h.CallerReference ?? '',
    HealthCheckConfig: h.HealthCheckConfig,
    HealthCheckVersion: h.HealthCheckVersion,
  }
}

export async function createHealthCheck(params: {
  type: string
  ipAddress?: string
  port?: number
  resourcePath?: string
  fqdn?: string
  requestInterval?: number
  failureThreshold?: number
}): Promise<Route53HealthCheck> {
  const c = getClient()
  const ref = `stackview-hc-${Date.now()}`
  const result = await c.send(
    new CreateHealthCheckCommand({
      CallerReference: ref,
      HealthCheckConfig: {
        Type: params.type as any,
        IPAddress: params.ipAddress,
        Port: params.port,
        ResourcePath: params.resourcePath,
        FullyQualifiedDomainName: params.fqdn,
        RequestInterval: params.requestInterval ?? 30,
        FailureThreshold: params.failureThreshold ?? 3,
      },
    })
  )
  const h = result.HealthCheck
  if (!h) throw new Error('Failed to create health check')
  return {
    Id: h.Id ?? '',
    CallerReference: h.CallerReference ?? '',
    HealthCheckConfig: h.HealthCheckConfig,
    HealthCheckVersion: h.HealthCheckVersion,
  }
}

export async function deleteHealthCheck(checkId: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteHealthCheckCommand({ HealthCheckId: checkId }))
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeZoneId(id: string): string {
  // Strip /hostedzone/ prefix if present
  return id.replace(/^\/hostedzone\//, '')
}

function buildRRS(record: Route53RecordSet): ResourceRecordSet {
  const rrs: ResourceRecordSet = {
    Name: record.Name,
    Type: record.Type as RRType,
  }
  if (record.AliasTarget) {
    rrs.AliasTarget = {
      DNSName: record.AliasTarget.DNSName,
      EvaluateTargetHealth: record.AliasTarget.EvaluateTargetHealth,
      HostedZoneId: record.AliasTarget.HostedZoneId,
    }
  } else {
    rrs.TTL = record.TTL ?? 300
    rrs.ResourceRecords = (record.Records ?? []).map(v => ({ Value: v }))
  }
  if (record.SetIdentifier) rrs.SetIdentifier = record.SetIdentifier
  if (record.Weight !== undefined) rrs.Weight = record.Weight
  return rrs
}
