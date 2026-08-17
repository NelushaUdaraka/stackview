import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  /** Service hue for the icon — usually `SERVICE_CONFIG[svc].hex`. */
  iconColor?: string
  title: string
  /** Uppercase qualifier beside the title: resource type, class, tier. */
  badge?: string
  badgeClass?: string
  /** Monospace line under the title — ARN, URL, or a counts summary. */
  meta?: string
  /** Copied to the clipboard by the button beside the title. Defaults to `meta`. */
  copyValue?: string
  /** Primary and secondary buttons, right-aligned. */
  actions?: ReactNode
  /** The subview tab strip, rendered flush with the bottom border. */
  children?: ReactNode
}

/**
 * The header every detail view opens with: identity on the left, actions on the
 * right, and the subview tabs sitting on the bottom rule.
 */
export default function DetailHeader({
  icon: Icon,
  iconColor,
  title,
  badge,
  badgeClass = 'badge-accent',
  meta,
  copyValue,
  actions,
  children,
}: Props) {
  const [copied, setCopied] = useState(false)
  const toCopy = copyValue ?? meta

  const copy = async () => {
    if (!toCopy) return
    await navigator.clipboard.writeText(toCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="shrink-0 px-5 pt-3.5 border-b border-theme">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            {Icon && <Icon size={16} className="shrink-0" style={{ color: iconColor ?? 'rgb(var(--accent))' }} />}
            <h2
              className="m-0 text-lg font-extrabold text-1 truncate"
              style={{ letterSpacing: '-0.01em' }}
              title={title}
            >
              {title}
            </h2>
            {toCopy && (
              <button
                onClick={copy}
                className="shrink-0 text-4 hover:text-1 transition-colors"
                title={copied ? 'Copied' : 'Copy'}
              >
                {copied ? <Check size={12} style={{ color: 'rgb(var(--ok))' }} /> : <Copy size={12} />}
              </button>
            )}
            {badge && <span className={`${badgeClass} shrink-0`}>{badge}</span>}
          </div>
          {meta && (
            <div className="ui-mono truncate" title={meta}>
              {meta}
            </div>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {children}
    </div>
  )
}
