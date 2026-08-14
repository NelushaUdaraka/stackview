import { useMemo } from 'react'
import TitleBar from '../components/common/TitleBar'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../services/serviceConfig'
import type { ServiceCategory } from '../services/serviceConfig'
import { countNoun } from '../services/serviceCounts'
import { useServiceViewData } from './ServiceViewContext'
import { ShellSettingsMenu, StatTiles } from './parts'
import type { ShellProps } from './types'
import type { Service } from '../types'

/**
 * 2a Blueprint — "drafting-table light: the stack drawn as a diagram. Resources show
 * their wiring, not just their rows." The launcher is a sheet: services grouped into
 * columns by category, drawn as nodes on a graph grid with connectors between stages.
 */
export default function BlueprintShell(p: ShellProps) {
  const view = useServiceViewData()
  const activeTab = p.tabs.find(t => t.id === p.activeTabId) ?? null

  // Stage the diagram left-to-right: what receives, what computes, what stores,
  // what observes. Categories the stack does not use are dropped from the sheet.
  const STAGES: { title: string; cats: ServiceCategory[] }[] = [
    { title: 'Ingress', cats: ['Networking', 'Messaging'] },
    { title: 'Compute', cats: ['Compute'] },
    { title: 'State', cats: ['Storage', 'Analytics'] },
    { title: 'Control', cats: ['Security', 'Observability', 'Management'] },
  ]

  const inUse = useMemo(
    () => ALL_SERVICES_ORDERED.filter(s => (p.counts[s] ?? 0) > 0),
    [p.counts])

  const stages = useMemo(() => STAGES.map(st => ({
    ...st,
    services: (inUse.length ? inUse : ALL_SERVICES_ORDERED)
      .filter(s => st.cats.includes(SERVICE_CONFIG[s].category)),
  })).filter(st => st.services.length > 0), [inUse])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-app">
      <div className="shrink-0 flex items-center border-b border-theme bg-base">
        <div className="flex-1 min-w-0">
          <TitleBar tabs={p.tabs} activeTabId={p.activeTabId} onSwitch={p.onSwitchTab}
            onClose={p.onCloseTab} onNew={p.onNewTab} onOpenInNewTab={p.onOpenInNewTab}
            onReorder={p.onReorderTabs} />
        </div>
        <span className="shrink-0 px-3 font-mono-theme t-body text-3">
          ◆ {p.settings.endpoint.replace(/^https?:\/\//, '')} | {activeTab?.service ? p.effectiveRegion(activeTab.service) : p.settings.region}
        </span>
        <ShellSettingsMenu p={p} align="right" />
      </div>

      <div className="flex-1 flex min-h-0">
        <nav className="shrink-0 flex flex-col border-r border-theme bg-base overflow-y-auto" style={{ width: 196 }}>
          <p className="t-label uppercase text-3 px-4 pt-3 pb-2">Sheets</p>
          {p.pinnedServices.map(svc => {
            const active = activeTab?.service === svc
            return (
              <button key={svc} onClick={() => p.onSelectService(svc)}
                className={`w-full flex items-center justify-between gap-2 px-4 text-left transition-colors
                  ${active ? 'row-selected text-1 font-semibold' : 'text-2 hover:bg-raised'}`}
                style={{ height: 'var(--row-h-sm)' }}>
                <span className="t-body truncate">{SERVICE_CONFIG[svc].label}</span>
                <span className="font-mono-theme t-body text-3">{p.counts[svc] ?? '—'}</span>
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
                  <div className="shrink-0 flex items-center gap-3 px-5 border-b border-theme bg-base" style={{ height: 'var(--row-h-sm)' }}>
                    <span className="t-label uppercase text-3">
                      Sheet 02 — {SERVICE_CONFIG[tab.service].label}
                    </span>
                    {view.breadcrumb?.length ? (
                      <span className="font-mono-theme t-body text-2">/ {view.breadcrumb.join(' / ')}</span>
                    ) : null}
                  </div>
                  {view.stats?.length ? <StatTiles stats={view.stats} /> : null}
                  <div className="flex-1 min-h-0 flex flex-col surface-grid">{p.renderService(tab)}</div>
                </>
              ) : (
                <div className="flex-1 overflow-auto surface-grid">
                  <div className="flex items-baseline gap-3 px-6 pt-5 pb-1">
                    <h2 className="t-title text-1">This stack</h2>
                    <span className="t-label uppercase text-3">
                      Sheet 01 — topology · services in use {inUse.length} of {ALL_SERVICES_ORDERED.length}
                    </span>
                  </div>

                  <div className="flex items-stretch gap-0 px-6 py-5 min-w-max">
                    {stages.map((st, si) => (
                      <div key={st.title} className="flex items-stretch">
                        <div style={{ minWidth: 210 }}>
                          <p className="t-label uppercase text-3 mb-2">{st.title}</p>
                          <div className="flex flex-col gap-2">
                            {st.services.map(svc => (
                              <Node key={svc} svc={svc} p={p} />
                            ))}
                          </div>
                        </div>
                        {si < stages.length - 1 && <Connector />}
                      </div>
                    ))}
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

function Node({ svc, p }: { svc: Service; p: ShellProps }) {
  const m = SERVICE_CONFIG[svc]
  const Icon = m.icon
  return (
    <button onClick={() => p.onSelectService(svc)}
      className="flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors bw border-theme hover:bg-raised"
      style={{ borderStyle: 'solid', backgroundColor: 'rgb(var(--bg-base))' }}>
      <Icon size={15} className="shrink-0 text-accent" />
      <span className="min-w-0 flex-1">
        <span className="block t-body font-semibold text-1 truncate">{m.label}</span>
        <span className="block t-body text-3 font-mono-theme truncate">{countNoun(svc, p.counts[svc])}</span>
      </span>
    </button>
  )
}

/** Drawn wiring between stages — the point of this direction. */
function Connector() {
  return (
    <div className="flex items-center justify-center shrink-0" style={{ width: 44 }} aria-hidden>
      <svg width="44" height="16" viewBox="0 0 44 16">
        <line x1="2" y1="8" x2="34" y2="8" stroke="rgb(var(--text-4))" strokeWidth="1.5" />
        <polygon points="34,3 43,8 34,13" fill="rgb(var(--text-4))" />
      </svg>
    </div>
  )
}
