import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Search, CornerDownLeft, Star } from 'lucide-react'
import type { Service, IconMode } from '../../types'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../../services/serviceConfig'
import { AwsServiceIcon } from './AwsServiceIcons'

/** Modifier key label for shortcuts on the current platform. */
export const MOD_KEY = window.electronAPI.platform === 'darwin' ? '⌘' : 'Ctrl'

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Lower score = better match; null = no match. */
function matchScore(svc: Service, q: string): number | null {
  const meta = SERVICE_CONFIG[svc]
  const label = meta.label.toLowerCase()
  const name = meta.name.toLowerCase()
  if (label.startsWith(q) || name.startsWith(q)) return 0
  if (label.includes(q) || name.includes(q)) return 1
  if (svc.includes(q)) return 2
  if (meta.description.toLowerCase().includes(q) || meta.features.some(f => f.toLowerCase().includes(q))) return 3
  return null
}

interface Props {
  open: boolean
  onClose: () => void
  favouriteServices: Service[]
  activeService: Service | null
  iconMode: IconMode
  /** Open the service in the current tab (or switch to its existing tab) */
  onSelect: (svc: Service) => void
  onOpenInNewTab: (svc: Service) => void
}

export default function CommandPalette({
  open,
  onClose,
  favouriteServices,
  activeService,
  iconMode,
  onSelect,
  onOpenInNewTab,
}: Props) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const q = query.trim().toLowerCase()

  // Favourites first when browsing; ranked matches when searching.
  const results = useMemo<{ favourites: Service[]; others: Service[] }>(() => {
    if (q) {
      const ranked = ALL_SERVICES_ORDERED
        .map(svc => ({ svc, score: matchScore(svc, q) }))
        .filter((r): r is { svc: Service; score: number } => r.score !== null)
        .sort((a, b) => a.score - b.score)
        .map(r => r.svc)
      return { favourites: [], others: ranked }
    }
    return {
      favourites: favouriteServices,
      others: ALL_SERVICES_ORDERED.filter(s => !favouriteServices.includes(s)),
    }
  }, [q, favouriteServices])

  const flat = useMemo(() => [...results.favourites, ...results.others], [results])

  // Focus the search field as soon as the palette mounts (before any further
  // keystrokes are handled), and on close restore focus and reset the query.
  useLayoutEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    return () => {
      setQuery('')
      setActiveIdx(0)
      returnFocusRef.current?.focus?.()
    }
  }, [open])

  useEffect(() => { setActiveIdx(0) }, [q])

  // Keep the highlighted row in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  if (!open) return null

  const choose = (svc: Service, newTab: boolean) => {
    onClose()
    if (newTab) onOpenInNewTab(svc)
    else onSelect(svc)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => (flat.length ? (i + 1) % flat.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => (flat.length ? (i - 1 + flat.length) % flat.length : 0))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIdx(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIdx(Math.max(0, flat.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const svc = flat[activeIdx]
      if (svc) choose(svc, e.ctrlKey || e.metaKey)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Tab') {
      // Focus stays in the search field while the palette is open
      e.preventDefault()
    }
  }

  const renderRow = (svc: Service, idx: number) => {
    const meta = SERVICE_CONFIG[svc]
    const Icon = meta.icon
    const isActive = idx === activeIdx
    const isCurrent = svc === activeService
    return (
      <div
        key={svc}
        id={`palette-opt-${svc}`}
        data-idx={idx}
        role="option"
        aria-selected={isActive}
        onMouseMove={() => { if (!isActive) setActiveIdx(idx) }}
        onMouseDown={e => e.preventDefault()}
        onClick={e => choose(svc, e.ctrlKey || e.metaKey)}
        className={`flex items-center gap-3 px-3 py-2 mx-1.5 rounded-lg cursor-pointer select-none ${
          isActive ? 'bg-raised' : ''
        }`}
      >
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconMode === 'aws' ? 'transparent' : hexToRgba(meta.hex, 0.14) }}
        >
          {iconMode === 'aws'
            ? <AwsServiceIcon service={svc} size={24} />
            : <Icon size={14} style={{ color: meta.hex }} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-1 truncate">{meta.name}</p>
          {q && <p className="text-[11px] text-3 truncate">{meta.description}</p>}
        </div>
        {isCurrent && <span className="badge-gray text-[10px] py-0">Current</span>}
        <span className="font-mono text-[10px] text-3 shrink-0">{meta.label}</span>
        <CornerDownLeft size={13} className={`shrink-0 text-3 ${isActive ? '' : 'invisible'}`} aria-hidden />
      </div>
    )
  }

  return (
    <div
      className="modal-backdrop modal-scrim fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to service"
        className="popover w-full max-w-[560px] overflow-hidden shadow-2xl"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-theme">
          <Search size={16} className="text-3 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Go to service…"
            className="flex-1 h-12 bg-transparent text-sm text-1 placeholder:text-[rgb(var(--text-4))] focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={flat[activeIdx] ? `palette-opt-${flat[activeIdx]}` : undefined}
            aria-autocomplete="list"
            spellCheck={false}
          />
          <span className="kbd">Esc</span>
        </div>

        <div ref={listRef} id="palette-list" role="listbox" aria-label="Services" className="max-h-[min(400px,55vh)] overflow-y-auto py-1.5">
          {flat.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-2">No services match “{query}”</p>
              <p className="text-xs text-3 mt-1">Try a service name like “S3” or “queue”.</p>
            </div>
          ) : (
            <>
              {results.favourites.length > 0 && (
                <>
                  <p className="section-label px-4 pt-2 pb-1.5 flex items-center gap-1.5">
                    <Star size={10} className="text-amber-400" fill="currentColor" aria-hidden /> Favourites
                  </p>
                  {results.favourites.map((svc, i) => renderRow(svc, i))}
                </>
              )}
              {!q && results.favourites.length > 0 && (
                <p className="section-label px-4 pt-3 pb-1.5">All services</p>
              )}
              {results.others.map((svc, i) => renderRow(svc, results.favourites.length + i))}
            </>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-theme text-[11px] text-3">
          <span className="flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> Navigate</span>
          <span className="flex items-center gap-1.5"><span className="kbd">↵</span> Open</span>
          <span className="flex items-center gap-1.5"><span className="kbd">{MOD_KEY} ↵</span> New tab</span>
        </div>
      </div>
    </div>
  )
}
