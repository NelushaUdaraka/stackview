import { useMemo, useState } from 'react'
import {
  Wifi, WifiOff, SlidersHorizontal, Palette, Download, Info, ChevronDown, Search,
  Check, RefreshCw, ArrowUpCircle, CheckCircle2, AlertCircle, Image as ImageIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppSettings, IconMode, Theme, UpdaterStatus } from '../../types'
import { AWS_REGIONS } from '../../constants'
import { ALL_THEMES, THEME_DEFINITIONS } from '../../../../shared/themes'
import { Modal, Toggle } from './ui'

type Tab = 'connection' | 'preferences' | 'themes' | 'updates' | 'about'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'connection', label: 'Connection', icon: Wifi },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'updates', label: 'Updates', icon: Download },
  { id: 'about', label: 'About', icon: Info },
]

interface Props {
  onClose: () => void
  settings: AppSettings
  onRegionChange: (region: string) => void
  theme: Theme
  onSetTheme: (theme: Theme) => void
  iconMode: IconMode
  onToggleIconMode: () => void
  appVersion: string
  autoUpdate: boolean
  onToggleAutoUpdate: () => void
  updaterStatus: UpdaterStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
}

/** Section heading — the design's letterspaced micro-label over a ruled block. */
function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="px-3.5 py-3.5 border-b border-theme">
      <div className="flex items-center justify-between mb-2">
        <span className="ui-label">{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

export default function SettingsModal({
  onClose,
  settings,
  onRegionChange,
  theme,
  onSetTheme,
  iconMode,
  onToggleIconMode,
  appVersion,
  autoUpdate,
  onToggleAutoUpdate,
  updaterStatus,
  onCheckForUpdates,
  onInstallUpdate,
}: Props) {
  const [tab, setTab] = useState<Tab>('connection')
  const [regionOpen, setRegionOpen] = useState(false)
  const [regionSearch, setRegionSearch] = useState('')

  const regions = useMemo(() => {
    const q = regionSearch.trim().toLowerCase()
    if (!q) return AWS_REGIONS
    return AWS_REGIONS.filter(r => r.value.toLowerCase().includes(q) || r.label.toLowerCase().includes(q))
  }, [regionSearch])

  const activeRegion = AWS_REGIONS.find(r => r.value === settings.region)

  const updateLine = (): { icon: LucideIcon; text: string; color: string } => {
    switch (updaterStatus.status) {
      case 'checking':
        return { icon: RefreshCw, text: 'Checking for updates…', color: 'rgb(var(--accent))' }
      case 'available':
        return { icon: ArrowUpCircle, text: `Version ${updaterStatus.version ?? ''} available`, color: 'rgb(var(--accent))' }
      case 'downloading':
        return { icon: Download, text: `Downloading… ${updaterStatus.percent ?? 0}%`, color: 'rgb(var(--accent))' }
      case 'ready':
        return { icon: CheckCircle2, text: `Version ${updaterStatus.version ?? ''} ready to install`, color: 'rgb(var(--ok))' }
      case 'error':
        return { icon: AlertCircle, text: updaterStatus.message ?? 'Update check failed', color: 'rgb(var(--danger))' }
      case 'not-available':
        return { icon: CheckCircle2, text: 'StackView is up to date', color: 'rgb(var(--text-3))' }
      default:
        return { icon: Info, text: 'No update checks run yet', color: 'rgb(var(--text-3))' }
    }
  }

  const sidebar = TABS.map(t => {
    const Icon = t.icon
    const isActive = t.id === tab
    return (
      <button
        key={t.id}
        onClick={() => setTab(t.id)}
        className="flex items-center gap-2.5 h-[31px] px-2.5 rounded-md transition-colors hover:bg-raised"
        style={{ backgroundColor: isActive ? 'rgb(var(--bg-raised))' : undefined }}
      >
        <Icon size={13} className="shrink-0" style={{ color: isActive ? 'rgb(var(--accent))' : 'rgb(var(--text-3))' }} />
        <span
          className="text-[12.5px]"
          style={{ color: isActive ? 'rgb(var(--text-1))' : 'rgb(var(--text-2))', fontWeight: isActive ? 700 : 500 }}
        >
          {t.label}
        </span>
      </button>
    )
  })

  const status = updateLine()
  const StatusIcon = status.icon

  return (
    <Modal title="Settings" onClose={onClose} width={664} height={468} sidebar={sidebar}>
      {tab === 'connection' && (
        <>
          <Section title="ENDPOINT URL">
            <div className="h-8 rounded-[7px] flex items-center gap-2.5 px-2.5 surface-panel border border-theme">
              <Wifi size={13} className="text-3 shrink-0" />
              <span className="flex-1 min-w-0 truncate" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                {settings.endpoint}
              </span>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'rgb(var(--ok))' }} />
            </div>
            <div className="text-[11px] text-4 mt-1.5">
              Fixed to the LocalStack default. Reconnect from the menu to point at another endpoint.
            </div>
          </Section>

          <Section title="REGION">
            <button
              onClick={() => setRegionOpen(o => !o)}
              className="w-full h-8 rounded-[7px] flex items-center gap-2 px-2.5 surface-panel border transition-colors"
              style={{ borderColor: regionOpen ? 'rgb(var(--accent))' : 'rgb(var(--border))' }}
            >
              <span className="shrink-0 text-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>
                {settings.region}
              </span>
              <span className="text-4">·</span>
              <span className="flex-1 min-w-0 text-[12.5px] text-1 truncate text-left">
                {activeRegion?.label ?? 'Custom region'}
              </span>
              <ChevronDown size={13} className="shrink-0 text-3" />
            </button>

            {regionOpen && (
              <div className="mt-1.5 rounded-[9px] surface-panel border border-theme overflow-hidden">
                <div className="p-2.5 border-b border-theme">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4 pointer-events-none" />
                    <input
                      autoFocus
                      value={regionSearch}
                      onChange={e => setRegionSearch(e.target.value)}
                      placeholder="Search regions..."
                      className="sidebar-search pl-8 h-[26px]"
                    />
                  </div>
                </div>
                <div className="max-h-[180px] overflow-y-auto">
                  {regions.length === 0 ? (
                    <div className="py-3.5 px-2.5 text-center text-xs text-3">No regions match</div>
                  ) : (
                    regions.map(r => {
                      const isActive = r.value === settings.region
                      return (
                        <button
                          key={r.value}
                          onClick={() => {
                            onRegionChange(r.value)
                            setRegionOpen(false)
                          }}
                          className="w-full flex items-center gap-2.5 h-[29px] px-2.5 transition-colors hover:bg-raised"
                          style={{ backgroundColor: isActive ? 'rgb(var(--accent) / 0.10)' : undefined }}
                        >
                          <span
                            className="w-[104px] shrink-0 text-left"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              color: isActive ? 'rgb(var(--accent))' : 'rgb(var(--text-3))',
                            }}
                          >
                            {r.value}
                          </span>
                          <span
                            className="flex-1 min-w-0 text-xs truncate text-left"
                            style={{ color: isActive ? 'rgb(var(--accent))' : 'rgb(var(--text-2))' }}
                          >
                            {r.label}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
            <div className="text-[11px] text-4 mt-1.5">
              Changes the region for every service. Individual services can override it from their own band.
            </div>
          </Section>
        </>
      )}

      {tab === 'preferences' && (
        <div className="px-3.5 py-3.5">
          <div className="ui-label mb-2.5">BEHAVIOUR</div>
          <Toggle
            checked={iconMode === 'aws'}
            onChange={onToggleIconMode}
            label="Official AWS service icons"
            hint="Use the AWS architecture icons instead of the built-in line icons."
          />
          <Toggle
            checked={autoUpdate}
            onChange={onToggleAutoUpdate}
            label="Download updates automatically"
            hint="New versions install on the next restart. Turn this off to check manually."
          />
        </div>
      )}

      {tab === 'themes' && (
        <div className="px-3.5 py-3.5">
          <div className="ui-label mb-2.5">THEME</div>
          <div className="grid grid-cols-3 gap-1.5">
            {ALL_THEMES.map(key => {
              const def = THEME_DEFINITIONS[key]
              const isActive = key === theme
              return (
                <button
                  key={key}
                  onClick={() => onSetTheme(key)}
                  className="rounded-[5px] overflow-hidden text-left"
                  style={{
                    outline: isActive ? '2px solid rgb(var(--accent))' : '1px solid rgb(var(--border))',
                    outlineOffset: 1,
                  }}
                  title={def.label}
                >
                  <div
                    className="h-[22px] flex items-start justify-end p-0.5"
                    style={{ backgroundColor: def.preview.bg }}
                  >
                    {isActive && <Check size={9} color="#ffffff" />}
                  </div>
                  <div
                    className="h-[22px] flex items-center gap-1 px-1.5"
                    style={{ backgroundColor: def.preview.surface }}
                  >
                    <span
                      className="flex-1 min-w-0 truncate"
                      style={{ fontSize: 8, fontWeight: 700, color: def.preview.text }}
                    >
                      {def.label}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: def.preview.accent }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-4">
            <ImageIcon size={12} className="shrink-0" />
            Every theme is the same design — only the palette changes.
          </div>
        </div>
      )}

      {tab === 'updates' && (
        <>
          <Section
            title="UPDATES"
            right={appVersion ? <span className="ui-mono text-[10.5px] text-3">v{appVersion}</span> : undefined}
          >
            <Toggle checked={autoUpdate} onChange={onToggleAutoUpdate} label="Auto-update" />

            <div className="flex items-center gap-2 px-2.5 py-1.5">
              <StatusIcon
                size={11}
                className={`shrink-0 ${updaterStatus.status === 'checking' ? 'animate-spin' : ''}`}
                style={{ color: status.color }}
              />
              <span className="text-[11px] text-3">{status.text}</span>
            </div>

            {updaterStatus.status === 'downloading' && (
              <div className="mx-2.5 h-1 rounded-sm overflow-hidden bg-raised">
                <div
                  className="h-1 transition-all"
                  style={{ width: `${updaterStatus.percent ?? 0}%`, backgroundColor: 'rgb(var(--accent))' }}
                />
              </div>
            )}

            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={onCheckForUpdates}
                disabled={updaterStatus.status === 'checking' || updaterStatus.status === 'downloading'}
                className="btn-secondary"
              >
                <RefreshCw size={13} className={updaterStatus.status === 'checking' ? 'animate-spin' : ''} />
                Check for Updates
              </button>
              {updaterStatus.status === 'ready' && (
                <button onClick={onInstallUpdate} className="btn-primary">
                  <ArrowUpCircle size={13} />
                  Restart &amp; Install
                </button>
              )}
            </div>
          </Section>
        </>
      )}

      {tab === 'about' && (
        <>
          <div className="px-3.5 py-4 border-b border-theme flex items-center gap-3">
            <div
              className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 bg-raised border border-theme"
            >
              <span className="w-[15px] h-[15px] rounded" style={{ backgroundColor: 'rgb(var(--accent))' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-1">StackView</div>
              <div className="ui-mono text-[11px] text-3 mt-0.5">
                {appVersion ? `v${appVersion} · ` : ''}LocalStack desktop client
              </div>
            </div>
          </div>
          <div className="px-3.5 py-3 flex items-start gap-2">
            <WifiOff size={12} className="text-4 shrink-0 mt-1" />
            <div className="text-[11px] leading-relaxed text-3 text-pretty">
              Make sure LocalStack is running —{' '}
              <span className="ui-mono text-accent">localstack start</span> or Docker:{' '}
              <span className="ui-mono text-accent">docker run -p 4566:4566 localstack/localstack</span>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
