import { useState, useCallback, useRef } from 'react'

export interface Toast {
  id: number
  type: 'success' | 'error'
  text: string
  duration: number
}

/**
 * Manages a toast notification queue with auto-dismiss.
 * Returns the current toast list and a stable showToast callback.
 */
export function useToast(duration = 4000) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    const id = ++nextId.current
    setToasts(prev => [...prev, { id, type, text, duration }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [duration])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, showToast, dismissToast }
}
