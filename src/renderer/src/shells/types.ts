import type { ReactNode } from 'react'
import type { AppSettings, AppTab, IconMode, Service, Theme, UpdaterStatus } from '../types'

/**
 * Shell contract.
 *
 * Each of the eight design directions is a different application *shell* — its own
 * navigation, launcher and surrounding chrome — not a different palette. A shell
 * owns the frame; the 32 per-service layouts render into the slots it provides.
 * That keeps the count at 8 shells + 32 services rather than 8 x 32 components.
 */
export interface ShellProps {
  /* ── navigation ── */
  pinnedServices: Service[]
  activeService: Service | null
  onSelectService: (svc: Service) => void
  onOpenInNewTab: (svc: Service) => void
  onToggleFavourite: (svc: Service) => void
  onReorderFavourites: (services: Service[]) => void
  /** Resource count per service, as shown in the design's sidebars and tables. */
  counts: ServiceCounts

  /* ── tabs ── */
  tabs: AppTab[]
  activeTabId: string | null
  onSwitchTab: (id: string) => void
  onCloseTab: (id: string) => void
  onNewTab: () => void
  onReorderTabs: (tabs: AppTab[]) => void

  /* ── connection / chrome ── */
  settings: AppSettings
  effectiveRegion: (svc: Service) => string
  onRegionChange: (region: string) => void
  onServiceRegionChange: (svc: Service, region: string) => void
  onRefresh: () => void
  refreshing: boolean
  onSwitchService: () => void
  onDisconnect: () => void

  /* ── preferences ── */
  theme: Theme
  onSetTheme: (t: Theme) => void
  iconMode: IconMode
  onToggleIconMode: () => void

  /* ── updates ── */
  appVersion: string
  autoUpdate: boolean
  onToggleAutoUpdate: () => void
  updaterStatus: UpdaterStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void

  /* ── content slots ── */
  /** Rendered when a tab has no service selected — each shell draws its own launcher. */
  renderLauncher: (tab: AppTab) => ReactNode
  /** Rendered for a tab with an active service — the existing per-service layout. */
  renderService: (tab: AppTab) => ReactNode
}

export type ServiceCounts = Partial<Record<Service, number | null>>

/**
 * What a service layout publishes about its current selection.
 *
 * Shells with stat tiles, an inspector pane or a status line read this. Every field
 * is optional: a service that has not published yet still renders, the shell just
 * omits that region. Published via `useServiceView()`.
 */
export interface ServiceViewData {
  /** Resource name, e.g. `order-events.fifo`. */
  title?: string
  /** ARN or secondary identifier under the title. */
  subtitle?: string
  /** Short tag beside the title, e.g. `FIFO`. */
  badge?: string
  /** Trail after the service name, e.g. `['order-events.fifo']`. */
  breadcrumb?: string[]
  /** The stat tile row: Available / In flight / Delayed / Retention. */
  stats?: StatTile[]
  /** Grouped key/value rows for the docked inspector (Slate Split, Terminal). */
  inspector?: InspectorSection[]
  /** Right-hand status text for Terminal's status line. */
  statusRight?: string
}

export interface StatTile {
  label: string
  value: string
  /** Secondary word after the value, e.g. `messages`. */
  unit?: string
  tone?: 'default' | 'ok' | 'warn' | 'danger'
}

export interface InspectorSection {
  label: string
  rows: { key: string; value: string; tone?: 'default' | 'ok' | 'warn' | 'danger' }[]
}
