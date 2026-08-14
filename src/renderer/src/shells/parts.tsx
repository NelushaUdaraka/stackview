import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Settings as SettingsIcon, RefreshCw, LogOut, ArrowLeftRight, Image as ImageIcon, Download, ArrowUpCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import ThemePicker from '../components/common/ThemePicker'
import { AWS_REGIONS } from '../constants'
import type { InspectorSection, ShellProps, StatTile } from './types'

/**
 * Primitives the eight shells share. Each shell arranges these differently — Console
 * puts stat tiles under a breadcrumb, Terminal packs them into a gutter row, Slate
 * Split moves the same rows into a docked inspector — but the markup is written once.
 */

const TONE_CLASS = {
  default: 'text-1',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
} as const

/** The stat row: Available / In flight / Delayed / Retention. */
export function StatTiles({ stats, dense = false }: { stats: StatTile[]; dense?: boolean }) {
  if (!stats.length) return null
  return (
    <div
      className="grid border-theme bw"
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`, borderWidth: 0, borderTopWidth: 'var(--border-width)' }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={dense ? 'px-3 py-2' : 'px-4 py-3'}
          style={{
            borderLeft: i === 0 ? undefined : 'var(--border-width) solid rgb(var(--border))',
          }}
        >
          <p className="t-label uppercase text-3 mb-1">{s.label}</p>
          <p className="flex items-baseline gap-1.5">
            <span
              className={`font-mono-theme font-bold ${TONE_CLASS[s.tone ?? 'default']}`}
              style={{ fontSize: dense ? '18px' : '24px', lineHeight: 1.1 }}
            >
              {s.value}
            </span>
            {s.unit && <span className="t-body text-3">{s.unit}</span>}
          </p>
        </div>
      ))}
    </div>
  )
}

/** Grouped key/value rows — Slate Split's docked inspector, Terminal's preview pane. */
export function InspectorRows({ sections }: { sections: InspectorSection[] }) {
  return (
    <>
      {sections.map(sec => (
        <div key={sec.label} className="px-4 py-3" style={{ borderBottom: 'var(--border-width) solid rgb(var(--border))' }}>
          <p className="t-label uppercase text-3 mb-2">{sec.label}</p>
          <div className="space-y-1.5">
            {sec.rows.map(r => (
              <div key={r.key} className="flex items-baseline justify-between gap-3">
                <span className="t-body text-2 truncate">{r.key}</span>
                <span className={`t-body font-mono-theme shrink-0 ${TONE_CLASS[r.tone ?? 'default']}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

/** Empty-state used by shells when a tab has a service but no resource selected. */
export function ShellEmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <p className="t-title text-2 mb-2">{title}</p>
      {hint && <p className="t-body text-3 max-w-sm leading-relaxed">{hint}</p>}
    </div>
  )
}

type SettingsSlice = Pick<ShellProps,
  | 'settings' | 'theme' | 'onSetTheme' | 'iconMode' | 'onToggleIconMode'
  | 'onRefresh' | 'refreshing' | 'onSwitchService' | 'onDisconnect' | 'onRegionChange'
  | 'appVersion' | 'autoUpdate' | 'onToggleAutoUpdate' | 'updaterStatus'
  | 'onCheckForUpdates' | 'onInstallUpdate'>

/**
 * The settings popover. Every direction needs theme switching, region and updates;
 * only the trigger's placement differs, so shells pass their own trigger styling.
 */
