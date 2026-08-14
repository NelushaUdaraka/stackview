import { useEffect, useMemo, useRef, useState } from 'react'
import TitleBar from '../components/common/TitleBar'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../services/serviceConfig'
import { useServiceViewData } from './ServiceViewContext'
import { InspectorRows, ShellSettingsMenu, StatTiles } from './parts'
import type { ShellProps } from './types'
import type { Service } from '../types'

/** Short gutter codes, as the mock's left rail shows (SVC, SQS, DDB, λ, CW). */
const GUTTER: Partial<Record<Service, string>> = {
  sqs: 'SQS', s3: 'S3', dynamodb: 'DDB', lambda: 'λ', cloudwatch: 'CW', iam: 'IAM',
  sns: 'SNS', ssm: 'SSM', kms: 'KMS', eventbridge: 'EB', cloudformation: 'CFN',
  secretsmanager: 'SEC', apigw: 'API', ec2: 'EC2', kinesis: 'KIN', sfn: 'SFN',
}
const gutter = (s: Service) => GUTTER[s] ?? SERVICE_CONFIG[s].label.slice(0, 3).toUpperCase()

/**
 * 1c Terminal — "IDE-native, fully monospace, panels, gutters and a status line.
 * Maximum density." The launcher is a numbered service listing driven by a prompt
 * line, with a preview panel on the right and a vim-style status bar underneath.
 */
