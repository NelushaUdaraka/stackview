import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import TitleBar from '../components/common/TitleBar'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../services/serviceConfig'
import { svcSolid } from '../services/serviceHue'
import { useServiceViewData } from './ServiceViewContext'
import { ShellSettingsMenu, StatTiles } from './parts'
import type { ShellProps } from './types'

/**
 * 1b Graphite — "dark, keyboard-first, monochrome with one accent. Command palette
 * is the primary navigation." The launcher *is* the palette: type to filter, Enter
 * to open, Shift+Enter for a new tab. A narrow icon rail replaces the labelled nav.
 */
export default function GraphiteShell(p: ShellProps) {
  const view = useServiceViewData()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const activeTab = p.tabs.find(t => t.id === p.activeTabId) ?? null
  const onLauncher = activeTab != null && activeTab.service === null

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_SERVICES_ORDERED
    return ALL_SERVICES_ORDERED.filter(s => {
      const m = SERVICE_CONFIG[s]
      return m.label.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) ||
        m.capability.toLowerCase().includes(q)
    })
  }, [query])

  useEffect(() => { setCursor(0) }, [query])
  useEffect(() => { if (onLauncher) inputRef.current?.focus() }, [onLauncher])

  // ⌘K / Ctrl+K focuses the palette from anywhere, as the mock's hint advertises.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (!onLauncher) p.onNewTab()
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onLauncher, p])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter' && results[cursor]) {
      e.preventDefault()
      if (e.shiftKey) p.onOpenInNewTab(results[cursor])
      else p.onSelectService(results[cursor])
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-app">
      <div className="shrink-0 flex items-center border-b border-theme bg-base">
        <div className="flex-1 min-w-0">
          <TitleBar tabs={p.tabs} activeTabId={p.activeTabId} onSwitch={p.onSwitchTab}
            onClose={p.onCloseTab} onNew={p.onNewTab} onOpenInNewTab={p.onOpenInNewTab}
            onReorder={p.onReorderTabs} />
        </div>
        <span className="flex items-center gap-1.5 shrink-0 px-3 font-mono-theme t-body text-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          {p.settings.endpoint.replace(/^https?:\/\//, '')} · {activeTab?.service ? p.effectiveRegion(activeTab.service) : p.settings.region}
        </span>
        <ShellSettingsMenu p={p} align="right" />
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Icon rail — deliberately mute; navigation is meant to happen in the palette. */}
        <nav className="shrink-0 flex flex-col items-center gap-1.5 py-3 border-r border-theme bg-base overflow-y-auto scrollbar-none" style={{ width: 56 }}>
          {p.pinnedServices.map(svc => {
            const m = SERVICE_CONFIG[svc]
            const active = activeTab?.service === svc
            return (
              <button key={svc} onClick={() => p.onSelectService(svc)} title={m.label}
                className="w-9 h-9 r-control flex items-center justify-center transition-colors shrink-0"
                style={{
                  backgroundColor: active ? 'rgb(var(--accent-soft))' : 'rgb(var(--bg-raised))',
                  color: active ? 'rgb(var(--accent))' : svcSolid(m.hex),
                }}>
                <m.icon size={16} />
              </button>
            )
          })}
        </nav>

        <main className="flex-1 min-w-0 flex flex-col">
          {p.tabs.map(tab => (
            <div key={tab.id} className="flex-1 min-h-0 flex flex-col"
              style={{ display: p.activeTabId === tab.id ? 'flex' : 'none' }}>
              {tab.service ? (
                <>
                  <div className="shrink-0 flex items-center gap-2 px-4 border-b border-theme" style={{ height: 'var(--row-h-sm)' }}>
                    <span className="t-title text-1">{SERVICE_CONFIG[tab.service].label}</span>
                    <span className="font-mono-theme t-body text-3">{p.counts[tab.service] ?? ''}</span>
                    {view.breadcrumb?.length ? (
                      <span className="font-mono-theme t-body text-3">/ {view.breadcrumb.join(' / ')}</span>
                    ) : null}
                  </div>
                  {view.stats?.length ? <StatTiles stats={view.stats} /> : null}
                  <div className="flex-1 min-h-0 flex flex-col">{p.renderService(tab)}</div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 py-10">
                  <div className="w-full" style={{ maxWidth: 660 }}>
                    <div className="relative">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-3" />
                      <input
                        ref={inputRef} value={query} onKeyDown={onKey}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Jump to a service, queue, bucket, function…"
                        className="w-full r-container bw border-theme t-body text-1 elev"
                        style={{
                          borderStyle: 'solid', paddingLeft: 42, paddingRight: 56,
                          height: 54, backgroundColor: 'rgb(var(--bg-raised))', outline: 'none',
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-theme t-label text-3 px-1.5 py-0.5 r-control"
                        style={{ backgroundColor: 'rgb(var(--bg-overlay))' }}>⌘K</span>
                    </div>

                    <div className="flex items-center justify-between mt-8 mb-3">
                      <p className="t-label uppercase text-3">All services · {results.length}</p>
                      <p className="t-body text-4">Type to filter · ↵ to open · ⇧↵ new tab</p>
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                      {results.map((svc, i) => {
                        const m = SERVICE_CONFIG[svc]
                        return (
                          <button key={svc}
                            onClick={() => p.onSelectService(svc)}
                            onMouseEnter={() => setCursor(i)}
                            className="flex items-center gap-3 px-3 r-container bw border-theme transition-colors text-left"
                            style={{
                              borderStyle: 'solid', height: 'var(--row-h)',
                              backgroundColor: i === cursor ? 'rgb(var(--accent-soft))' : 'rgb(var(--bg-raised))',
                            }}>
                            <span className="w-6 h-6 r-control shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: 'rgb(var(--bg-overlay))', color: svcSolid(m.hex) }}>
                              <m.icon size={13} />
                            </span>
                            <span className="t-body font-semibold text-1 flex-1 truncate">{m.label}</span>
                            <span className="font-mono-theme t-body text-3">{p.counts[svc] ?? '—'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}