export function ShellSettingsMenu({ p, align = 'left', trigger }: {
  p: SettingsSlice
  align?: 'left' | 'right'
  trigger?: (open: boolean) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [regionSearch, setRegionSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setRegionSearch('')
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const regions = AWS_REGIONS.filter(r =>
    r.value.toLowerCase().includes(regionSearch.toLowerCase()) ||
    r.label.toLowerCase().includes(regionSearch.toLowerCase()))

  return (
    <div ref={ref} className="no-drag relative">
      <button onClick={() => setOpen(o => !o)} title="Settings" className="btn-ghost !px-2 !py-1.5">
        {trigger ? trigger(open) : <SettingsIcon size={15} />}
      </button>
      {open && (
        <div
          className="absolute top-full mt-1 z-50 r-container elev overflow-hidden bw border-theme"
          style={{
            backgroundColor: 'rgb(var(--bg-base))', width: 250,
            [align === 'right' ? 'right' : 'left']: 0,
            borderStyle: 'solid', boxShadow: '0 12px 32px rgba(0,0,0,.28)',
          }}
        >
          <div className="px-3 pt-3 pb-2">
            <p className="t-label uppercase text-3 mb-2">Region</p>
            <input
              value={regionSearch}
              onChange={e => setRegionSearch(e.target.value)}
              placeholder="Search regions..."
              className="sidebar-search !pl-3 mb-1.5"
            />
            <div className="max-h-32 overflow-y-auto r-control bw border-theme" style={{ borderStyle: 'solid', backgroundColor: 'rgb(var(--bg-raised))' }}>
              {regions.map(r => (
                <button
                  key={r.value}
                  onClick={() => { p.onRegionChange(r.value); setOpen(false) }}
                  className={`w-full text-left px-2.5 py-1.5 t-body flex items-center justify-between gap-2 transition-colors
                    ${p.settings.region === r.value ? 'bg-accent-soft text-accent font-semibold' : 'text-2 hover:bg-overlay'}`}
                >
                  <span className="truncate">{r.label}</span>
                  <span className="font-mono-theme text-3 shrink-0" style={{ fontSize: 10 }}>{r.value}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mx-3 border-t border-theme" />

          <div className="px-3 pt-3 pb-2">
            <p className="t-label uppercase text-3 mb-2">Appearance</p>
            <ThemePicker theme={p.theme} onSetTheme={t => { p.onSetTheme(t); setOpen(false) }} />
            <button
              onClick={() => { p.onToggleIconMode(); setOpen(false) }}
              className="mt-2 w-full flex items-center gap-2.5 px-2.5 py-2 t-body text-2 hover:bg-raised hover:text-1 r-control transition-colors"
            >
              <ImageIcon size={13} />
              {p.iconMode === 'lucide' ? 'AWS icons' : 'Default icons'}
            </button>
          </div>

          <div className="mx-3 border-t border-theme" />

          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="t-label uppercase text-3">Updates</p>
              {p.appVersion && <span className="font-mono-theme text-3" style={{ fontSize: 10 }}>v{p.appVersion}</span>}
            </div>
            <button onClick={p.onToggleAutoUpdate} className="w-full flex items-center justify-between px-2.5 py-2 r-control hover:bg-raised transition-colors mb-1">
              <span className="t-body text-2">Auto-update</span>
              <div className="relative shrink-0 transition-colors" style={{
                width: 28, height: 16, borderRadius: 8,
                backgroundColor: p.autoUpdate ? 'rgb(var(--accent))' : 'rgb(var(--border))' }}>
                <div className="absolute top-0.5 transition-transform" style={{
                  width: 12, height: 12, borderRadius: '50%',
                  backgroundColor: 'rgb(var(--accent-fg))',
                  transform: p.autoUpdate ? 'translateX(14px)' : 'translateX(2px)' }} />
              </div>
            </button>
            {p.updaterStatus.status !== 'idle' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                {p.updaterStatus.status === 'checking' && <RefreshCw size={11} className="text-3 animate-spin shrink-0" />}
                {p.updaterStatus.status === 'available' && <ArrowUpCircle size={11} className="text-accent shrink-0" />}
                {p.updaterStatus.status === 'downloading' && <Download size={11} className="text-accent shrink-0" />}
                {p.updaterStatus.status === 'ready' && <CheckCircle2 size={11} className="text-ok shrink-0" />}
                {p.updaterStatus.status === 'error' && <AlertCircle size={11} className="text-danger shrink-0" />}
                <span className="t-body text-3 truncate">
                  {p.updaterStatus.status === 'checking' && 'Checking for updates…'}
                  {p.updaterStatus.status === 'available' && 'Update available'}
                  {p.updaterStatus.status === 'downloading' && 'Downloading…'}
                  {p.updaterStatus.status === 'ready' && 'Ready to install'}
                  {p.updaterStatus.status === 'not-available' && 'Up to date'}
                  {p.updaterStatus.status === 'error' && 'Update failed'}
                </span>
              </div>
            )}
            {p.updaterStatus.status === 'ready'
              ? <button onClick={p.onInstallUpdate} className="w-full flex items-center gap-2.5 px-2.5 py-2 t-body text-accent hover:bg-raised r-control transition-colors">
                  <ArrowUpCircle size={13} />Restart and install
                </button>
              : <button onClick={p.onCheckForUpdates} className="w-full flex items-center gap-2.5 px-2.5 py-2 t-body text-2 hover:bg-raised hover:text-1 r-control transition-colors">
                  <Download size={13} />Check for Updates
                </button>}
          </div>

          <div className="mx-3 border-t border-theme" />

          <div className="px-3 pt-3 pb-3 space-y-0.5">
            <button onClick={() => { p.onRefresh(); setOpen(false) }} disabled={p.refreshing}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 t-body text-2 hover:bg-raised hover:text-1 r-control transition-colors disabled:opacity-40">
              <RefreshCw size={13} className={p.refreshing ? 'animate-spin' : ''} />Refresh
            </button>
            <button onClick={() => { p.onSwitchService(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 t-body text-2 hover:bg-raised hover:text-1 r-control transition-colors">
              <ArrowLeftRight size={13} />Browse services
            </button>
            <button onClick={() => { p.onDisconnect(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 t-body text-danger hover:bg-raised r-control transition-colors">
              <LogOut size={13} />Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
