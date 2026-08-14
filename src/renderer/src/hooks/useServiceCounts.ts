import { useCallback, useEffect, useRef, useState } from 'react'
import type { Service } from '../types'
import type { ServiceCounts } from '../shells/types'
import { SERVICE_COUNTS } from '../services/serviceCounts'
import { ALL_SERVICES_ORDERED } from '../services/serviceConfig'

/**
 * Resource counts for the shells' sidebars and service tables.
 *
 * Every direction shows these, so they are fetched once for the whole app rather
 * than per shell. Calls run in small batches: 31 list calls fired at once makes
 * LocalStack the bottleneck and stalls the launcher paint.
 */
export function useServiceCounts(refreshKey: number, enabled: boolean) {
  const [counts, setCounts] = useState<ServiceCounts>({})
  const runIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const runId = ++runIdRef.current
    const services = ALL_SERVICES_ORDERED
    const BATCH = 6
    for (let i = 0; i < services.length; i += BATCH) {
      if (runId !== runIdRef.current) return // superseded by a newer refresh
      const batch = services.slice(i, i + BATCH)
      const results = await Promise.all(
        batch.map(async svc => [svc, await SERVICE_COUNTS[svc].fetch()] as const)
      )
      if (runId !== runIdRef.current) return
      setCounts(prev => {
        const next = { ...prev }
        for (const [svc, n] of results) next[svc as Service] = n
        return next
      })
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void refresh()
  }, [enabled, refreshKey, refresh])

  return { counts, refreshCounts: refresh }
}
