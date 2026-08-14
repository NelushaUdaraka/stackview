import { useEffect, useRef, useState } from 'react'
import type { Service } from '../types'
import type { ServiceCounts } from '../shells/types'
import { ALL_SERVICES_ORDERED } from '../services/serviceConfig'

const SAMPLES = 24

/**
 * A short in-memory history of each service's resource count, feeding the Signal
 * board's sparklines.
 *
 * Deliberately derived from counts the app already fetches rather than new AWS
 * calls — the design's brief for this direction is "you see what's moving before you
 * click anything", not a metrics backend. History lives only for the session.
 */
export function useCountHistory(counts: ServiceCounts, enabled: boolean) {
  const [history, setHistory] = useState<Partial<Record<Service, number[]>>>({})
  const countsRef = useRef(counts)
  countsRef.current = counts

  useEffect(() => {
    if (!enabled) return
    const sample = () => {
      setHistory(prev => {
        const next: Partial<Record<Service, number[]>> = { ...prev }
        for (const svc of ALL_SERVICES_ORDERED) {
          const v = countsRef.current[svc]
          if (v == null) continue
          const arr = next[svc] ? [...next[svc]!, v] : [v]
          next[svc] = arr.length > SAMPLES ? arr.slice(-SAMPLES) : arr
        }
        return next
      })
    }
    sample()
    const id = setInterval(sample, 4000)
    return () => clearInterval(id)
  }, [enabled])

  return history
}

/** Pads a series so a sparkline has a stable width before enough samples exist. */
export function padSeries(values: number[] | undefined, min = 12): number[] {
  if (!values || values.length === 0) return []
  if (values.length >= min) return values
  return [...Array(min - values.length).fill(values[0]), ...values]
}
