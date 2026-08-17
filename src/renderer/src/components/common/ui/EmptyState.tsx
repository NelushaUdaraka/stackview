import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  title: string
  /** One line of guidance — what to do next, not a restatement of the title. */
  hint?: string
  /** A primary action, when there's an obvious one. */
  action?: ReactNode
  /** Tighter spacing for use inside a drawer or inspector section. */
  compact?: boolean
}

/** The centred placeholder used wherever a list, table or panel has no rows. */
export default function EmptyState({ icon: Icon, title, hint, action, compact = false }: Props) {
  return (
    <div className={`text-center ${compact ? 'px-4 py-7' : 'px-5 py-10'}`}>
      {Icon && <Icon size={compact ? 18 : 22} className="mx-auto text-4" />}
      <div className={`font-semibold text-2 ${compact ? 'text-xs mt-2' : 'text-[13px] mt-2.5'}`}>{title}</div>
      {hint && <div className={`text-4 ${compact ? 'text-[11px] mt-1' : 'text-xs mt-1'}`}>{hint}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
