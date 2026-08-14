import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import TitleBar from '../components/common/TitleBar'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../services/serviceConfig'
import { svcSolid } from '../services/serviceHue'
import { countNoun } from '../services/serviceCounts'
import { useServiceViewData } from './ServiceViewContext'
import { InspectorRows, ShellSettingsMenu } from './parts'
import type { ShellProps } from './types'

/**
 * 2b Slate Split — "debugger layout: a permanent right-hand inspector and a bottom
 * raw-payload drawer replace tab switching." The inspector is always docked, so the
 * selected resource's attributes stay visible while you work in the main pane.
 */
export default function SlateShell(p: ShellProps) {
  const view = useServiceViewData()
  const [filter, setFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(true)
  const activeTab = p.tabs.find(t => t.id === p.activeTabId) ?? null

  const services = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return ALL_SERVICES_ORDERED
    return ALL_SERVICES_ORDERED.filter(s =>
      SERVICE_CONFIG[s].label.toLowerCase().includes(q) ||
      SERVICE_CONFIG[s].name.toLowerCase().includes(q))
  }, [filter])

  const withResources = ALL_SERVICES_ORDERED.filter(s => (p.counts[s] ?? 0) > 0).length

  // Inspector: the selected resource when a service has published one, otherwise a
  // summary of the active service, otherwise the endpoint.
  const inspectorSections = view.inspector?.length
    ? view.inspector
    : activeTab?.service
      ? [{
          label: SERVICE_CONFIG[activeTab.service].label,
          rows: [
            { key: 'Endpoint', value: p.settings.endpoint.replace(/^https?:\/\//, '') },
            { key: 'Region', value: p.effectiveRegion(activeTab.service) },
            { key: 'Resources', value: String(p.counts[activeTab.service] ?? '—') },
            { key: 'Category', value: SERVICE_CONFIG[activeTab.service].category },
          ],
        }]
      : [{
          label: 'Endpoint',
          rows: [
            { key: 'Endpoint', value: p.settings.endpoint.replace(/^https?:\/\//, '') },
            { key: 'Region', value: p.settings.region },
            { key: 'Services active', value: `${withResources} of ${ALL_SERVICES_ORDERED.length}` },
          ],
        }]

  const busiest = useMemo(() => ALL_SERVICES_ORDERED
    .map(s => ({ svc: s, n: p.counts[s] ?? 0 }))
    .filter(x => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5), [p.counts])
  const busiestMax = Math.max(1, ...busiest.map(b => b.n))

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-app">
      <div className="shrink-0 flex items-center border-b border-theme bg-base">
        <div className="flex-1 min-w-0">
          <TitleBar tabs={p.tabs} activeTabId={p.activeTabId} onSwitch={p.onSwitchTab}
            onClose={p.onCloseTab} onNew={p.onNewTab} onOpenInNewTab={p.onOpenInNewTab}
            onReorder={p.onReorderTabs} />
        </div>
        <span className="flex items-center gap-1.5 shrink-0 px-3 font-mono-theme t-body text-3">
          <span className="w-1.5 h-1.5 rounded-full bg-ok" />
          {p.settings.endpoint.replace(/^https?:\/\/[^:]*:?/, '')} · {activeTab?.service ? p.effectiveRegion(activeTab.service) : p.settings.region}
        </span>
        <ShellSettingsMenu p={p} align="right" />
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Workspace sidebar */}
        <nav className="shrink-0 flex flex-col border-r border-theme bg-base overflow-y-auto" style={{ width: 218 }}>
          <p className="t-label uppercase text-3 px-4 pt-3 pb-2">Workspace</p>
          <button
            onClick={p.onSwitchService}
            className={`w-full flex items-center justify-between gap-2 px-4 text-left transition-colors
              ${!activeTab?.service ? 'row-selected text-1 font-semibold' : 'text-2 hover:bg-raised'}`}
            style={{ height: 'var(--row-h-sm)' }}>
            <span className="t-body">Services</span>
            <span className="font-mono-theme t-body text-3">{ALL_SERVICES_ORDERED.length}</span>
          </button>
          {p.pinnedServices.map(svc => {
            const m = SERVICE_CONFIG[svc]
            const active = activeTab?.service === svc
            return (
              <button key={svc} onClick={() => p.onSelectService(svc)}
                className={`w-full flex items-center justify-between gap-2 px-4 text-left transition-colors
                  ${active ? 'row-selected text-1 font-semibold' : 'text-2 hover:bg-raised'}`}
                style={{ height: 'var(--row-h-sm)' }}>
                <span className="t-body truncate">{m.label}</span>
                <span className="font-mono-theme t-body text-3 shrink-0">{p.counts[svc] ?? '—'}</span>
              </button>
            )
          })}
        </nav>

        {/* Main pane + drawer */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col">
            {p.tabs.map(tab => (
              <div key={tab.id} className="flex-1 min-h-0 flex flex-col"
                style={{ display: p.activeTabId === tab.id ? 'flex' : 'none' }}>
                {tab.service ? (
                  <div className="flex-1 min-h-0 flex flex-col">{p.renderService(tab)}</div>
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="shrink-0 flex items-end justify-between gap-4 px-6 pt-5 pb-4">
                      <div>
                        <h2 className="t-title text-1 mb-1">Services</h2>
                        <p className="t-body text-3">
                          {withResources} of {ALL_SERVICES_ORDERED.length} have resources on this endpoint
                        </p>
                      </div>
                      <input value={filter} onChange={e => setFilter(e.target.value)}
                        placeholder="Filter" className="sidebar-search !pl-3" style={{ width: 240 }} />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['Service', 'Resources', 'Category', 'State'].map((h, i) => (
                              <th key={h} className="t-label uppercase text-3 font-semibold px-6 py-2"
                                style={{ textAlign: i === 3 ? 'right' : 'left', borderBottom: 'var(--border-width) solid rgb(var(--border))' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {services.map(svc => {
                            const m = SERVICE_CONFIG[svc]
                            const n = p.counts[svc]
                            const state = n == null ? 'unknown' : n > 0 ? 'active' : 'idle'
                            return (
                              <tr key={svc} onClick={() => p.onSelectService(svc)}
                                className="cursor-pointer transition-colors hover:bg-raised"
                                style={{ borderBottom: 'var(--border-width) solid rgb(var(--border-sub))' }}>
                                <td className="px-6" style={{ height: 'var(--row-h)' }}>
                                  <span className="flex items-center gap-2.5">
                                    <span className="svc-chip shrink-0" style={{ ['--svc' as string]: svcSolid(m.hex) }} />
                                    <span className="t-body font-semibold text-1">{m.label}</span>
                                  </span>
                                </td>
                                <td className="px-6 t-body font-mono-theme text-2">{countNoun(svc, n)}</td>
                                <td className="px-6 t-body text-3">{m.category}</td>
                                <td className="px-6 t-body font-mono-theme" style={{ textAlign: 'right' }}>
                                  <span className={state === 'active' ? 'text-ok' : 'text-3'}>{state}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Raw payload drawer */}
          <div className="shrink-0 border-t border-theme bg-base">
            <button onClick={() => setDrawerOpen(o => !o)}
              className="w-full flex items-center gap-3 px-4 text-left" style={{ height: 28 }}>
              <span className="t-label uppercase text-2 font-semibold">Payload</span>
              <span className="t-body text-4">{view.title ?? 'nothing selected'}</span>
              <div className="flex-1" />
              {drawerOpen ? <ChevronDown size={13} className="text-3" /> : <ChevronUp size={13} className="text-3" />}
            </button>
            {drawerOpen && (
              <pre className="px-4 pb-3 overflow-auto font-mono-theme t-body text-2 m-0"
                style={{ maxHeight: 168, backgroundColor: 'rgb(var(--bg-app))' }}>
{view.inspector?.length
  ? JSON.stringify(Object.fromEntries(view.inspector.flatMap(s => s.rows.map(r => [r.key, r.value]))), null, 2)
  : '// select a resource to inspect its raw payload'}
              </pre>
            )}
          </div>
        </div>

        {/* Docked inspector */}
        <aside className="shrink-0 border-l border-theme bg-base overflow-y-auto" style={{ width: 288 }}>
          <p className="t-label uppercase text-3 px-4 pt-3 pb-2">Inspector</p>
          {view.title && (
            <div className="px-4 pb-3" style={{ borderBottom: 'var(--border-width) solid rgb(var(--border))' }}>
              <p className="t-body font-semibold text-1 truncate">{view.title}</p>
              {view.subtitle && <p className="t-body text-3 font-mono-theme truncate">{view.subtitle}</p>}
            </div>
          )}
          <InspectorRows sections={inspectorSections} />
          {busiest.length > 0 && (
            <div className="px-4 py-3">
              <p className="t-label uppercase text-3 mb-2">Busiest services</p>
              <div className="space-y-2">
                {busiest.map(b => (
                  <div key={b.svc}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="t-body text-2 truncate">{SERVICE_CONFIG[b.svc].label}</span>
                      <span className="t-body font-mono-theme text-3">{b.n}</span>
                    </div>
                    <div className="mt-1" style={{ height: 3, backgroundColor: 'rgb(var(--bg-overlay))' }}>
                      <div style={{ height: 3, width: `${(b.n / busiestMax) * 100}%`, backgroundColor: 'rgb(var(--accent))' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
