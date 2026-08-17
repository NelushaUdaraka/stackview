/**
 * The "Slate Split" primitive set.
 *
 * Every service layout is assembled from these, so the design lives in one
 * place: change a primitive and all 32 services follow. See
 * docs/adding-a-new-service.md for how a slice is put together.
 */

export { default as ServiceShell } from './ServiceShell'
export { default as ResourceRail } from './ResourceRail'
export type { RailItem } from './ResourceRail'
export { default as DetailHeader } from './DetailHeader'
export { default as SubviewTabs } from './SubviewTabs'
export type { Subview } from './SubviewTabs'
export { default as DataTable } from './DataTable'
export type { Column } from './DataTable'
export { default as FieldGrid } from './FieldGrid'
export type { Field, FieldGroup } from './FieldGrid'
export { default as Inspector, InspectorSection, Sparkline, MeterRow } from './Inspector'
export type { InspectorRow } from './Inspector'
export { default as Toolbar } from './Toolbar'
export type { Crumb } from './Toolbar'
export { default as Drawer, DrawerLine } from './Drawer'
export { default as Modal, ConfirmDialog } from './Modal'
export { default as EmptyState } from './EmptyState'
export { default as Toggle } from './Toggle'

export {
  token,
  alpha,
  hexAlpha,
  stateOf,
  statusColor,
  statusBadgeClass,
  formatBytes,
  STATE_COLOR,
} from './tokens'
export type { ResourceState } from './tokens'
