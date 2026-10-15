import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import {
  X, Pencil, Check, GripVertical,
  EyeOff, Eye, RotateCcw, Search, ExternalLink, Star, ArrowRight
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppSettings, Service, IconMode } from '../../types'
import { AwsServiceIcon } from './AwsServiceIcons'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../../services/serviceConfig'

interface Props {
  settings: AppSettings
  onSelectService: (service: Service) => void
  onOpenInNewTab: (service: Service) => void
  favouriteServices: Service[]
  onToggleFavourite: (svc: Service) => void
  iconMode: IconMode
}

const SERVICE_LIST: {
  id: Service
  name: string
  description: string
  icon: LucideIcon
  features: string[]
}[] = ALL_SERVICES_ORDERED.map(id => ({
  id,
  name: SERVICE_CONFIG[id].name,
  description: SERVICE_CONFIG[id].description,
  icon: SERVICE_CONFIG[id].icon,
  features: SERVICE_CONFIG[id].features,
}))

const STORAGE_KEY = 'stackview:service_prefs'

interface ServicePrefs {
  order: Service[]
  hidden: Service[]
}

function loadPrefs(): ServicePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { order: [...ALL_SERVICES_ORDERED], hidden: [] }
}

function savePrefs(prefs: ServicePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function ServiceSelector({ settings, onSelectService, onOpenInNewTab, favouriteServices, onToggleFavourite, iconMode }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [prefs, setPrefs] = useState<ServicePrefs>(loadPrefs)
  const [search, setSearch] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; service: Service } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Drag state — using state (not refs) so re-renders happen for visual feedback
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  // Snapshot of prefs at the moment edit mode is entered (for cancel)
  const savedPrefsRef = useRef<ServicePrefs | null>(null)

  // FLIP animation: refs to each card's DOM element + saved pre-reorder positions
  const cardElRefs = useRef<Map<Service, HTMLDivElement>>(new Map())
  const prevPositions = useRef<Map<Service, DOMRect>>(new Map())

  // Ensure all services are represented (handles new ones added post-prefs)
  const normalizedOrder: Service[] = [
    ...prefs.order.filter(id => ALL_SERVICES_ORDERED.includes(id)),
    ...ALL_SERVICES_ORDERED.filter(id => !prefs.order.includes(id))
  ]

  // Compute preview order (what it would look like if we drop now)
  const computePreviewOrder = (drag: number | null, drop: number | null): Service[] => {
    if (drag === null || drop === null || drag === drop) return normalizedOrder
    const next = [...normalizedOrder]
    const [moved] = next.splice(drag, 1)
    next.splice(drop, 0, moved)
    return next
  }

  const previewOrder = computePreviewOrder(dragIndex, dropIndex)
  const orderedServices = previewOrder.map(id => SERVICE_LIST.find(s => s.id === id)!).filter(Boolean)
  const visibleServices = normalizedOrder.map(id => SERVICE_LIST.find(s => s.id === id)!).filter(s => !prefs.hidden.includes(s.id))
  const displayServices = editMode ? orderedServices : visibleServices

  const q = !editMode ? search.trim().toLowerCase() : ''
  const filteredServices = q
    ? displayServices.filter(svc =>
        svc.name.toLowerCase().includes(q) ||
        svc.description.toLowerCase().includes(q) ||
        svc.features.some(f => f.toLowerCase().includes(q))
      )
    : displayServices

  useEffect(() => {
    if (!contextMenu) return
    const dismiss = () => setContextMenu(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null) }
    window.addEventListener('mousedown', dismiss)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', dismiss)
      window.removeEventListener('keydown', onKey)
    }
  }, [contextMenu])

  // "/" focuses the search box (ignored while typing in another field)
  useEffect(() => {
    if (editMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      const input = searchRef.current
      if (!input || input.offsetParent === null) return // tab not visible
      e.preventDefault()
      input.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [editMode])

  const updatePrefs = useCallback((newPrefs: ServicePrefs) => {
    setPrefs(newPrefs)
    savePrefs(newPrefs)
  }, [])

  // FLIP: after previewOrder changes, animate from old positions to new
  useLayoutEffect(() => {
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) return

    const newPositions = new Map<Service, DOMRect>()
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

      // Apply inverse transform immediately (no animation)
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`

      // In the next two frames: release transform → browser animates it
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)'
          el.style.transform = ''
        })
      })
    })
  }, [dropIndex])

  const capturePositions = () => {
    cardElRefs.current.forEach((el, id) => {
      if (el) prevPositions.current.set(id, el.getBoundingClientRect())
    })
  }

  const handleDragStart = (index: number) => {
    capturePositions()
    setDragIndex(index)
    setDropIndex(index)
  }

  const handleDragEnter = (index: number) => {
    if (dragIndex === null || index === dropIndex) return
    capturePositions()
    setDropIndex(index)
  }

  const handleDragEnd = () => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      updatePrefs({ ...prefs, order: previewOrder })
    }
    // Clear transition styles
    cardElRefs.current.forEach(el => {
      if (el) { el.style.transform = ''; el.style.transition = '' }
    })
    setDragIndex(null)
    setDropIndex(null)
  }

  const toggleHidden = (id: Service) => {
    const newHidden = prefs.hidden.includes(id)
      ? prefs.hidden.filter(h => h !== id)
      : [...prefs.hidden, id]
    updatePrefs({ ...prefs, hidden: newHidden })
  }

  const resetPrefs = () => {
    updatePrefs({ order: [...ALL_SERVICES_ORDERED], hidden: [] })
  }

  const iconTile = (id: Service, Icon: LucideIcon, hex: string, dimmed = false) => (
    <div
      className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${dimmed ? 'grayscale opacity-50' : ''}`}
      style={iconMode !== 'aws' ? {
        backgroundColor: hexToRgba(hex, 0.14),
        boxShadow: `inset 0 0 0 1px ${hexToRgba(hex, 0.22)}`,
      } : undefined}
    >
      {iconMode === 'aws'
        ? <AwsServiceIcon service={id} size={32} />
        : <Icon size={19} style={{ color: hex }} />
      }
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-app px-6 py-6">
        <div className="w-full flex flex-col">

          {/* Header — full-width toolbar */}
          <div className="mb-6 shrink-0 flex items-end justify-between gap-4 flex-wrap">
            {/* Left: title + connection info */}
            <div className="min-w-0">
              <div className="flex items-baseline gap-2.5 mb-2">
                <h1 className="text-xl font-semibold tracking-tight text-1">Services</h1>
                <span className="text-xs text-3">{visibleServices.length} services</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge-gray font-mono text-[11px] gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {settings.endpoint}
                </span>
                <span className="badge-gray font-mono text-[11px]">{settings.region}</span>
                {editMode && (
                  <span className="text-[11px] text-3 leading-relaxed">
                    Drag cards to reorder · use the eye to hide
                    {prefs.hidden.length > 0 && <span className="text-4"> · {prefs.hidden.length} hidden</span>}
                  </span>
                )}
              </div>
            </div>

            {/* Right: search + actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search (normal mode only) */}
              {!editMode && (
                <div className="relative w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-4 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search services…"
                    aria-label="Search services"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') { setSearch(''); e.currentTarget.blur() } }}
                    className="input-base w-full h-9 pl-9 pr-9 text-[13px]"
                  />
                  {search ? (
                    <button
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn w-6 h-6"
                    >
                      <X size={12} />
                    </button>
                  ) : (
                    <span className="kbd absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden>/</span>
                  )}
                </div>
              )}

              {/* Customize / edit actions */}
              {editMode ? (
                <>
                  <button onClick={resetPrefs} className="btn-ghost text-xs font-medium h-9">
                    <RotateCcw size={13} /> Reset
                  </button>
                  <button
                    onClick={() => {
                      if (savedPrefsRef.current) {
                        setPrefs(savedPrefsRef.current)
                        savePrefs(savedPrefsRef.current)
                      }
                      savedPrefsRef.current = null
                      setEditMode(false)
                    }}
                    className="btn-secondary text-xs h-9 px-3"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    onClick={() => { savedPrefsRef.current = null; setEditMode(false) }}
                    className="btn-primary text-xs h-9 px-3.5"
                  >
                    <Check size={13} /> Done
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { savedPrefsRef.current = prefs; setEditMode(true) }}
                  className="btn-secondary text-xs h-9 px-3"
                >
                  <Pencil size={13} />
                  Customize
                </button>
              )}
            </div>
          </div>

          {/* Service grid */}
          <div className="grid gap-3 w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {filteredServices.length === 0 && search && (
              <div className="col-span-full flex flex-col items-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-raised border border-theme flex items-center justify-center mb-3">
                  <Search size={18} className="text-4" />
                </div>
                <p className="text-sm font-medium text-2">No services match “{search}”</p>
                <button onClick={() => setSearch('')} className="mt-2 text-xs text-3 hover:text-1 underline-offset-2 hover:underline">
                  Clear search
                </button>
              </div>
            )}
            {filteredServices.map((svc, index) => {
              const hex = SERVICE_CONFIG[svc.id].hex
              const isHidden = prefs.hidden.includes(svc.id)
              const isDragging = editMode && dragIndex !== null && previewOrder[index] === normalizedOrder[dragIndex]
              const isDropTarget = editMode && dropIndex === index && dragIndex !== null && dragIndex !== index

              if (editMode) {
                return (
                  <div
                    key={svc.id}
                    ref={el => { if (el) cardElRefs.current.set(svc.id, el); else cardElRefs.current.delete(svc.id) }}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    className={`group relative flex flex-col text-left rounded-xl border p-4 select-none cursor-grab active:cursor-grabbing bg-base transition-[border-color,box-shadow,opacity] duration-150
                      ${isDragging
                        ? 'opacity-30 border-dashed border-theme'
                        : isDropTarget
                          ? 'shadow-lg'
                          : isHidden
                            ? 'opacity-50 border-dashed border-theme'
                            : 'border-theme hover:shadow-md'
                      }
                    `}
                    style={isDropTarget ? {
                      borderColor: 'rgb(var(--accent))',
                      boxShadow: '0 0 0 3px rgb(var(--accent) / 0.2)',
                    } : undefined}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical size={15} className="text-4 group-hover:text-2 transition-colors -ml-1" aria-hidden />
                        {iconTile(svc.id, svc.icon, hex, isHidden)}
                      </div>
                      <button
                        onClick={() => toggleHidden(svc.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          isHidden
                            ? 'bg-raised text-3 hover:text-emerald-500 hover:bg-emerald-500/10'
                            : 'text-4 hover:bg-red-500/10 hover:text-red-500'
                        }`}
                        title={isHidden ? 'Show service' : 'Hide service'}
                        aria-label={isHidden ? `Show ${svc.name}` : `Hide ${svc.name}`}
                        aria-pressed={isHidden}
                      >
                        {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>

                    <h2 className={`text-sm font-semibold mb-1 ${isHidden ? 'text-3' : 'text-1'}`}>{svc.name}</h2>
                    <p className={`text-xs leading-relaxed line-clamp-2 ${isHidden ? 'text-4' : 'text-3'}`}>{svc.description}</p>

                    {isHidden && (
                      <div className="mt-auto pt-3">
                        <span className="badge-gray text-[10px] font-semibold uppercase tracking-wider w-fit">
                          <EyeOff size={10} /> Hidden
                        </span>
                      </div>
                    )}
                  </div>
                )
              }

              const isFav = favouriteServices.includes(svc.id)
              return (
                <div
                  key={svc.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${svc.name}`}
                  onClick={() => onSelectService(svc.id)}
                  onKeyDown={e => {
                    if (e.target !== e.currentTarget) return
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectService(svc.id) }
                  }}
                  onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, service: svc.id }) }}
                  className="group relative flex flex-col text-left rounded-xl border border-theme bg-base p-4 cursor-pointer
                    transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg
                    hover:border-[color:var(--svc-border)]"
                  style={{ '--svc-border': hexToRgba(hex, 0.45) } as React.CSSProperties}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {iconTile(svc.id, svc.icon, hex)}
                    {/* Favourite toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); onToggleFavourite(svc.id) }}
                      title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                      aria-label={isFav ? `Remove ${svc.name} from favourites` : `Add ${svc.name} to favourites`}
                      aria-pressed={isFav}
                      className={`p-1.5 rounded-md transition-[opacity,color,background-color] ${
                        isFav
                          ? 'text-amber-400 hover:bg-amber-400/10'
                          : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-4 hover:text-amber-400 hover:bg-amber-400/10'
                      }`}
                    >
                      <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <h2 className="text-sm font-semibold text-1 truncate">{svc.name}</h2>
                    <ArrowRight
                      size={13}
                      className="shrink-0 opacity-0 -translate-x-1 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                      style={{ color: hex }}
                      aria-hidden
                    />
                  </div>
                  <p className="text-xs text-3 leading-relaxed line-clamp-2 mb-3">{svc.description}</p>

                  <div className="mt-auto flex flex-wrap gap-1">
                    {svc.features.map((f) => (
                      <span key={f} className="px-1.5 py-0.5 text-[10px] rounded bg-raised text-3">{f}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {contextMenu && (
        <div
          role="menu"
          className="popover fixed z-50 p-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            role="menuitem"
            onClick={() => { onOpenInNewTab(contextMenu.service); setContextMenu(null) }}
            className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs text-2 hover:bg-raised hover:text-1 transition-colors"
          >
            <ExternalLink size={13} className="shrink-0" />
            Open in new tab
          </button>
          <button
            role="menuitem"
            onClick={() => { onToggleFavourite(contextMenu.service); setContextMenu(null) }}
            className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs text-2 hover:bg-raised hover:text-1 transition-colors"
          >
            <Star size={13} className="shrink-0" />
            {favouriteServices.includes(contextMenu.service) ? 'Remove from favourites' : 'Add to favourites'}
          </button>
        </div>
      )}
    </div>
  )
}
