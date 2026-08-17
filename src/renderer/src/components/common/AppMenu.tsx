import { useEffect, useRef } from 'react'
import { LayoutGrid, RefreshCw, Plus, Settings, Link2, Power, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Item {
  label: string
  icon: LucideIcon
  onClick: () => void
  /** Shows the trailing chevron — the item opens something rather than acting. */
  opens?: boolean
  disabled?: boolean
}

interface Props {
  onClose: () => void
  onShowServices: () => void
  onNewTab: () => void
  onRefresh: () => void
  refreshing: boolean
  onOpenSettings: () => void
  onDisconnect: () => void
}

/**
 * The application menu, anchored under the brand button. Everything the old
 * vertical rail carried lives here or in Settings.
 */
export default function AppMenu({
  onClose,
  onShowServices,
  onNewTab,
  onRefresh,
  refreshing,
  onOpenSettings,
  onDisconnect,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = (fn: () => void) => () => {
    fn()
    onClose()
  }

  const items: Item[] = [
    { label: 'All Services', icon: LayoutGrid, onClick: run(onShowServices), opens: true },
    { label: 'New Tab', icon: Plus, onClick: run(onNewTab) },
    { label: refreshing ? 'Refreshing…' : 'Refresh', icon: RefreshCw, onClick: run(onRefresh), disabled: refreshing },
    { label: 'Settings', icon: Settings, onClick: run(onOpenSettings), opens: true },
  ]

  return (
    <>
      {/* Click-away catcher, below the panel but above the app. */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={panelRef}
        className="popover absolute z-50 flex flex-col gap-px"
        style={{ top: 'calc(var(--titlebar-h) + 1px)', left: 6, width: 214, animation: 'stackview-fade-in 0.12s ease-out' }}
      >
        {items.map(item => {
          const Icon = item.icon
          return (
            <button key={item.label} onClick={item.onClick} disabled={item.disabled} className="menu-item disabled:opacity-50">
              <Icon size={13} className={`shrink-0 text-3 ${refreshing && item.icon === RefreshCw ? 'animate-spin' : ''}`} />
              <span className="flex-1 min-w-0 text-left">{item.label}</span>
              {item.opens && <ChevronRight size={11} className="shrink-0 text-4" />}
            </button>
          )
        })}

        <div className="h-px mx-0.5 my-1" style={{ backgroundColor: 'rgb(var(--border))' }} />

        <button onClick={run(onDisconnect)} className="menu-item">
          <Link2 size={13} className="shrink-0 text-3" />
          <span className="flex-1 min-w-0 text-left text-2">Disconnect</span>
        </button>
        <button onClick={() => window.electronAPI.close()} className="menu-item">
          <Power size={13} className="shrink-0 text-3" />
          <span className="flex-1 min-w-0 text-left text-2">Quit StackView</span>
        </button>
      </div>
    </>
  )
}
