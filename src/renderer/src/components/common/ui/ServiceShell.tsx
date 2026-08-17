import type { ReactNode } from 'react'
import { useResizableSidebar } from '../../../hooks/useResizableSidebar'

interface Props {
  /** The left resource rail — normally a `<ResourceRail>`. */
  rail: ReactNode
  /** The working surface: detail header, tabs, table or fields. */
  children: ReactNode
  /** Optional right pane. Omitted when there's nothing worth inspecting. */
  inspector?: ReactNode
}

/**
 * The split every service is built on: a resizable rail, a flexible working
 * surface, and an optional fixed inspector.
 *
 * Rail width is shared and persisted across services, so switching tabs doesn't
 * shuffle the layout under the cursor.
 */
export default function ServiceShell({ rail, children, inspector }: Props) {
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 180, max: 480 })

  return (
    <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
      <div className="shrink-0 min-h-0" style={{ width: sidebarWidth }}>
        {rail}
      </div>

      <div
        onMouseDown={handleResizeStart}
        className="w-px shrink-0 cursor-col-resize select-none relative"
        style={{ backgroundColor: 'rgb(var(--border))' }}
        title="Drag to resize"
      >
        {/* Widen the grab target without widening the visible rule. */}
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-app overflow-hidden">{children}</main>

      {inspector}
    </div>
  )
}