export default function TerminalShell(p: ShellProps) {
  const view = useServiceViewData()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const activeTab = p.tabs.find(t => t.id === p.activeTabId) ?? null
  const onLauncher = activeTab != null && activeTab.service === null

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_SERVICES_ORDERED
    return ALL_SERVICES_ORDERED.filter(s =>
      s.includes(q) || SERVICE_CONFIG[s].label.toLowerCase().includes(q) ||
      SERVICE_CONFIG[s].capability.toLowerCase().includes(q))
  }, [query])

  useEffect(() => { setCursor(0) }, [query])
  useEffect(() => { if (onLauncher) inputRef.current?.focus() }, [onLauncher])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) { e.preventDefault(); setCursor(c => Math.min(c + 1, rows.length - 1)) }
    else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter' && rows[cursor]) {
      e.preventDefault()
      if (e.shiftKey) p.onOpenInNewTab(rows[cursor]); else p.onSelectService(rows[cursor])
    }
  }

  const previewSvc = rows[cursor]
  const statusLeft = activeTab?.service ? gutter(activeTab.service).toLowerCase() : 'services'

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-app font-mono-theme">
      <div className="shrink-0 flex items-center border-b border-theme bg-base">
        <div className="flex-1 min-w-0">
          <TitleBar tabs={p.tabs} activeTabId={p.activeTabId} onSwitch={p.onSwitchTab}
            onClose={p.onCloseTab} onNew={p.onNewTab} onOpenInNewTab={p.onOpenInNewTab}
            onReorder={p.onReorderTabs} />
        </div>
        <ShellSettingsMenu p={p} align="right" />
      </div>

      {/* Path line */}
      <div className="shrink-0 flex items-center gap-2 px-3 border-b border-theme bg-base t-body" style={{ height: 26 }}>
        <span className="text-3">~/localstack</span>
        <span className="text-4">›</span>
        <span className="text-1">{activeTab?.service ? SERVICE_CONFIG[activeTab.service].label.toLowerCase() : 'services'}</span>
        <div className="flex-1" />
        <span className="w-1.5 h-1.5 rounded-full bg-ok" />
        <span className="text-3">up {p.settings.endpoint.replace(/^https?:\/\/[^:]*:?/, '')} {activeTab?.service ? p.effectiveRegion(activeTab.service) : p.settings.region}</span>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Abbreviated gutter */}
        <nav className="shrink-0 flex flex-col border-r border-theme bg-base overflow-y-auto scrollbar-none" style={{ width: 46 }}>
          <div className="px-1 py-1.5 t-label text-3 text-center" style={{ letterSpacing: '.06em' }}>SVC</div>
          {p.pinnedServices.map(svc => {
            const active = activeTab?.service === svc
            return (
              <button key={svc} onClick={() => p.onSelectService(svc)} title={SERVICE_CONFIG[svc].name}
                className={`w-full t-body text-center transition-colors ${active ? 'text-accent' : 'text-3 hover:text-1'}`}
                style={{ height: 'var(--row-h-sm)', backgroundColor: active ? 'rgb(var(--bg-overlay))' : undefined }}>
                {gutter(svc)}
              </button>
            )
          })}
        </nav>

        <main className="flex-1 min-w-0 flex flex-col">
          {p.tabs.map(tab => (
            <div key={tab.id} className="flex-1 min-h-0 flex"
              style={{ display: p.activeTabId === tab.id ? 'flex' : 'none' }}>
              {tab.service ? (
                <div className="flex-1 min-w-0 flex flex-col">
                  {view.stats?.length ? <StatTiles stats={view.stats} dense /> : null}
                  <div className="flex-1 min-h-0 flex flex-col">{p.renderService(tab)}</div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0 flex flex-col border-r border-theme">
                    {/* Prompt line */}
                    <div className="shrink-0 flex items-center gap-2 px-3 border-b border-theme" style={{ height: 30 }}>
                      <span className="text-accent t-body">›</span>
                      <input
                        ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKey}
                        placeholder="svc_"
                        className="flex-1 bg-transparent border-0 outline-none t-body text-1 font-mono-theme"
                      />
                      <span className="t-body text-4 shrink-0">
                        {rows.length} services · ↑↓ move · ↵ open · ⇧↵ new tab
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {rows.map((svc, i) => {
                        const m = SERVICE_CONFIG[svc]
                        return (
                          <button key={svc}
                            onClick={() => p.onSelectService(svc)}
                            onMouseEnter={() => setCursor(i)}
                            className="w-full flex items-center gap-3 px-3 text-left transition-colors t-body"
                            style={{
                              height: 'var(--row-h-sm)',
                              backgroundColor: i === cursor ? 'rgb(var(--bg-overlay))' : undefined,
                            }}>
                            <span className="text-4 shrink-0" style={{ width: 22 }}>{String(i + 1).padStart(2, '0')}</span>
                            <span className={`shrink-0 ${i === cursor ? 'text-1' : 'text-2'}`} style={{ width: 150 }}>{svc}</span>
                            <span className="text-3 flex-1 truncate">{m.capability.toLowerCase()}</span>
                            <span className="text-4 shrink-0" style={{ width: 78 }}>{m.category.toLowerCase()}</span>
                            <span className="text-2 shrink-0 text-right" style={{ width: 34 }}>{p.counts[svc] ?? '—'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Preview panel */}
                  <aside className="shrink-0 overflow-y-auto" style={{ width: 330 }}>
                    {previewSvc && (
                      <>
                        <div className="px-4 py-3" style={{ borderBottom: 'var(--border-width) solid rgb(var(--border))' }}>
                          <p className="t-label uppercase text-3 mb-2">Preview</p>
                          <p className="t-title text-1 mb-1.5">{previewSvc}</p>
                          <p className="t-body text-3 leading-relaxed">{SERVICE_CONFIG[previewSvc].description}</p>
                        </div>
                        <InspectorRows sections={[{
                          label: 'Endpoint',
                          rows: [
                            { key: 'endpoint', value: p.settings.endpoint.replace(/^https?:\/\//, '') },
                            { key: 'region', value: p.effectiveRegion(previewSvc) },
                            { key: 'category', value: SERVICE_CONFIG[previewSvc].category.toLowerCase() },
                            { key: 'resources', value: String(p.counts[previewSvc] ?? '—') },
                          ],
                        }]} />
                      </>
                    )}
                  </aside>
                </>
              )}
            </div>
          ))}
        </main>
      </div>

      {/* Status line */}
      <div className="shrink-0 flex items-center gap-3 px-3 t-body"
        style={{ height: 22, backgroundColor: 'rgb(var(--accent-soft))', borderTop: 'var(--border-width) solid rgb(var(--border))' }}>
        <span className="text-accent font-semibold">NORMAL</span>
        <span className="text-2">{statusLeft}</span>
        <div className="flex-1" />
        <span className="text-3">{view.statusRight ?? `${rows.length} items`}</span>
        <span className="text-3">ln {Math.min(cursor + 1, rows.length || 1)}/{rows.length}</span>
        <span className="text-3">utf-8</span>
      </div>
    </div>
  )
}
