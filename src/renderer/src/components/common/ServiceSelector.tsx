import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import {
  ChevronRight, X, Pencil, Check, GripVertical,
  EyeOff, Eye, RotateCcw, Search, ExternalLink, Star
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

export default function ServiceSelector({ settings, onSelectService, onOpenInNewTab, favouriteServices, onToggleFavourite, iconMode }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [prefs, setPrefs] = useState<ServicePrefs>(loadPrefs)
  const [search, setSearch] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; service: Service } | null>(null)

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
    window.addEventListener('mousedown', dismiss)
    return () => window.removeEventListener('mousedown', dismiss)
  }, [contextMenu])

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

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-app px-6 py-5">
        <div className="w-full flex flex-col">

          {/* Header — full-width toolbar */}
          <div className="mb-5 shrink-0 flex items-center justify-between gap-4">
            {/* Left: title + connection info */}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-1 mb-1.5">Select a Service</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-gray font-mono text-[11px]">{settings.endpoint}</span>
                <span className="text-4 text-xs select-none">·</span>
                <span className="badge badge-gray font-mono text-[11px]">{settings.region}</span>
                {editMode && (
                  <span className="text-[11px] text-4 leading-relaxed">
                    <span className="font-bold text-fuchsia-500">Drag</span> to reorder · click <span className="font-bold">eye</span> to hide
                    {prefs.hidden.length > 0 && <span className="opacity-60"> · {prefs.hidden.length} hidden</span>}
                  </span>
                )}
              </div>
            </div>

            {/* Right: search + actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search (normal mode only) */}
              {!editMode && (
                <div className="relative w-64">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-base w-full pl-7 text-xs"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-4 hover:text-1 transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Customize / edit actions */}
              {editMode ? (
                <>
                  <button onClick={resetPrefs} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-3 hover:text-1 btn-ghost rounded-lg">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold btn-ghost rounded-lg text-3 hover:text-1"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    onClick={() => { savedPrefsRef.current = null; setEditMode(false) }}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm"
                  >
                    <Check size={13} /> Done
                  </button>
                </>
              ) : (
                <button onClick={() => { savedPrefsRef.current = prefs; setEditMode(true) }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold btn-ghost rounded-lg border border-theme group">
                  <Pencil size={12} className="group-hover:text-fuchsia-500 transition-colors" />
                  <span className="group-hover:text-1 transition-colors">Customize</span>
                </button>
              )}
            </div>
          </div>

          {/* Service grid */}
          <div className="grid gap-4 w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {filteredServices.length === 0 && search && (
              <p className="col-span-full text-sm text-3 py-12 text-center w-full">
                No services match <span className="font-mono text-2">"{search}"</span>
              </p>
            )}
            {filteredServices.map((svc, index) => {
              const c = SERVICE_CONFIG[svc.id].colors
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
                    className={`group relative flex flex-col text-left rounded-2xl border select-none cursor-grab active:cursor-grabbing overflow-hidden
                      ${isDragging
                        ? 'opacity-25 scale-95 border-dashed border-fuchsia-500/30 shadow-none'
                        : isDropTarget
                          ? 'border-fuchsia-500 shadow-lg shadow-fuchsia-500/20'
                          : isHidden
                            ? 'opacity-40 border-dashed border-theme/50'
                            : 'border-theme hover:border-fuchsia-500/40 hover:shadow-md'
                      }
                    `}
                    style={{ backgroundColor: 'rgb(var(--bg-base))', outline: isDropTarget ? '2px solid rgb(192 38 211 / 0.4)' : undefined, outlineOffset: '2px' }}
                  >
                    {/* Top hex accent strip */}
                    <div
                      className={`h-1 w-full shrink-0 ${isHidden ? 'grayscale opacity-50' : ''}`}
                      style={{ backgroundColor: hex }}
                    />

                    {/* Card content */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Drag handle */}
                      <div className={`absolute top-[18px] left-2.5 transition-colors ${isDropTarget ? 'text-fuchsia-500' : 'text-4 group-hover:text-3'}`}>
                        <GripVertical size={15} />
                      </div>

                      {/* Hide/show toggle */}
                      <button
                        onClick={() => toggleHidden(svc.id)}
                        className={`absolute top-[18px] right-2.5 p-1.5 rounded-lg transition-all z-10
                          ${isHidden
                            ? 'bg-raised text-4 hover:text-emerald-500 hover:bg-emerald-500/10'
                            : 'text-4 hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100'
                          }`}
                        title={isHidden ? 'Show service' : 'Hide service'}
                      >
                        {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ml-4 mt-1 ${isHidden ? 'grayscale opacity-50' : ''}`}
                        style={iconMode !== 'aws' ? { backgroundColor: hex + '26' } : undefined}
                      >
                        {iconMode === 'aws'
                          ? <AwsServiceIcon service={svc.id} size={32} />
                          : <svc.icon size={20} style={{ color: hex }} />
                        }
                      </div>

                      <h2 className={`text-sm font-bold mb-1 ml-1 ${isHidden ? 'text-3' : 'text-1'}`}>{svc.name}</h2>
                      <p className={`text-[10px] ml-1 leading-relaxed line-clamp-2 ${isHidden ? 'text-4' : 'text-3'}`}>{svc.description}</p>

                      {isHidden && (
                        <div className="mt-auto pt-3 ml-1">
                          <span className="badge badge-gray text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit">
                            <EyeOff size={9} /> Hidden
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              const isFav = favouriteServices.includes(svc.id)
              return (
                <div
                  key={svc.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectService(svc.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectService(svc.id) }}
                  onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, service: svc.id }) }}
                  className={`group relative flex flex-col text-left rounded-2xl border border-theme transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer overflow-hidden ${c.border}`}
                  style={{ backgroundColor: 'rgb(var(--bg-base))' }}
                >
                  {/* Top hex accent strip */}
                  <div className="h-1 w-full shrink-0" style={{ backgroundColor: hex }} />

                  {/* Card content */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Favourite toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); onToggleFavourite(svc.id) }}
                      title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                      className={`absolute top-[18px] right-2.5 p-1.5 rounded-lg transition-all z-10
                        ${isFav
                          ? 'text-amber-400 bg-amber-400/10'
                          : 'opacity-0 group-hover:opacity-100 text-4 hover:text-amber-400 hover:bg-amber-400/10'
                        }`}
                    >
                      <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                    </button>

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={iconMode !== 'aws' ? { backgroundColor: hex + '26' } : undefined}
                    >
                      {iconMode === 'aws'
                        ? <AwsServiceIcon service={svc.id} size={32} />
                        : <svc.icon size={20} style={{ color: hex }} />
                      }
                    </div>

                    <h2 className="text-sm font-bold text-1 mb-1">{svc.name}</h2>
                    <p className="text-[11px] text-3 leading-relaxed line-clamp-2 mb-3">{svc.description}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {svc.features.map((f) => (
                        <span key={f} className="px-1.5 py-0.5 text-[10px] rounded-md bg-raised text-3">{f}</span>
                      ))}
                    </div>

                    <div className="border-t border-theme mt-auto pt-2 flex items-center justify-between">
                      <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${c.text}`}>
                        <svc.icon size={11} />
                        {svc.name}
                      </span>
                      <ChevronRight size={12} className={`transition-transform duration-150 group-hover:translate-x-0.5 ${c.text}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-base border border-theme rounded-xl shadow-2xl py-1 min-w-[170px] animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={() => { onOpenInNewTab(contextMenu.service); setContextMenu(null) }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-2 hover:bg-raised hover:text-1 transition-colors"
          >
            <ExternalLink size={13} className="shrink-0" />
            Open in new tab
          </button>
        </div>
      )}
    </div>
  )
}
