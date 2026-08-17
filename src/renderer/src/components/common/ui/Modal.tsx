import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  /** Panel width in px, or a CSS length. The design's default dialog is 664px. */
  width?: number | string
  height?: number | string
  /** Left rail inside the panel — used by multi-section dialogs like Settings. */
  sidebar?: ReactNode
  /** Buttons pinned to the bottom rule. */
  footer?: ReactNode
  children: ReactNode
}

/**
 * The dialog shell: a chrome-toned title bar marked with the accent square,
 * over a content well that scrolls independently of the frame.
 */
export default function Modal({ title, onClose, width = 664, height, sidebar, footer, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-7">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,11,13,.62)' }} onClick={onClose} />

      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width,
          height,
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: 12,
          backgroundColor: 'rgb(var(--bg-app))',
          border: '1px solid rgb(var(--hair))',
          boxShadow: '0 34px 76px rgba(0,0,0,.62)',
          animation: 'stackview-fade-in 0.14s ease-out',
        }}
      >
        <div
          className="h-11 shrink-0 flex items-center gap-2.5 pl-4 pr-2.5 border-b border-theme surface-panel"
        >
          <div
            className="w-[11px] h-[11px] rounded-[3px] shrink-0"
            style={{ backgroundColor: 'rgb(var(--accent))' }}
          />
          <span className="flex-1 min-w-0 text-[13px] font-bold text-1 truncate">{title}</span>
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          {sidebar && (
            <div className="w-[168px] shrink-0 border-r border-theme surface-panel p-2 flex flex-col gap-0.5">
              {sidebar}
            </div>
          )}
          <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">{children}</div>
        </div>

        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-3 border-t border-theme surface-panel">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Confirmation dialog — deliberately narrow and unadorned so a destructive
 * choice reads as a decision rather than a form.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
  busy = false,
}: {
  title: string
  body: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(11,12,14,.72)' }} onClick={onCancel} />
      <div
        className="relative w-[340px] p-5"
        style={{
          borderRadius: 10,
          backgroundColor: 'rgb(var(--bg-app))',
          border: '1px solid rgb(var(--border))',
          boxShadow: '0 24px 60px rgba(0,0,0,.5)',
          animation: 'stackview-fade-in 0.14s ease-out',
        }}
      >
        <div className="text-[15px] font-extrabold text-1 mb-1.5">{title}</div>
        <div className="text-[12.5px] leading-relaxed text-3 mb-4.5" style={{ marginBottom: 18 }}>
          {body}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-secondary" disabled={busy}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="control-base"
            style={{
              backgroundColor: destructive ? 'rgb(var(--danger))' : 'rgb(var(--accent))',
              borderColor: destructive ? 'rgb(var(--danger))' : 'rgb(var(--accent))',
              color: destructive ? '#ffffff' : 'rgb(var(--accent-contrast))',
              fontWeight: 700,
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
