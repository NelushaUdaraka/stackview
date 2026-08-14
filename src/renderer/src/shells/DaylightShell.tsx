import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import TitleBar from '../components/common/TitleBar'
import { AwsServiceIcon } from '../components/common/AwsServiceIcons'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../services/serviceConfig'
import { svcSolid, svcTint } from '../services/serviceHue'
import { countNoun } from '../services/serviceCounts'
import { useServiceViewData } from './ServiceViewContext'
import { ShellSettingsMenu, StatTiles } from './parts'
import type { ShellProps } from './types'

/**
 * 1d Daylight — "warm light, calm and legible, generous spacing. The opposite bet
 * from Terminal." Fewer things on screen, each given room: a pinned column, then
 * services as roomy rows rather than a dense table.
 */
export default function DaylightShell(p: ShellProps) {
  const view = useServiceViewData()
  const [search, setSearch] = useState('')
  const activeTab = p.tabs.find(t => t.id === p.activeTabId) ?? null

  const services = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ALL_SERVICES_ORDERED
    return ALL_SERVICES_ORDERED.filter(s =>
      SERVICE_CONFIG[s].label.toLowerCase().includes(q) ||
      SERVICE_CONFIG[s].name.toLowerCase().includes(q) ||
      SERVICE_CONFIG[s].capability.toLowerCase().includes(q))
  }, [search])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-app">
      <div className="shrink-0 flex items-center border-b border-theme bg-base">
        <div className="flex-1 min-w-0">
          <TitleBar tabs={p.tabs} activeTabId={p.activeTabId} onSwitch={p.onSwitchTab}
            onClose={p.onCloseTab} onNew={p.onNewTab} onOpenInNewTab={p.onOpenInNewTab}
            onReorder={p.onReorderTabs} />
        </div>
        <span className="shrink-0 px-3 font-mono-theme t-body text-3">
          {p.settings.endpoint.replace(/^https?:\/\//, '')}
        </span>
        <ShellSettingsMenu p={p} align="right" />
      </div>

      <div className="flex-1 flex min-h-0">
        <nav className="shrink-0 flex flex-col border-r border-theme bg-base overflow-y-auto" style={{ width: 232 }}>
          <p className="t-label uppercase text-3 px-5 pt-5 pb-3">Pinned</p>
          <div className="px-3 space-y-1">
            {p.pinnedServices.map(svc => {
              const m = SERVICE_CONFIG[svc]
              const active = activeTab?.service === svc
              return (
                <button key={svc} onClick={() => p.onSelectService(svc)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 r-control text-left transition-colors
                    ${active ? 'bg-accent-soft text-accent font-semibold' : 'text-2 hover:bg-raised'}`}>
                  <span className="w-7 h-7 r-control flex items-center justify-center shrink-0"
                    style={{ backgroundColor: svcTint(m.hex, 0.15) }}>
                    <m.icon size={14} style={{ color: svcSolid(m.hex) }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block t-body truncate">{m.label}</span>
                    <span className="block t-body text-3 truncate">{countNoun(svc, p.counts[svc])}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <main className="flex-1 min-w-0 flex flex-col">
          {p.tabs.map(tab => (
            <div key={tab.id} className="flex-1 min-h-0 flex flex-col"
              style={{ display: p.activeTabId === tab.id ? 'flex' : 'none' }}>
              {tab.service ? (
                <>
                  <div className="shrink-0 px-8 pt-6 pb-4">
                    <h2 className="t-title text-1">{SERVICE_CONFIG[tab.service].name}</h2>
                    {view.breadcrumb?.length ? (
                      <p className="t-body text-3 font-mono-theme mt-1">{view.breadcrumb.join(' / ')}</p>
                    ) : (
                      <p className="t-body text-3 mt-1">{SERVICE_CONFIG[tab.service].capability}</p>
                    )}
                  </div>
                  {view.stats?.length ? <StatTiles stats={view.stats} /> : null}
                  <div className="flex-1 min-h-0 flex flex-col">{p.renderService(tab)}</div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto px-8 py-7">
                  <h2 className="t-title text-1 mb-1.5">Services</h2>
                  <p className="t-body text-3 mb-6">
                    {ALL_SERVICES_ORDERED.length} available on this endpoint
                  </p>

                  <div className="relative mb-5" style={{ maxWidth: 380 }}>
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-3" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search services" className="sidebar-search" />
                  </div>

                  <div className="flex flex-col gap-2" style={{ maxWidth: 820 }}>
                    {services.map(svc => {
                      const m = SERVICE_CONFIG[svc]
                      return (
                        <button key={svc} onClick={() => p.onSelectService(svc)}
                          className="card elev flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-raised">
                          <span className="w-11 h-11 r-control flex items-center justify-center shrink-0"
                            style={{ backgroundColor: svcTint(m.hex, 0.15) }}>
                            {p.iconMode === 'aws'
                              ? <AwsServiceIcon service={svc} size={28} />
                              : <m.icon size={20} style={{ color: svcSolid(m.hex) }} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block t-body font-semibold text-1">{m.name}</span>
                            <span className="block t-body text-3 truncate">{m.capability}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-mono-theme t-body text-2">{p.counts[svc] ?? '—'}</span>
                            <span className="block t-label uppercase text-4">{m.category}</span>
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
