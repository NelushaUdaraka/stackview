import { useMemo } from 'react'
import TitleBar from '../components/common/TitleBar'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../services/serviceConfig'
import { SERVICE_COUNTS, plural } from '../services/serviceCounts'
import { useServiceViewData } from './ServiceViewContext'
import { ShellSettingsMenu, StatTiles } from './parts'
import type { ShellProps } from './types'

/**
 * 2d Paper Rail — "ink on cream: zero radii, 2px rules, heavy type. Maximum
 * legibility and the most personality." The launcher is a printed index: a headline
 * count, then services as ruled rows with the number set large.
 *
 * Radii and border weight come from the theme tokens, so this file only has to get
 * the typographic hierarchy and the rules right.
 */
export default function PaperShell(p: ShellProps) {
  const view = useServiceViewData()
  const activeTab = p.tabs.find(t => t.id === p.activeTabId) ?? null

  const inUse = useMemo(
    () => ALL_SERVICES_ORDERED.filter(s => (p.counts[s] ?? 0) > 0),
    [p.counts])
  const rest = useMemo(
    () => ALL_SERVICES_ORDERED.filter(s => !((p.counts[s] ?? 0) > 0)),
    [p.counts])

  const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
  const headline = inUse.length <= 10 ? WORDS[inUse.length] : String(inUse.length)

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-app">
      <div className="shrink-0 flex items-center border-b border-theme bg-base">
        <div className="flex-1 min-w-0">
          <TitleBar tabs={p.tabs} activeTabId={p.activeTabId} onSwitch={p.onSwitchTab}
            onClose={p.onCloseTab} onNew={p.onNewTab} onOpenInNewTab={p.onOpenInNewTab}
            onReorder={p.onReorderTabs} />
        </div>
        <span className="shrink-0 px-3 t-label uppercase text-2 font-semibold">
          {p.settings.endpoint.replace(/^https?:\/\//, '').toUpperCase()}
        </span>
        <ShellSettingsMenu p={p} align="right" />
      </div>

      <div className="flex-1 flex min-h-0">
        <nav className="shrink-0 flex flex-col border-r border-theme bg-base overflow-y-auto" style={{ width: 210 }}>
          <p className="t-label uppercase text-2 font-bold px-5 pt-4 pb-2">Pinned</p>
          {p.pinnedServices.map(svc => {
            const active = activeTab?.service === svc
            return (
              <button key={svc} onClick={() => p.onSelectService(svc)}
                className={`w-full flex items-baseline justify-between gap-2 px-5 py-2.5 text-left transition-colors
                  ${active ? 'bg-raised text-1' : 'text-2 hover:bg-raised'}`}
                style={{ borderTop: 'var(--border-width) solid rgb(var(--border-sub))' }}>
                <span className={`t-body truncate ${active ? 'font-bold' : 'font-semibold'}`}>
                  {SERVICE_CONFIG[svc].label}
                </span>
                <span className="font-mono-theme t-body text-3 shrink-0">{p.counts[svc] ?? '—'}</span>
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
                  <div className="shrink-0 px-8 pt-6 pb-4">
                    <h2 className="t-title text-1">
                      {view.breadcrumb?.length ? view.breadcrumb[view.breadcrumb.length - 1] : SERVICE_CONFIG[tab.service].label}
                    </h2>
                    <p className="t-label uppercase text-3 mt-1.5">{SERVICE_CONFIG[tab.service].name}</p>
                  </div>
                  {view.stats?.length ? <StatTiles stats={view.stats} /> : null}
                  <div className="flex-1 min-h-0 flex flex-col">{p.renderService(tab)}</div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto px-8 py-7">
                  <h2 className="t-title text-1">{headline} in use</h2>
                  <p className="t-label uppercase text-3 mt-2 mb-6">
                    of {ALL_SERVICES_ORDERED.length} services on this endpoint
                  </p>

                  <div style={{ maxWidth: 780, borderTop: '2px solid rgb(var(--border))' }}>
                    {[...inUse, ...rest].map(svc => {
                      const m = SERVICE_CONFIG[svc]
                      const n = p.counts[svc]
                      const idle = !(n && n > 0)
                      return (
                        <button key={svc} onClick={() => p.onSelectService(svc)}
                          className="w-full flex items-baseline gap-5 py-3.5 text-left transition-colors hover:bg-raised"
                          style={{ borderBottom: 'var(--border-width) solid rgb(var(--border-sub))', opacity: idle ? 0.55 : 1 }}>
                          <span className="font-mono-theme font-bold text-1 shrink-0 text-right"
                            style={{ fontSize: 22, lineHeight: 1, width: 66 }}>
                            {n ?? '—'}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block t-body font-bold text-1">{m.name}</span>
                            <span className="block t-body text-3">{m.capability}</span>
                          </span>
                          <span className="t-label uppercase text-3 shrink-0">
                            {idle ? m.category : plural(SERVICE_COUNTS[svc].noun, n ?? 0)}
                          </span>
                        </button>
                      )
                    })}
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
