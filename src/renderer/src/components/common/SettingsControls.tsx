import { useState } from 'react'
import { Check, Download, RefreshCw, ArrowUpCircle, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import type { Theme, UpdaterStatus } from '../../types'
import { AWS_REGIONS } from '../../constants'
import { ALL_THEMES, THEME_DEFINITIONS } from '../../../../shared/themes'

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

interface RegionListProps {
  value: string
  onSelect: (region: string) => void
  /** Optional hex color for the selected row (defaults to the theme accent) */
  accentHex?: string
  autoFocus?: boolean
  /** Tailwind max-height class for the scrolling list */
  listClassName?: string
}

/** Searchable list of AWS regions with the current one checked. */
export function RegionList({ value, onSelect, accentHex, autoFocus, listClassName = 'max-h-48' }: RegionListProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const regions = q
    ? AWS_REGIONS.filter(r => r.value.toLowerCase().includes(q) || r.label.toLowerCase().includes(q))
    : AWS_REGIONS

  return (
    <div>
      <div className="relative mb-1.5">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => {
            // Enter picks the top match (and never submits a surrounding form)
            if (e.key !== 'Enter') return
            e.preventDefault()
            if (regions[0]) onSelect(regions[0].value)
          }}
          placeholder="Search regions…"
          aria-label="Search regions"
          className="sidebar-search"
          autoFocus={autoFocus}
        />
      </div>
      <div className={`${listClassName} overflow-y-auto -mx-1 px-1`} role="listbox" aria-label="Regions">
        {regions.length === 0 ? (
          <p className="px-2.5 py-4 text-xs text-3 text-center">No regions match “{query}”</p>
        ) : (
          regions.map(r => {
            const isActive = r.value === value
            return (
              <button
                key={r.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => onSelect(r.value)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs transition-colors ${
                  isActive ? 'font-medium' : 'text-2 hover:bg-raised hover:text-1'
                }`}
                style={isActive ? {
                  color: accentHex ?? 'rgb(var(--accent))',
                  backgroundColor: accentHex ? hexToRgba(accentHex, 0.12) : 'rgb(var(--accent) / 0.12)',
                } : undefined}
              >
                <span className="flex-1 truncate">{r.label}</span>
                <span className={`font-mono text-[10px] shrink-0 ${isActive ? '' : 'text-3'}`}>{r.value}</span>
                <Check size={12} className={`shrink-0 ${isActive ? '' : 'invisible'}`} />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg transition-colors hover:bg-raised"
    >
      <span className="text-xs text-2">{label}</span>
      <span
        aria-hidden
        className="relative shrink-0 w-7 h-4 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? 'rgb(var(--accent))' : 'rgb(var(--bg-overlay))' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? 'translateX(12px)' : 'translateX(0)' }}
        />
      </span>
    </button>
  )
}

const LIGHT_THEMES = ALL_THEMES.filter(t => THEME_DEFINITIONS[t].mode === 'light')
const DARK_THEMES = ALL_THEMES.filter(t => THEME_DEFINITIONS[t].mode === 'dark')

/** Compact swatch grid of every theme, grouped by light/dark mode. */
export function ThemePicker({ theme, onSelect }: { theme: Theme; onSelect: (theme: Theme) => void }) {
  const [hovered, setHovered] = useState<Theme | null>(null)
  const shown = THEME_DEFINITIONS[hovered ?? theme].label

  const swatch = (key: Theme) => {
    const def = THEME_DEFINITIONS[key]
    const isActive = key === theme
    return (
      <button
        key={key}
        type="button"
        title={def.label}
        aria-label={`${def.label} theme`}
        aria-pressed={isActive}
        onClick={() => onSelect(key)}
        onMouseEnter={() => setHovered(key)}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered(key)}
        onBlur={() => setHovered(null)}
        className="relative h-7 rounded-md overflow-hidden transition-transform duration-150 hover:scale-105"
        style={{
          backgroundColor: def.preview.bg,
          boxShadow: isActive
            ? '0 0 0 2px rgb(var(--bg-base)), 0 0 0 4px rgb(var(--accent))'
            : 'inset 0 0 0 1px rgb(127 127 127 / 0.25)',
        }}
      >
        <span className="absolute inset-x-0 bottom-0 h-[42%]" style={{ backgroundColor: def.preview.surface }} />
        <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: def.preview.text }} />
        {isActive && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Check size={11} strokeWidth={3} style={{ color: def.preview.text }} />
          </span>
        )}
      </button>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="section-label">Theme</p>
        <span className="text-[11px] text-2 truncate">{shown}</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">{LIGHT_THEMES.map(swatch)}</div>
      <div className="my-2 border-t border-theme" />
      <div className="grid grid-cols-6 gap-1.5">{DARK_THEMES.map(swatch)}</div>
    </div>
  )
}

interface UpdateControlsProps {
  appVersion: string
  autoUpdate: boolean
  onToggleAutoUpdate: () => void
  updaterStatus: UpdaterStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
}

/** Auto-update switch, current updater status, and the check/install action. */
export function UpdateControls({
  appVersion,
  autoUpdate,
  onToggleAutoUpdate,
  updaterStatus,
  onCheckForUpdates,
  onInstallUpdate,
}: UpdateControlsProps) {
  const { status } = updaterStatus
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="section-label">Updates</p>
        {appVersion && <span className="font-mono text-[10px] text-3">v{appVersion}</span>}
      </div>

      <Toggle checked={autoUpdate} onChange={onToggleAutoUpdate} label="Automatic updates" />

      {status !== 'idle' && (
        <div className="flex items-center gap-2 px-2.5 py-1.5" role="status">
          {status === 'checking' && <RefreshCw size={12} className="text-3 animate-spin shrink-0" />}
          {status === 'available' && <ArrowUpCircle size={12} className="text-sky-500 shrink-0" />}
          {status === 'downloading' && <Download size={12} className="text-sky-500 shrink-0" />}
          {status === 'ready' && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
          {status === 'not-available' && <CheckCircle2 size={12} className="text-3 shrink-0" />}
          {status === 'error' && <AlertCircle size={12} className="text-red-500 shrink-0" />}
          <span className="text-[11px] text-3 truncate">
            {status === 'checking' && 'Checking for updates…'}
            {status === 'available' && `v${updaterStatus.version} available`}
            {status === 'downloading' && `Downloading… ${updaterStatus.percent ?? 0}%`}
            {status === 'ready' && `v${updaterStatus.version} ready to install`}
            {status === 'not-available' && 'You’re on the latest version'}
            {status === 'error' && (updaterStatus.message ?? 'Update error')}
          </span>
        </div>
      )}
      {status === 'downloading' && (
        <div className="mx-2.5 mb-1.5 h-1 rounded-full overflow-hidden bg-raised">
          <div
            className="h-full rounded-full bg-sky-500 transition-[width] duration-300"
            style={{ width: `${updaterStatus.percent ?? 0}%` }}
          />
        </div>
      )}

      {status === 'ready' ? (
        <button
          onClick={onInstallUpdate}
          className="w-full flex items-center justify-center gap-2 mt-1 px-2.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
        >
          <Download size={13} />
          Install &amp; Restart
        </button>
      ) : (
        <button
          onClick={onCheckForUpdates}
          disabled={status === 'checking' || status === 'downloading'}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-2 hover:bg-raised hover:text-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw size={13} className={status === 'checking' ? 'animate-spin' : ''} />
          Check for updates
        </button>
      )}
    </div>
  )
}
