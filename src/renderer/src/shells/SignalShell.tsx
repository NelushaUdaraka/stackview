import { useMemo } from 'react'
import TitleBar from '../components/common/TitleBar'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../services/serviceConfig'
import { svcSolid } from '../services/serviceHue'
import { SERVICE_COUNTS, plural } from '../services/serviceCounts'
import { useCountHistory, padSeries } from '../hooks/useCountHistory'
import { useServiceViewData } from './ServiceViewContext'
import { ShellSettingsMenu, StatTiles } from './parts'
import Sparkline from './Sparkline'
import type { ShellProps } from './types'
import type { Service } from '../types'

type State = 'active' | 'backing up' | 'idle' | 'unknown'
const TONE: Record<State, 'ok' | 'warn' | 'muted'> = {
  active: 'ok', 'backing up': 'warn', idle: 'muted', unknown: 'muted',
}

/**
 * 2c Signal — "monitoring board: the launcher becomes a health board. You see what's
 * moving before you click anything." A KPI row over a card per service, each with a
 * live count and sparkline.
 *
 * State is shown as a word next to its dot, never colour alone.
 */
export default function SignalShell(p: ShellProps) {
  const view = useServiceViewData()
  const activeTab = p.tabs.find(t => t.id === p.activeTabId) ?? null
  const history = useCountHistory(p.counts, true)

  const stateOf = (svc: Service): State => {
    const n = p.counts[svc]
    if (n == null) return 'unknown'
    if (n === 0) return 'idle'
    const h = history[svc]
    if (h && h.length >= 3 && h[h.length - 1] > h[0]) return 'backing up'
    return 'active'
  }

  const board = useMemo(
    () => ALL_SERVICES_ORDERED.filter(s => (p.counts[s] ?? 0) > 0)
      .sort((a, b) => (p.counts[b] ?? 0) - (p.counts[a] ?? 0)),
    [p.counts])

  const totalResources = board.reduce((n, s) => n + (p.counts[s] ?? 0), 0)
  const activeCount = board.length
  const backingUp = board.filter(s => stateOf(s) === 'backing up').length
  const busiest = board[0]

  const kpis = [
    { label: 'Resources tracked', value: totalResources.toLocaleString(), unit: `across ${activeCount} services`, svc: busiest, tone: 'accent' as const },
    { label: 'Backing up', value: String(backingUp), unit: backingUp ? 'growing' : 'steady', svc: busiest, tone: backingUp ? 'warn' as const : 'ok' as const },
    { label: 'Busiest service', value: busiest ? String(p.counts[busiest] ?? 0) : '—', unit: busiest ? SERVICE_CONFIG[busiest].label : '', svc: busiest, tone: 'accent' as const },
    { label: 'Active services', value: String(activeCount), unit: `of ${ALL_SERVICES_ORDERED.length}`, svc: busiest, tone: 'ok' as const },
  ]

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
          live · 4s | {activeTab?.service ? p.effectiveRegion(activeTab.service) : p.settings.region}
        </span>
        <ShellSettingsMenu p={p} align="right" />
      </div>

      <div className="flex-1 flex min-h-0">
        <nav className="shrink-0 flex flex-col items-center gap-2 py-3 border-r border-theme bg-base overflow-y-auto scrollbar-none" style={{ width: 52 }}>
          {p.pinnedServices.map(svc => {
            const st = stateOf(svc)
            const active = activeTab?.service === svc
            return (
              <button key={svc} onClick={() => p.onSelectService(svc)}
                title={`${SERVICE_CONFIG[svc].label} — ${st}`}
                className="relative w-8 h-8 r-control flex items-center justify-center transition-colors shrink-0"
                style={{ backgroundColor: active ? 'rgb(var(--accent-soft))' : 'rgb(var(--bg-raised))',
                         color: active ? 'rgb(var(--accent))' : svcSolid(SERVICE_CONFIG[svc].hex) }}>
                {(() => { const I = SERVICE_CONFIG[svc].icon; return <I size={15} /> })()}
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: `rgb(var(--${TONE[st] === 'muted' ? 'text-4' : TONE[st]}))` }} />
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
                  {view.stats?.length ? <StatTiles stats={view.stats} /> : null}
                  <div className="flex-1 min-h-0 flex flex-col">{p.renderService(tab)}</div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {/* KPI row */}
                  <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
                    {kpis.map(k => (
                      <div key={k.label} className="card px-4 py-3.5">
                        <p className="t-label uppercase text-3 mb-2">{k.label}</p>
                        <div className="flex items-end justify-between gap-3">
                          <p className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-mono-theme font-bold" style={{ fontSize: 26, lineHeight: 1,
                              color: `rgb(var(--${k.tone === 'accent' ? 'accent' : k.tone}))` }}>{k.value}</span>
                            <span className="t-body text-3 truncate">{k.unit}</span>
                          </p>
                          <Sparkline values={padSeries(k.svc ? history[k.svc] : [])} tone={k.tone} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Service health */}
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="t-label uppercase text-3">Service health</p>
                    <div className="flex items-center gap-3">
                      {(['active', 'backing up', 'idle'] as State[]).map(s => (
                        <span key={s} className="flex items-center gap-1.5 t-body text-3">
                          <span className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: `rgb(var(--${TONE[s] === 'muted' ? 'text-4' : TONE[s]}))` }} />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                    {board.map(svc => {
                      const st = stateOf(svc)
                      const tone = TONE[st]
                      return (
                        <button key={svc} onClick={() => p.onSelectService(svc)}
                          className="card px-4 py-3.5 text-left transition-colors hover:bg-raised">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="t-body font-semibold text-1 truncate">{SERVICE_CONFIG[svc].label}</span>
                            <span className="flex items-center gap-1.5 shrink-0">
                              <span className="t-label text-3">{st}</span>
                              <span className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: `rgb(var(--${tone === 'muted' ? 'text-4' : tone}))` }} />
                            </span>
                          </div>
                          <div className="flex items-end justify-between gap-3">
                            <p>
                              <span className="font-mono-theme font-bold block" style={{ fontSize: 22, lineHeight: 1.1,
                                color: tone === 'muted' ? 'rgb(var(--text-2))' : `rgb(var(--${tone}))` }}>
                                {(p.counts[svc] ?? 0).toLocaleString()}
                              </span>
                              <span className="t-body text-3">{plural(SERVICE_COUNTS[svc].noun, p.counts[svc] ?? 0)}</span>
                            </p>
                            <Sparkline values={padSeries(history[svc])} tone={tone} />
                          </div>
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
