import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { Plus, X, Minus, Square, Copy, LayoutGrid } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppTab, Service } from '../../types'
import { SERVICE_CONFIG } from '../../services/serviceConfig'

const isWindows = window.electronAPI.platform === 'win32'

interface Props {
  tabs: AppTab[]
  activeTabId: string | null
  onSwitch: (id: string) => void
  onClose: (id: string) => void
  onNew: () => void
  onOpenInNewTab: (svc: Service) => void
  onReorder: (tabs: AppTab[]) => void
  /** Opens the application menu anchored under the brand button. */
  onOpenMenu: () => void
  menuOpen: boolean
}

interface DragCloneInfo {
  y: number
  width: number
  height: number
  label: string
  color: string
  IconComponent: LucideIcon
}

/**
 * The 36px window chrome: brand/menu button, the tab strip, and — on Windows,
 * where the frame is drawn by the app rather than the OS — the window controls.
 *
 * The active tab drops its bottom rule and takes the content background so the
 * tab and the surface beneath it read as one continuous plane.
 */
export default function TitleBar({
  tabs,
  activeTabId,
  onSwitch,
  onClose,
  onNew,
  onOpenInNewTab,
  onReorder,
  onOpenMenu,
  menuOpen,
}: Props) {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null)
  const [dragTabId, setDragTabId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [dragMouseX, setDragMouseX] = useState(0)
  const [dragCloneInfo, setDragCloneInfo] = useState<DragCloneInfo | null>(null)
  const [maximized, setMaximized] = useState(false)

  const cardElRefs = useRef<Map<string, HTMLElement>>(new Map())
  const prevPositions = useRef<Map<string, DOMRect>>(new Map())
  const tabsAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeTabId) return
    cardElRefs.current.get(activeTabId)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeTabId])

  useEffect(() => {
    window.electronAPI.isMaximized().then(setMaximized)
  }, [])

  useEffect(() => {
    if (!dragTabId) return
    const onMove = (e: DragEvent) => setDragMouseX(e.clientX)
    document.addEventListener('dragover', onMove)
    return () => document.removeEventListener('dragover', onMove)
  }, [dragTabId])

  const previewTabs = useMemo(() => {
    if (!dragTabId || dropIndex === null) return tabs
    const srcIdx = tabs.findIndex(t => t.id === dragTabId)
    if (srcIdx === -1 || dropIndex === srcIdx || dropIndex === srcIdx + 1) return tabs
    const next = [...tabs]
    const [moved] = next.splice(srcIdx, 1)
    next.splice(dropIndex > srcIdx ? dropIndex - 1 : dropIndex, 0, moved)
    return next
  }, [tabs, dragTabId, dropIndex])

  // FLIP: animate tabs from their old positions to the new ones as the drop
  // target moves, so reordering reads as motion rather than a jump.
  useLayoutEffect(() => {
    if (!dragTabId || dropIndex === null) return
    const newPositions = new Map<string, DOMRect>()
    cardElRefs.current.forEach((el, id) => {
      if (el) newPositions.set(id, el.getBoundingClientRect())
    })
    cardElRefs.current.forEach((el, id) => {
      if (!el) return
      const oldPos = prevPositions.current.get(id)
      const newPos = newPositions.get(id)
      if (!oldPos || !newPos) return
      const dx = oldPos.left - newPos.left
      const dy = oldPos.top - newPos.top
      if (dx === 0 && dy === 0) return
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)'
          el.style.transform = ''
        })
      })
    })
  }, [dropIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const commitReorder = (srcId: string, target: number) => {
    const srcIdx = tabs.findIndex(t => t.id === srcId)
    if (srcIdx === -1 || target === srcIdx || target === srcIdx + 1) return
    const next = [...tabs]
    const [moved] = next.splice(srcIdx, 1)
    next.splice(target > srcIdx ? target - 1 : target, 0, moved)
    onReorder(next)
  }

  const clearDragTransforms = () => {
    cardElRefs.current.forEach(el => {
      if (el) {
        el.style.transform = ''
        el.style.transition = ''
      }
    })
  }

  return (
    <div
      className="drag-region shrink-0 flex items-stretch relative surface-panel border-b border-theme"
      style={{ height: 'var(--titlebar-h)' }}
    >
      {/* Brand / menu */}
      <button
        onClick={onOpenMenu}
        className="no-drag w-11 shrink-0 flex items-center justify-center border-r border-theme transition-colors hover:bg-raised"
        style={{ backgroundColor: menuOpen ? 'rgb(var(--bg-raised))' : undefined }}
        title="Menu"
      >
        <span
          className="block w-[15px] h-[15px] rounded"
          style={{ backgroundColor: 'rgb(var(--accent))' }}
        />
      </button>

      {/* Tabs */}
      <div className="flex-1 min-w-0 flex items-stretch overflow-hidden">
        <div
          ref={tabsAreaRef}
          className="flex items-stretch min-w-0 scrollbar-none"
          style={{ flex: '1 1 0', overflowX: 'auto' }}
          onDragOver={e => {
            if (
              e.dataTransfer.types.includes('stackview/tab') ||
              e.dataTransfer.types.includes('stackview/service')
            ) {
              e.preventDefault()
            }
            if (!dragTabId || !dragCloneInfo) return
            let hoveredIdx = -1
            for (let i = 0; i < previewTabs.length; i++) {
              const el = cardElRefs.current.get(previewTabs[i].id)
              if (!el) continue
              const { left, right } = el.getBoundingClientRect()
              if (e.clientX >= left && e.clientX < right) {
                hoveredIdx = i
                break
              }
            }
            const previewSrcIdx = previewTabs.findIndex(t => t.id === dragTabId)
            if (hoveredIdx === previewSrcIdx) return
            let newDrop: number
            if (hoveredIdx === -1) {
              const lastEl = cardElRefs.current.get(previewTabs[previewTabs.length - 1]?.id)
              newDrop = lastEl && e.clientX > lastEl.getBoundingClientRect().right ? previewTabs.length : 0
            } else if (hoveredIdx > previewSrcIdx) {
              newDrop = hoveredIdx + 1
            } else {
              newDrop = hoveredIdx
            }
            setDropIndex(prev => {
              if (prev === newDrop) return prev
              cardElRefs.current.forEach((el, id) => {
                if (el) prevPositions.current.set(id, el.getBoundingClientRect())
              })
              return newDrop
            })
          }}
          onDrop={e => {
            e.preventDefault()
            clearDragTransforms()
            if (e.dataTransfer.types.includes('stackview/service')) {
              const svc = e.dataTransfer.getData('stackview/service') as Service
              if (svc) onOpenInNewTab(svc)
            } else if (e.dataTransfer.types.includes('stackview/tab') && dragTabId && dropIndex !== null) {
              commitReorder(dragTabId, dropIndex)
            }
            setDragTabId(null)
            setDropIndex(null)
          }}
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropIndex(null)
          }}
        >
          {previewTabs.map(tab => {
            const isActive = tab.id === activeTabId
            const isHovered = hoveredTabId === tab.id
            const isDragging = dragTabId === tab.id
            const meta = tab.service ? SERVICE_CONFIG[tab.service] : null
            const Icon = meta?.icon ?? LayoutGrid
            const color = meta?.hex ?? 'rgb(var(--text-3))'
            const label = meta?.label ?? 'New Tab'

            return (
              <div
                key={tab.id}
                draggable
                ref={el => {
                  if (el) cardElRefs.current.set(tab.id, el)
                  else cardElRefs.current.delete(tab.id)
                }}
                onDragStart={e => {
                  e.dataTransfer.setData('stackview/tab', tab.id)
                  e.dataTransfer.effectAllowed = 'move'
                  // Suppress the native ghost — a constrained clone is rendered below.
                  const ghost = new Image()
                  ghost.src =
                    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
                  e.dataTransfer.setDragImage(ghost, 0, 0)
                  cardElRefs.current.forEach((el, id) => {
                    if (el) prevPositions.current.set(id, el.getBoundingClientRect())
                  })
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setDragCloneInfo({
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    label,
                    color,
                    IconComponent: Icon,
                  })
                  setDragMouseX(e.clientX)
                  setDragTabId(tab.id)
                }}
                onDragEnd={() => {
                  clearDragTransforms()
                  setDragTabId(null)
                  setDropIndex(null)
                  setDragCloneInfo(null)
                }}
                onClick={() => onSwitch(tab.id)}
                onMouseEnter={() => setHoveredTabId(tab.id)}
                onMouseLeave={() => setHoveredTabId(null)}
                onAuxClick={e => {
                  if (e.button === 1) onClose(tab.id)
                }}
                className="no-drag group flex items-center gap-2 px-3 cursor-pointer border-r border-theme"
                style={{
                  maxWidth: 190,
                  minWidth: 0,
                  flex: '0 1 auto',
                  backgroundColor: isActive
                    ? 'rgb(var(--bg-app))'
                    : isHovered
                      ? 'rgb(var(--bg-raised))'
                      : 'transparent',
                  borderBottom: `2px solid ${isActive ? 'rgb(var(--accent))' : 'transparent'}`,
                  opacity: isDragging ? 0.25 : 1,
                }}
                title={label}
              >
                <Icon size={12} className="shrink-0" style={{ color, opacity: isActive ? 1 : 0.65 }} />
                <span
                  className="text-xs truncate"
                  style={{
                    color: isActive ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {label}
                </span>
                <span
                  role="button"
                  onClick={e => {
                    e.stopPropagation()
                    onClose(tab.id)
                  }}
                  className="shrink-0 flex items-center justify-center w-[18px] h-[18px] -mr-1 rounded-[5px] transition-colors text-4 hover:bg-overlay hover:text-1"
                  style={{ opacity: isActive || isHovered ? 1 : 0 }}
                >
                  <X size={11} />
                </span>
              </div>
            )
          })}

          <button
            onClick={onNew}
            className="no-drag flex items-center px-3 shrink-0 border-r border-theme text-3 hover:text-1 hover:bg-raised transition-colors"
            title="New tab"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Constrained drag clone — tracks X only, never leaves the tab strip */}
      {dragCloneInfo && dragTabId && (() => {
        const cr = tabsAreaRef.current?.getBoundingClientRect()
        const cloneLeft = cr
          ? Math.max(cr.left, Math.min(cr.right - dragCloneInfo.width, dragMouseX - dragCloneInfo.width / 2))
          : dragMouseX
        const CloneIcon = dragCloneInfo.IconComponent
        return (
          <div
            className="fixed z-[9999] pointer-events-none flex items-center gap-2 px-3"
            style={{
              left: cloneLeft,
              top: dragCloneInfo.y,
              width: dragCloneInfo.width,
              height: dragCloneInfo.height,
              backgroundColor: 'rgb(var(--bg-raised))',
              borderBottom: '2px solid rgb(var(--accent))',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              opacity: 0.92,
            }}
          >
            <CloneIcon size={12} style={{ color: dragCloneInfo.color }} />
            <span className="text-xs font-bold text-1 truncate">{dragCloneInfo.label}</span>
          </div>
        )
      })()}

      {isWindows && (
        <div className="no-drag flex items-stretch shrink-0">
          <button
            onClick={() => window.electronAPI.minimize()}
            className="w-11 flex items-center justify-center border-l border-theme text-2 hover:bg-raised hover:text-1 transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={async () => {
              await window.electronAPI.maximize()
              setMaximized(await window.electronAPI.isMaximized())
            }}
            className="w-11 flex items-center justify-center border-l border-theme text-2 hover:bg-raised hover:text-1 transition-colors"
            title={maximized ? 'Restore' : 'Maximize'}
          >
            {maximized ? <Copy size={12} /> : <Square size={12} />}
          </button>
          <button
            onClick={() => window.electronAPI.close()}
            className="w-12 flex items-center justify-center border-l border-theme text-2 transition-colors hover:text-white"
            style={{ ['--tw-bg-opacity' as string]: 1 }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--danger))'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = ''
              e.currentTarget.style.color = ''
            }}
            title="Close"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
