import { useMemo, useState } from 'react'
import { Search, ChevronRight, RefreshCw } from 'lucide-react'
import TitleBar from '../components/common/TitleBar'
import { AwsServiceIcon } from '../components/common/AwsServiceIcons'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../services/serviceConfig'
import type { ServiceCategory } from '../services/serviceConfig'
import { svcSolid, svcTint } from '../services/serviceHue'
import { countNoun } from '../services/serviceCounts'
import { useServiceViewData } from './ServiceViewContext'
import { ShellSettingsMenu, StatTiles } from './parts'
import type { ShellProps } from './types'
import type { Service } from '../types'

/**
 * 1a Console — "light, structured, auditable. Neutral chrome, one accent, tables
 * over cards." Labelled sidebar with Pinned and Categories, a recently-used row and
 * the full service table; a breadcrumb bar over each service.
 */
export default function ConsoleShell(p: ShellProps) {
  const activeTab = p.tabs.find(t => t.id === p.activeTabId) ?? null
  const view = useServiceViewData()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ServiceCategory | null>(null)

  const categories = useMemo(() => {
    const m = new Map<ServiceCategory, number>()
    for (const svc of ALL_SERVICES_ORDERED) {
      const c = SERVICE_CONFIG[svc].category
      m.set(c, (m.get(c) ?? 0) + 1)
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [])

  const visibleServices = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ALL_SERVICES_ORDERED.filter(svc => {
      const m = SERVICE_CONFIG[svc]
      if (category && m.category !== category) return false
      if (!q) return true
      return m.label.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) ||
        m.capability.toLowerCase().includes(q)
    })
  }, [search, category])

  const recent = p.pinnedServices.slice(0, 4)

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-app">
      <TitleBar
        tabs={p.tabs} activeTabId={p.activeTabId} onSwitch={p.onSwitchTab}
        onClose={p.onCloseTab} onNew={p.onNewTab} onOpenInNewTab={p.onOpenInNewTab}
        onReorder={p.onReorderTabs}
      />

      {/* Toolbar — endpoint, region, search, settings */}
      <div className="shrink-0 flex items-center gap-3 px-4 border-b border-theme bg-base" style={{ height: 'var(--row-h)' }}>
        <span className="t-body font-semibold text-1 shrink-0">
          {activeTab?.service ? SERVICE_CONFIG[activeTab.service].name : 'All services'}
        </span>
        <span className="flex items-center gap-1.5 shrink-0 px-2 py-1 r-control bw border-theme" style={{ borderStyle: 'solid' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="font-mono-theme t-body text-2">{p.settings.endpoint.replace(/^https?:\/\//, '')}</span>
        </span>
        <span className="font-mono-theme t-body text-2 shrink-0 px-2 py-1 r-control bw border-theme" style={{ borderStyle: 'solid' }}>
          {activeTab?.service ? p.effectiveRegion(activeTab.service) : p.settings.region}
        </span>
        <div className="flex-1" />
        <div className="relative shrink-0" style={{ width: 260 }}>
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services"
            className="sidebar-search"
          />
        </div>
        <button onClick={p.onRefresh} disabled={p.refreshing} title="Refresh"
          className="btn-ghost !px-2 !py-1.5 disabled:opacity-40">
          <RefreshCw size={14} className={p.refreshing ? 'animate-spin' : ''} />
        </button>
        <ShellSettingsMenu p={p} align="right" />
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Pinned + Categories sidebar */}
        <nav className="shrink-0 flex flex-col border-r border-theme bg-base overflow-y-auto" style={{ width: 210 }}>
          <div className="px-4 pt-4 pb-2">
            <p className="t-label uppercase text-3 mb-2">Pinned</p>
            <div className="space-y-0.5">
              {p.pinnedServices.map(svc => {
                const m = SERVICE_CONFIG[svc]
                const active = activeTab?.service === svc
                return (
                  <button
                    key={svc} onClick={() => p.onSelectService(svc)}
                    className={`w-full flex items-center gap-2.5 px-2 r-control transition-colors text-left
                      ${active ? 'row-selected text-1 font-semibold' : 'text-2 hover:bg-raised'}`}
                    style={{ height: 'var(--row-h-sm)' }}
                  >
                    <span className="svc-chip shrink-0" style={{ ['--svc' as string]: svcSolid(m.hex) }} />
                    <span className="t-body truncate flex-1">{m.label}</span>
                    <span className="font-mono-theme text-3 shrink-0" style={{ fontSize: 10 }}>
                      {p.counts[svc] ?? ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mx-4 border-t border-theme" />

          <div className="px-4 pt-3 pb-4">
            <p className="t-label uppercase text-3 mb-2">Categories</p>
            <div className="space-y-0.5">
              {categories.map(([c, n]) => (
                <button
                  key={c}
                  onClick={() => setCategory(prev => (prev === c ? null : c))}
                  className={`w-full flex items-center justify-between gap-2 px-2 r-control transition-colors text-left
                    ${category === c ? 'row-selected text-1 font-semibold' : 'text-2 hover:bg-raised'}`}
                  style={{ height: 'var(--row-h-sm)' }}
                >
                  <span className="t-body truncate">{c}</span>
                  <span className="font-mono-theme text-3" style={{ fontSize: 10 }}>{n}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Work surface */}
        <main className="flex-1 min-w-0 flex flex-col bg-app">
          {p.tabs.map(tab => (
            <div key={tab.id} className="absolute-none flex-1 min-h-0 flex flex-col"
              style={{ display: p.activeTabId === tab.id ? 'flex' : 'none' }}>
              {tab.service ? (
                <>
                  {/* Breadcrumb */}
                  <div className="shrink-0 flex items-center gap-1.5 px-4 border-b border-theme bg-base" style={{ height: 'var(--row-h-sm)' }}>
                    <button onClick={p.onSwitchService} className="t-body text-3 hover:text-1 transition-colors">Services</button>
                    <ChevronRight size={11} className="text-4" />
                    <span className="t-body text-1 font-semibold">{SERVICE_CONFIG[tab.service].name}</span>
                    {view.breadcrumb?.map(b => (
                      <span key={b} className="flex items-center gap-1.5">
                        <ChevronRight size={11} className="text-4" />
                        <span className="t-body text-2 font-mono-theme">{b}</span>
                      </span>
                    ))}
                  </div>
                  {view.stats?.length ? <StatTiles stats={view.stats} /> : null}
                  <div className="flex-1 min-h-0 flex flex-col">{p.renderService(tab)}</div>
                </>
              ) : (
                <Launcher
                  p={p} services={visibleServices} recent={recent}
                  category={category} onClearCategory={() => setCategory(null)}
                />
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}

function Launcher({ p, services, recent, category, onClearCategory }: {
  p: ShellProps; services: Service[]; recent: Service[]
  category: ServiceCategory | null; onClearCategory: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {recent.length > 0 && !category && (
        <>
          <p className="t-label uppercase text-3 mb-2.5">Recently used</p>
          <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {recent.map(svc => {
              const m = SERVICE_CONFIG[svc]
              return (
                <button key={svc} onClick={() => p.onSelectService(svc)}
                  className="card elev flex items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-raised">
                  <span className="w-9 h-9 r-control flex items-center justify-center shrink-0"
                    style={{ backgroundColor: svcTint(m.hex, 0.15) }}>
                    {p.iconMode === 'aws'
                      ? <AwsServiceIcon service={svc} size={24} />
                      : <m.icon size={17} style={{ color: svcSolid(m.hex) }} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block t-body font-semibold text-1 truncate">{m.label}</span>
                    <span className="block t-body text-3 font-mono-theme truncate">
                      {countNoun(svc, p.counts[svc])}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="flex items-center gap-2 mb-2.5">
        <p className="t-label uppercase text-3">
          {category ? `${category} · ${services.length}` : `All services · ${services.length}`}
        </p>
        {category && (
          <button onClick={onClearCategory} className="t-body text-accent hover:underline">clear</button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
              {['Service', 'Capability', 'Category', 'Resources'].map((h, i) => (
                <th key={h}
                  className="t-label uppercase text-3 font-semibold px-4 py-2.5"
                  style={{ textAlign: i === 3 ? 'right' : 'left', borderBottom: 'var(--border-width) solid rgb(var(--border))' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map(svc => {
              const m = SERVICE_CONFIG[svc]
              return (
                <tr key={svc}
                  onClick={() => p.onSelectService(svc)}
                  onAuxClick={e => { if (e.button === 1) p.onOpenInNewTab(svc) }}
                  className="cursor-pointer transition-colors hover:bg-raised"
                  style={{ borderBottom: 'var(--border-width) solid rgb(var(--border-sub))' }}>
                  <td className="px-4" style={{ height: 'var(--row-h)' }}>
                    <span className="flex items-center gap-2.5">
                      <span className="w-6 h-6 r-control flex items-center justify-center shrink-0"
                        style={{ backgroundColor: svcTint(m.hex, 0.15) }}>
                        {p.iconMode === 'aws'
                          ? <AwsServiceIcon service={svc} size={18} />
                          : <m.icon size={13} style={{ color: svcSolid(m.hex) }} />}
                      </span>
                      <span className="t-body font-semibold text-1">{m.name}</span>
                    </span>
                  </td>
                  <td className="px-4 t-body text-2">{m.capability}</td>
                  <td className="px-4 t-body text-3">{m.category}</td>
                  <td className="px-4 t-body font-mono-theme text-2" style={{ textAlign: 'right' }}>
                    {p.counts[svc] ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
