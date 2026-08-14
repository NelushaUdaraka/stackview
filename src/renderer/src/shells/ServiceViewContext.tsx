import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ServiceViewData } from './types'

interface Store {
  data: ServiceViewData
  publish: (id: string, d: ServiceViewData | null) => void
}

const ServiceViewContext = createContext<Store>({ data: {}, publish: () => {} })

/**
 * Lets a per-service detail component describe its current selection to whichever
 * shell is mounted, without knowing which shell that is. Slate Split renders it as a
 * docked inspector, Terminal as a preview pane and status line, Console as stat tiles
 * — all from the same published data.
 */
export function ServiceViewProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ServiceViewData>({})
  // Last writer wins, but a component may only clear its own entry — so a detail
  // unmounting after its replacement mounted cannot blank the new one.
  const ownerRef = useRef<string | null>(null)

  const store = useMemo<Store>(() => ({
    data,
    publish: (id, d) => {
      if (d === null) {
        if (ownerRef.current !== id) return
        ownerRef.current = null
        setData({})
        return
      }
      ownerRef.current = id
      setData(d)
    },
  }), [data])

  return <ServiceViewContext.Provider value={store}>{children}</ServiceViewContext.Provider>
}

/** Read the active service view — used by shells. */
export function useServiceViewData(): ServiceViewData {
  return useContext(ServiceViewContext).data
}

/**
 * Publish the active service view — used by per-service detail components.
 * Pass `null` while nothing is selected.
 */
export function useServiceView(data: ServiceViewData | null) {
  const { publish } = useContext(ServiceViewContext)
  const idRef = useRef<string>()
  if (!idRef.current) idRef.current = Math.random().toString(36).slice(2)
  const id = idRef.current

  // Serialise so a fresh object literal on every render does not loop.
  const key = JSON.stringify(data ?? null)
  useEffect(() => {
    publish(id, data)
    return () => publish(id, null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, id])
}
