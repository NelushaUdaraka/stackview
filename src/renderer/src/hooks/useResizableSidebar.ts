import { useRef, useEffect } from 'react'
import { useSidebarWidth } from './useSidebarWidth'

interface Options {
  min?: number
  max?: number
}

/**
 * Encapsulates the resizable sidebar drag logic shared across all service layouts.
 * Composes with useSidebarWidth for persistence.
 */
export function useResizableSidebar({ min = 200, max = 480 }: Options = {}) {
  const [sidebarWidth, setSidebarWidth] = useSidebarWidth()
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(sidebarWidth)

  // Keep a stable ref to setSidebarWidth to avoid stale closures in the effect
  const setWidthRef = useRef(setSidebarWidth)
  setWidthRef.current = setSidebarWidth

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const delta = e.clientX - startX.current
      setWidthRef.current(Math.min(max, Math.max(min, startWidth.current + delta)))
    }
    const onMouseUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [min, max])

  return { sidebarWidth, handleResizeStart }
}
