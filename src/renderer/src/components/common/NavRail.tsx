import { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import {
  Settings, LogOut, RefreshCw, Search as SearchIcon,
  ArrowLeftRight, ExternalLink, Plus, StarOff, Command
} from 'lucide-react'
import appIcon from '../../assets/icon.png'
import type { AppSettings, Service, IconMode, Theme, UpdaterStatus } from '../../types'
import { AwsServiceIcon } from './AwsServiceIcons'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../../services/serviceConfig'
import { RegionList, ThemePicker, UpdateControls } from './SettingsControls'
import { MOD_KEY } from './CommandPalette'


function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const RAIL_WIDTH = 64
const ITEM_SIZE = 40

interface Props {
  favouriteServices: Service[]
  activeService: Service | null
  onSelectService: (svc: Service) => void
  onOpenInNewTab: (svc: Service) => void
  onToggleFavourite: (svc: Service) => void
  onReorderFavourites: (services: Service[]) => void
  settings: AppSettings
  theme: Theme
  onSetTheme: (theme: Theme) => void
  iconMode: IconMode
  onToggleIconMode: () => void
  onRefresh: () => void
  refreshing: boolean
  onSwitchService: () => void
  onOpenCommandPalette: () => void
  onDisconnect: () => void
  onRegionChange: (region: string) => void
  appVersion: string
  autoUpdate: boolean
  onToggleAutoUpdate: () => void
  updaterStatus: UpdaterStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
}

interface TooltipState { text: string; x: number; y: number }

export default function NavRail({
  favouriteServices,
  activeService,
  onSelectService,
  onOpenInNewTab,
  onToggleFavourite,
  onReorderFavourites,
  settings,
  theme,
  onSetTheme,
  iconMode,
  onToggleIconMode,
  onRefresh,
  refreshing,
  onSwitchService,
  onOpenCommandPalette,
  onDisconnect,
  onRegionChange,
  appVersion,
  autoUpdate,
  onToggleAutoUpdate,
  updaterStatus,
  onCheckForUpdates,
  onInstallUpdate,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; service: Service } | null>(null)
  const [addFavOpen, setAddFavOpen] = useState(false)
  const [addFavSearch, setAddFavSearch] = useState('')
  const [addFavPos, setAddFavPos] = useState<{ x: number; y: number } | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)

  const settingsRef = useRef<HTMLDivElement>(null)
  const addFavBtnRef = useRef<HTMLButtonElement>(null)
  const addFavPanelRef = useRef<HTMLDivElement>(null)
  const droppedInListRef = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)
  // FLIP animation refs
  const cardElRefs = useRef<Map<Service, HTMLDivElement>>(new Map())
  const prevPositions = useRef<Map<Service, DOMRect>>(new Map())

  const [listOverflows, setListOverflows] = useState(false)

  // Preview order during drag — what the user sees
  const previewServices = useMemo(() => {
    if (dragIdx === null || dropIdx === null || dragIdx === dropIdx) return favouriteServices
    const next = [...favouriteServices]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(dropIdx, 0, moved)
    return next
  }, [favouriteServices, dragIdx, dropIdx])

  // FLIP: after previewServices changes due to dropIdx, animate from old positions to new
  useLayoutEffect(() => {
    if (dragIdx === null || dropIdx === null || dragIdx === dropIdx) return

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
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)'
          el.style.transform = ''
        })
      })
    })
  }, [dropIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  const availableServices = ALL_SERVICES_ORDERED.filter(s => !favouriteServices.includes(s))
  const filteredAvailable = addFavSearch.trim()
    ? availableServices.filter(s => SERVICE_CONFIG[s].label.toLowerCase().includes(addFavSearch.toLowerCase()))
    : availableServices

  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    const check = () => setListOverflows(el.scrollHeight > el.clientHeight)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [favouriteServices])

  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSettingsOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

  useEffect(() => {
    if (!addFavOpen) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (!addFavBtnRef.current?.contains(t) && !addFavPanelRef.current?.contains(t)) {
        setAddFavOpen(false)
        setAddFavSearch('')
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAddFavOpen(false); setAddFavSearch('') }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [addFavOpen])

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

  const handleMouseEnter = useCallback((e: React.MouseEvent, text: string, id: string) => {
    setHoveredId(id)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ text, x: rect.right + 10, y: rect.top + rect.height / 2 })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null)
    setTooltip(null)
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, svc: Service, index: number) => {
    e.dataTransfer.setData('stackview/service', svc)
    e.dataTransfer.effectAllowed = 'copyMove'
    droppedInListRef.current = false
    // Capture current positions before any visual change
    cardElRefs.current.forEach((el, id) => {
      if (el) prevPositions.current.set(id, el.getBoundingClientRect())
    })
    setDragIdx(index)
    setDropIdx(index)
    setHoveredId(null)
    setTooltip(null)
  }, [])

  const handleDragEnter = useCallback((index: number) => {
    // Capture positions before state update so FLIP knows the "before" state
    cardElRefs.current.forEach((el, id) => {
      if (el) prevPositions.current.set(id, el.getBoundingClientRect())
    })
    setDropIdx(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    // Clean up FLIP transforms
    cardElRefs.current.forEach(el => {
      if (el) { el.style.transform = ''; el.style.transition = '' }
    })
    if (droppedInListRef.current && dragIdx !== null && dropIdx !== null && dragIdx !== dropIdx) {
      const next = [...favouriteServices]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(dropIdx, 0, moved)
      onReorderFavourites(next)
    }
    droppedInListRef.current = false
    setDragIdx(null)
    setDropIdx(null)
  }, [dragIdx, dropIdx, favouriteServices, onReorderFavourites])

  const toggleAddFav = () => {
    if (!addFavOpen && addFavBtnRef.current) {
      const r = addFavBtnRef.current.getBoundingClientRect()
      setAddFavPos({ x: r.right + 10, y: r.top })
    }
    setAddFavOpen(o => !o)
    setHoveredId(null)
    setTooltip(null)
  }

  const addFavButton = (
    <button
      ref={addFavBtnRef}
      onClick={toggleAddFav}
      aria-label="Add favourite"
      aria-expanded={addFavOpen}
      className={`flex items-center justify-center rounded-[10px] border border-dashed transition-colors duration-150 ${
        addFavOpen
          ? 'text-1 bg-raised border-transparent'
          : 'text-3 border-theme hover:text-1 hover:bg-raised hover:border-transparent'
      }`}
      style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
    >
      <Plus size={18} />
    </button>
  )

  const hasUpdateBadge = updaterStatus.status === 'available'
    || updaterStatus.status === 'downloading'
    || updaterStatus.status === 'ready'

  const menuItem = 'w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-2 hover:bg-raised hover:text-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <>
      <nav
        aria-label="Favourite services"
        className="drag-region shrink-0 flex flex-col items-center border-r border-theme bg-app"
        style={{ width: RAIL_WIDTH }}
      >
        {/* Logo — clicking opens service selector */}
        <div className="no-drag flex items-center justify-center shrink-0 h-11 w-full">
          <button
            onClick={onSwitchService}
            onMouseEnter={e => handleMouseEnter(e, 'Browse services', '__logo__')}
            onMouseLeave={handleMouseLeave}
            aria-label="Browse services"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-raised"
          >
            <img src={appIcon} alt="" className="w-6 h-6" draggable={false} />
          </button>
        </div>

        <div className="w-8 h-px shrink-0 bg-[rgb(var(--border))]" />

        {/* Favourites list */}
        <div ref={listRef} className="no-drag flex flex-col items-center gap-1.5 flex-1 min-h-0 overflow-y-auto scrollbar-none py-3 w-full">
          {previewServices.map((svc, index) => {
              const isActive = svc === activeService
              const isHovered = svc === hoveredId
              const isDragging = dragIdx !== null && favouriteServices[dragIdx] === svc
              const Icon = SERVICE_CONFIG[svc].icon
              const label = SERVICE_CONFIG[svc].label
              const hex = SERVICE_CONFIG[svc].hex

              return (
                <div
                  key={svc}
                  ref={el => { if (el) cardElRefs.current.set(svc, el); else cardElRefs.current.delete(svc) }}
                  draggable
                  onDragStart={e => handleDragStart(e, svc, index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); droppedInListRef.current = true }}
                  onDragEnd={handleDragEnd}
                  className="relative flex flex-col items-center w-full"
                  onMouseEnter={e => !isDragging && handleMouseEnter(e, label, svc)}
                  onMouseLeave={handleMouseLeave}
                  style={{ opacity: isDragging ? 0.25 : 1 }}
                >
                  {/* Active indicator */}
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200"
                    style={{
                      height: isActive ? 20 : isHovered ? 8 : 0,
                      backgroundColor: hex,
                      opacity: isActive ? 1 : isHovered ? 0.6 : 0,
                    }}
                  />

                  <button
                    onClick={() => onSelectService(svc)}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, service: svc }) }}
                    aria-label={SERVICE_CONFIG[svc].name}
                    aria-current={isActive ? 'page' : undefined}
                    className="flex items-center justify-center rounded-[10px] transition-colors duration-150"
                    style={{
                      width: ITEM_SIZE,
                      height: ITEM_SIZE,
                      backgroundColor: isActive
                        ? hexToRgba(hex, 0.16)
                        : isHovered ? 'rgb(var(--bg-raised))' : 'transparent',
                      boxShadow: isActive ? `inset 0 0 0 1px ${hexToRgba(hex, 0.35)}` : undefined,
                    }}
                  >
                    {iconMode === 'aws'
                      ? <AwsServiceIcon service={svc} size={28} />
                      : <Icon size={20} strokeWidth={isActive ? 2.25 : 2} style={{ color: hex }} />
                    }
                  </button>
                </div>
              )
          })}

          {/* Add favourite button — inline at bottom when list does NOT overflow */}
          {!listOverflows && (
            <div
              className="flex items-center justify-center w-full"
              onMouseEnter={e => !addFavOpen && handleMouseEnter(e, 'Add favourite', '__addFav__')}
              onMouseLeave={handleMouseLeave}
            >
              {addFavButton}
            </div>
          )}
        </div>

        {/* Add favourite button — pinned below list when it overflows */}
        {listOverflows && (
          <div
            className="no-drag shrink-0 flex items-center justify-center w-full pt-1 pb-2 bg-app"
            onMouseEnter={e => !addFavOpen && handleMouseEnter(e, 'Add favourite', '__addFav__')}
            onMouseLeave={handleMouseLeave}
          >
            {addFavButton}
          </div>
        )}

        <div className="w-8 h-px shrink-0 bg-[rgb(var(--border))]" />

        {/* Settings button */}
        <div
          ref={settingsRef}
          className="no-drag relative flex items-center justify-center py-3 w-full"
          onMouseEnter={e => !settingsOpen && handleMouseEnter(e, 'Settings', '__settings__')}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => { setSettingsOpen(o => !o); setHoveredId(null); setTooltip(null) }}
            aria-label="Settings"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            className={`relative flex items-center justify-center rounded-[10px] transition-colors duration-150 ${
              settingsOpen ? 'bg-raised text-1' : 'text-3 hover:bg-raised hover:text-1'
            }`}
            style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
            title={
              updaterStatus.status === 'ready'
                ? `Update v${updaterStatus.version ?? ''} ready — open Settings to install`
                : updaterStatus.status === 'available'
                  ? `Update v${updaterStatus.version ?? ''} available`
                  : updaterStatus.status === 'downloading'
                    ? `Downloading update… ${updaterStatus.percent ?? 0}%`
                    : undefined
            }
          >
            <Settings size={19} className={`transition-transform duration-300 ${settingsOpen ? 'rotate-45' : ''}`} />
            {hasUpdateBadge && (
              <span
                className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                  updaterStatus.status === 'ready' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
                style={{ boxShadow: '0 0 0 2px rgb(var(--bg-app))' }}
              />
            )}
          </button>

          {/* Settings popover — opens to the right */}
          {settingsOpen && (
            <div
              role="dialog"
              aria-label="Settings"
              className="popover absolute left-full bottom-2 ml-2 z-50 w-80 overflow-x-hidden overflow-y-auto max-h-[calc(100vh-4rem)] animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              {/* Header: app + connection */}
              <div className="px-4 pt-3.5 pb-3 flex items-center gap-3">
                <img src={appIcon} alt="" className="w-8 h-8 shrink-0" draggable={false} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-1">StackView</span>
                    {appVersion && <span className="font-mono text-[10px] text-3">v{appVersion}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
                    <span className="font-mono text-[11px] text-3 truncate" title={settings.endpoint}>{settings.endpoint}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-theme" />

              {/* Region picker */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="section-label">Default region</p>
                  <span className="font-mono text-[10px] text-3">{settings.region}</span>
                </div>
                <RegionList
                  value={settings.region}
                  onSelect={region => { onRegionChange(region); setSettingsOpen(false) }}
                  listClassName="max-h-36"
                />
              </div>

              <div className="border-t border-theme" />

              {/* Appearance */}
              <div className="px-4 pt-3 pb-3 space-y-3">
                <ThemePicker theme={theme} onSelect={onSetTheme} />
                <div>
                  <p className="section-label mb-1.5">Service icons</p>
                  <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-raised" role="radiogroup" aria-label="Service icons">
                    {(['lucide', 'aws'] as const).map(mode => (
                      <button
                        key={mode}
                        role="radio"
                        aria-checked={iconMode === mode}
                        onClick={() => { if (iconMode !== mode) onToggleIconMode() }}
                        className={`py-1 rounded-md text-[11px] font-medium transition-colors ${
                          iconMode === mode ? 'bg-base text-1 shadow-sm' : 'text-3 hover:text-1'
                        }`}
                      >
                        {mode === 'lucide' ? 'Minimal' : 'AWS'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-theme" />

              {/* Actions */}
              <div className="px-2 py-2">
                <button
                  onClick={() => { onOpenCommandPalette(); setSettingsOpen(false) }}
                  className={menuItem}
                >
                  <Command size={13} />
                  <span className="flex-1 text-left">Go to service…</span>
                  <span className="kbd">{MOD_KEY} K</span>
                </button>
                <button
                  onClick={() => { onSwitchService(); setSettingsOpen(false) }}
                  className={menuItem}
                >
                  <ArrowLeftRight size={13} />
                  Browse services
                </button>
                <button
                  onClick={() => { onRefresh(); setSettingsOpen(false) }}
                  disabled={refreshing || !activeService}
                  className={menuItem}
                >
                  <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                  Refresh current view
                </button>
              </div>

              <div className="border-t border-theme" />

              {/* Updates */}
              <div className="px-2 pt-3 pb-2">
                <div className="px-2">
                  <UpdateControls
                    appVersion=""
                    autoUpdate={autoUpdate}
                    onToggleAutoUpdate={onToggleAutoUpdate}
                    updaterStatus={updaterStatus}
                    onCheckForUpdates={onCheckForUpdates}
                    onInstallUpdate={() => { onInstallUpdate(); setSettingsOpen(false) }}
                  />
                </div>
              </div>

              <div className="border-t border-theme" />

              <div className="px-2 py-2">
                <button
                  onClick={() => { onDisconnect(); setSettingsOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut size={13} />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

      </nav>

      {/* Add favourite picker — fixed to avoid overflow clipping from scroll container */}
      {addFavOpen && addFavPos && (
        <div
          ref={addFavPanelRef}
          role="dialog"
          aria-label="Add favourite"
          className="popover fixed z-[999] w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ left: addFavPos.x, top: Math.min(addFavPos.y, window.innerHeight - 340) }}
        >
          <div className="px-3 pt-3 pb-2">
            <p className="section-label mb-2">Add favourite</p>
            <div className="relative">
              <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4 pointer-events-none" />
              <input
                type="text"
                value={addFavSearch}
                onChange={e => setAddFavSearch(e.target.value)}
                placeholder="Search services…"
                aria-label="Search services"
                className="sidebar-search"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto px-1.5 pb-1.5">
            {filteredAvailable.length === 0 ? (
              <p className="text-xs text-3 px-3 py-4 text-center">
                {availableServices.length === 0 ? 'All services added' : 'No matches'}
              </p>
            ) : (
              filteredAvailable.map(svc => {
                const Icon = SERVICE_CONFIG[svc].icon
                const hex = SERVICE_CONFIG[svc].hex
                return (
                  <button
                    key={svc}
                    onClick={() => onToggleFavourite(svc)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs text-2 hover:bg-raised hover:text-1 transition-colors"
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: iconMode === 'aws' ? 'transparent' : hexToRgba(hex, 0.14) }}
                    >
                      {iconMode === 'aws'
                        ? <AwsServiceIcon service={svc} size={20} />
                        : <Icon size={13} style={{ color: hex }} />
                      }
                    </span>
                    <span className="flex-1 text-left truncate">{SERVICE_CONFIG[svc].label}</span>
                    <Plus size={12} className="text-4 shrink-0" />
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Fixed tooltip — outside NavRail to avoid overflow clipping */}
      {tooltip && hoveredId && !settingsOpen && !addFavOpen && !contextMenu && (
        <div
          role="tooltip"
          className="fixed z-[999] pointer-events-none select-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translateY(-50%)' }}
        >
          <div className="px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap text-1 bg-overlay border border-theme shadow-lg animate-in fade-in duration-100">
            {tooltip.text}
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          role="menu"
          className="popover fixed z-[999] p-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
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
            className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs text-2 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <StarOff size={13} className="shrink-0" />
            Remove from favourites
          </button>
        </div>
      )}
    </>
  )
}
