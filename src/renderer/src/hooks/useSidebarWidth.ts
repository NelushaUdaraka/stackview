import { useState, useEffect } from 'react'

const SIDEBAR_STORAGE_KEY = 'stackview:sidebar_width'
const SIDEBAR_DEFAULT = 240

export function useSidebarWidth() {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return saved ? parseInt(saved, 10) : SIDEBAR_DEFAULT
  })

  const setSidebarWidth = (newWidth: number) => {
    setWidth(newWidth)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, newWidth.toString())
  }

  return [width, setSidebarWidth] as const
}
