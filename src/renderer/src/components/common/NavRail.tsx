import { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import {
  Settings, LogOut, Link2, RefreshCw, Search as SearchIcon,
  ArrowLeftRight, ExternalLink, Plus, Star, Image, Check,
  Download, ArrowUpCircle, CheckCircle2, AlertCircle
} from 'lucide-react'
import appIcon from '../../assets/icon.png'
import type { AppSettings, Service, IconMode, Theme, UpdaterStatus } from '../../types'
import { AWS_REGIONS } from '../../constants'
import { AwsServiceIcon } from './AwsServiceIcons'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../../services/serviceConfig'
import { THEME_DEFINITIONS, ALL_THEMES } from '../../../../shared/themes'


function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

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
  onDisconnect: () => void
  onRegionChange: (region: string) => void
  appVersion: string
  autoUpdate: boolean
  onToggleAutoUpdate: () => void
  updaterStatus: UpdaterStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
}

interface TooltipState { text: string; y: number }

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
  const [regionSearch, setRegionSearch] = useState('')
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

  const filteredRegions = AWS_REGIONS.filter(r =>
    r.value.toLowerCase().includes(regionSearch.toLowerCase()) ||
    r.label.toLowerCase().includes(regionSearch.toLowerCase())
  )

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
    setRegionSearch('')
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
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
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [addFavOpen])

  useEffect(() => {
    if (!contextMenu) return
    const dismiss = () => setContextMenu(null)
    window.addEventListener('mousedown', dismiss)
    return () => window.removeEventListener('mousedown', dismiss)
  }, [contextMenu])

  const handleMouseEnter = useCallback((e: React.MouseEvent, text: string, id: string) => {
    setHoveredId(id)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ text, y: rect.top + rect.height / 2 })
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

  return (
    <>
      <div
        className="drag-region shrink-0 flex flex-col items-center border-r border-theme"
        style={{ width: 68, backgroundColor: 'rgb(var(--bg-app))' }}
      >
        {/* Logo — clicking opens service selector */}
        <div className="no-drag flex items-center justify-center shrink-0" style={{ height: 44, width: 68 }}>
          <button
            onClick={onSwitchService}
            className="flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110"
            style={{ width: 32, height: 32 }}
            title="Browse services"
          >
            <img src={appIcon} alt="StackView" style={{ width: 28, height: 28 }} draggable={false} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-8 shrink-0" style={{ height: 1, backgroundColor: 'rgb(var(--border))' }} />

        {/* Favourites list */}
        <div ref={listRef} className="no-drag flex flex-col items-center gap-1.5 flex-1 min-h-0 overflow-y-auto scrollbar-none py-3 w-full">
          {previewServices.map((svc, index) => {
              const isActive = svc === activeService
              const isHovered = svc === hoveredId
              const isDragging = dragIdx !== null && favouriteServices[dragIdx] === svc
              const Icon = SERVICE_CONFIG[svc].icon
              const label = SERVICE_CONFIG[svc].label
              const hex = SERVICE_CONFIG[svc].hex

              const bgColor = isActive
                ? hex
                : isHovered
                  ? hexToRgba(hex, 0.15)
                  : 'transparent'

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
                  {/* Discord-style active pill */}
                  <span
                    className="absolute left-0 rounded-r-full transition-all duration-200"
                    style={{
                      width: 4,
                      height: isActive ? 32 : isHovered ? 16 : 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: hex,
                      opacity: isActive ? 1 : isHovered ? 0.5 : 0,
                    }}
                  />

                  <button
                    onClick={() => onSelectService(svc)}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, service: svc }) }}
                    className="flex items-center justify-center transition-all duration-200"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: isActive || isHovered ? 20 : 14,
                      backgroundColor: iconMode === 'aws' ? 'transparent' : bgColor,
                    }}
                  >
                    {iconMode === 'aws'
                      ? <AwsServiceIcon service={svc} size={40} />
                      : <Icon size={22} style={{ color: isActive ? '#ffffff' : hex, transition: 'color 0.15s' }} />
                    }
                  </button>
                </div>
              )
          })}

          {/* Add favourite button — inline at bottom when list does NOT overflow */}
          {!listOverflows && (
            <div
              className="flex items-center justify-center w-full pt-0.5 pb-0.5"
              onMouseEnter={e => !addFavOpen && handleMouseEnter(e, 'Add favourite', '__addFav__')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                ref={addFavBtnRef}
                onClick={() => {
                  if (!addFavOpen && addFavBtnRef.current) {
                    const r = addFavBtnRef.current.getBoundingClientRect()
                    setAddFavPos({ x: r.right + 8, y: r.top })
                  }
                  setAddFavOpen(o => !o)
                  setHoveredId(null)
                  setTooltip(null)
                }}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: addFavOpen || hoveredId === '__addFav__' ? 20 : 14,
                  backgroundColor: addFavOpen
                    ? hexToRgba('#64748b', 0.35)
                    : hoveredId === '__addFav__'
                      ? hexToRgba('#64748b', 0.2)
                      : 'rgb(var(--bg-raised))',
                  color: addFavOpen ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
                }}
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Add favourite button — pinned below list when it overflows */}
        {listOverflows && (
          <div
            className="no-drag shrink-0 flex items-center justify-center w-full pt-1 pb-2"
            style={{ backgroundColor: 'rgb(var(--bg-app))' }}
            onMouseEnter={e => !addFavOpen && handleMouseEnter(e, 'Add favourite', '__addFav__')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              ref={addFavBtnRef}
              onClick={() => {
                if (!addFavOpen && addFavBtnRef.current) {
                  const r = addFavBtnRef.current.getBoundingClientRect()
                  setAddFavPos({ x: r.right + 8, y: r.top })
                }
                setAddFavOpen(o => !o)
                setHoveredId(null)
                setTooltip(null)
              }}
              className="flex items-center justify-center transition-all duration-200"
              style={{
                width: 48,
                height: 48,
                borderRadius: addFavOpen || hoveredId === '__addFav__' ? 18 : 12,
                backgroundColor: addFavOpen
                  ? hexToRgba('#64748b', 0.35)
                  : hoveredId === '__addFav__'
                    ? hexToRgba('#64748b', 0.2)
                    : 'rgb(var(--bg-raised))',
                color: addFavOpen ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
              }}
            >
              <Plus size={20} />
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="w-8 shrink-0" style={{ height: 1, backgroundColor: 'rgb(var(--border))' }} />

        {/* Settings button */}
        <div
          ref={settingsRef}
          className="no-drag relative flex items-center justify-center py-3 w-full"
          onMouseEnter={e => !settingsOpen && handleMouseEnter(e, 'Settings', '__settings__')}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => { setSettingsOpen(o => !o); setHoveredId(null); setTooltip(null) }}
            className="flex items-center justify-center transition-all duration-200"
            style={{
              width: 48,
              height: 48,
              borderRadius: settingsOpen || hoveredId === '__settings__' ? 20 : 14,
              backgroundColor: settingsOpen
                ? hexToRgba('#64748b', 0.35)
                : hoveredId === '__settings__'
                  ? hexToRgba('#64748b', 0.2)
                  : 'rgb(var(--bg-raised))',
              color: settingsOpen ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
            }}
          >
            <Settings size={20} />
          </button>

          {/* Settings dropdown — opens to the right */}
          {settingsOpen && (
            <div
              className="absolute left-full bottom-0 ml-2 z-50 w-72 rounded-xl shadow-2xl border border-theme overflow-x-hidden overflow-y-auto max-h-[calc(100vh-8rem)]"
              style={{ backgroundColor: 'rgb(var(--bg-base))' }}
            >
              {/* Endpoint */}
              <div className="px-3 py-2.5 flex items-center gap-2">
                <Link2 size={12} className="text-3 shrink-0" />
                <span className="font-mono text-xs text-2 truncate flex-1">{settings.endpoint}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-500/20" />
              </div>

              <div className="mx-3 border-t border-theme" />

              {/* Region picker */}
              <div className="px-3 pt-3 pb-2">
                <p className="text-[10px] font-semibold text-3 uppercase tracking-wider mb-1.5">Region</p>
                <div className="relative mb-1.5">
                  <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3" />
                  <input
                    type="text"
                    value={regionSearch}
                    onChange={e => setRegionSearch(e.target.value)}
                    placeholder="Search regions..."
                    className="sidebar-search pl-7 text-xs w-full"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
                  {filteredRegions.map(r => (
                    <button
                      key={r.value}
                      onClick={() => { onRegionChange(r.value); setSettingsOpen(false) }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors flex items-center justify-between gap-2
                        ${settings.region === r.value
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300 font-semibold'
                          : 'text-2 hover:bg-overlay'
                        }`}
                    >
                      <span className="truncate">{r.label}</span>
                      <span className="font-mono text-[10px] text-3 shrink-0">{r.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mx-3 border-t border-theme" />

              {/* Appearance */}
              <div className="px-3 pt-3 pb-2">
                <p className="text-[10px] font-semibold text-3 uppercase tracking-wider mb-2.5">Appearance</p>
                <div className="grid grid-cols-3 gap-1 mb-2.5">
                  {ALL_THEMES.map(themeKey => {
                    const def = THEME_DEFINITIONS[themeKey]
                    const isActive = theme === themeKey
                    return (
                      <button
                        key={themeKey}
                        title={def.label}
                        onClick={() => { onSetTheme(themeKey); setSettingsOpen(false) }}
                        className="rounded-md overflow-hidden transition-all hover:scale-[1.02]"
                        style={{
                          outline: isActive ? '2px solid #0ea5e9' : '1px solid transparent',
                          outlineOffset: 1,
                        }}
                      >
                        <div className="relative h-6 w-full" style={{ backgroundColor: def.preview.bg }}>
                          {isActive && (
                            <span className="absolute top-0.5 right-0.5">
                              <Check size={9} color="#ffffff" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div
                          className="h-6 w-full flex items-center px-1.5 gap-1"
                          style={{ backgroundColor: def.preview.surface }}
                        >
                          <span
                            className="text-[8px] font-semibold flex-1 truncate leading-none"
                            style={{ color: def.preview.text }}
                          >
                            {def.label}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: def.preview.bg }} />
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: def.preview.text }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => { onToggleIconMode(); setSettingsOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-2 hover:bg-raised hover:text-1 rounded-lg transition-colors"
                >
                  <Image size={13} />
                  {iconMode === 'lucide' ? 'AWS icons' : 'Default icons'}
                </button>
              </div>

              <div className="mx-3 border-t border-theme" />

              {/* Actions */}
              <div className="px-3 pt-3 pb-2">
                <p className="text-[10px] font-semibold text-3 uppercase tracking-wider mb-1">Actions</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => { onRefresh(); setSettingsOpen(false) }}
                    disabled={refreshing || !activeService}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-2 hover:bg-raised hover:text-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                  <button
                    onClick={() => { onSwitchService(); setSettingsOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-2 hover:bg-raised hover:text-1 rounded-lg transition-colors"
                  >
                    <ArrowLeftRight size={13} />
                    Browse services
                  </button>
                </div>
              </div>

              <div className="mx-3 border-t border-theme" />

              {/* Updates */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-semibold text-3 uppercase tracking-wider">Updates</p>
                  {appVersion && (
                    <span className="font-mono text-[10px] text-3">v{appVersion}</span>
                  )}
                </div>

                {/* Auto-update toggle */}
                <button
                  onClick={onToggleAutoUpdate}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors hover:bg-raised mb-1"
                >
                  <span className="text-xs text-2">Auto-update</span>
                  <div
                    className="relative flex-shrink-0 transition-colors duration-200"
                    style={{
                      width: 28, height: 16, borderRadius: 8,
                      backgroundColor: autoUpdate ? '#0ea5e9' : 'rgb(var(--border))',
                    }}
                  >
                    <div
                      className="absolute top-0.5 transition-transform duration-200"
                      style={{
                        width: 12, height: 12, borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transform: autoUpdate ? 'translateX(14px)' : 'translateX(2px)',
                      }}
                    />
                  </div>
                </button>

                {/* Status row */}
                {updaterStatus.status !== 'idle' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-1">
                    {updaterStatus.status === 'checking' && (
                      <RefreshCw size={11} className="text-3 animate-spin shrink-0" />
                    )}
                    {updaterStatus.status === 'available' && (
                      <ArrowUpCircle size={11} className="text-sky-500 shrink-0" />
                    )}
                    {updaterStatus.status === 'downloading' && (
                      <Download size={11} className="text-sky-500 shrink-0" />
                    )}
                    {updaterStatus.status === 'ready' && (
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    )}
                    {updaterStatus.status === 'not-available' && (
                      <CheckCircle2 size={11} className="text-3 shrink-0" />
                    )}
                    {updaterStatus.status === 'error' && (
                      <AlertCircle size={11} className="text-red-500/70 shrink-0" />
                    )}
                    <span className="text-[11px] text-3 truncate">
                      {updaterStatus.status === 'checking' && 'Checking for updates…'}
                      {updaterStatus.status === 'available' && `v${updaterStatus.version} available`}
                      {updaterStatus.status === 'downloading' && `Downloading… ${updaterStatus.percent ?? 0}%`}
                      {updaterStatus.status === 'ready' && `v${updaterStatus.version} ready to install`}
                      {updaterStatus.status === 'not-available' && 'Up to date'}
                      {updaterStatus.status === 'error' && (updaterStatus.message ?? 'Update error')}
                    </span>
                  </div>
                )}

                {/* Action button */}
                {updaterStatus.status === 'ready' ? (
                  <button
                    onClick={() => { onInstallUpdate(); setSettingsOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  >
                    <Download size={13} />
                    Install & Restart
                  </button>
                ) : (
                  <button
                    onClick={onCheckForUpdates}
                    disabled={updaterStatus.status === 'checking' || updaterStatus.status === 'downloading'}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-2 hover:bg-raised hover:text-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={13} className={updaterStatus.status === 'checking' ? 'animate-spin' : ''} />
                    Check for Updates
                  </button>
                )}
              </div>

              <div className="mx-3 border-t border-red-500/20" />

              <div className="px-2 py-2">
                <button
                  onClick={() => { onDisconnect(); setSettingsOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut size={13} />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Add favourite picker — fixed to avoid overflow clipping from scroll container */}
      {addFavOpen && addFavPos && (
        <div
          ref={addFavPanelRef}
          className="fixed z-[999] w-64 rounded-xl shadow-2xl border border-theme overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ left: addFavPos.x, top: addFavPos.y, backgroundColor: 'rgb(var(--bg-base))' }}
        >
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-[10px] font-semibold text-3 uppercase tracking-wider mb-2">Add favourite</p>
            <div className="relative mb-2">
              <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
              <input
                type="text"
                value={addFavSearch}
                onChange={e => setAddFavSearch(e.target.value)}
                placeholder="Search services..."
                className="sidebar-search pl-7 text-xs w-full"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto mx-2 mb-2 rounded-lg border border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
            {filteredAvailable.length === 0 ? (
              <p className="text-xs text-4 px-3 py-4 text-center">
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
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-2 hover:bg-overlay transition-colors"
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: iconMode === 'aws' ? 'transparent' : hexToRgba(hex, 0.15) }}
                    >
                      {iconMode === 'aws'
                        ? <AwsServiceIcon service={svc} size={20} />
                        : <Icon size={14} style={{ color: hex }} />
                      }
                    </span>
                    <span className="truncate">{SERVICE_CONFIG[svc].label}</span>
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
          className="fixed z-[999] pointer-events-none select-none"
          style={{ left: 80, top: tooltip.y, transform: 'translateY(-50%)' }}
        >
          <div
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap text-1"
            style={{ backgroundColor: 'rgb(var(--bg-overlay))' }}
          >
            {tooltip.text}
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-[999] bg-base border border-theme rounded-xl shadow-2xl py-1 min-w-[170px] animate-in fade-in zoom-in-95 duration-100"
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
          <button
            onClick={() => { onToggleFavourite(contextMenu.service); setContextMenu(null) }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-3 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Star size={13} className="shrink-0" />
            Remove from favourites
          </button>
        </div>
      )}
    </>
  )
}
