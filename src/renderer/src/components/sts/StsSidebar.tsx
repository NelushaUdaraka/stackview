import { Fingerprint, UserCheck, Key, Users, Globe, Zap } from 'lucide-react'

export type StsOperation = 'identity' | 'assume-role' | 'session-token' | 'federation-token' | 'web-identity'

interface Props {
  active: StsOperation
  onSelect: (op: StsOperation) => void
}

const OPS: { id: StsOperation; label: string; icon: typeof Fingerprint }[] = [
  { id: 'identity',         label: 'Caller Identity',   icon: Fingerprint },
  { id: 'assume-role',      label: 'Assume Role',       icon: UserCheck   },
  { id: 'session-token',    label: 'Session Token',     icon: Key         },
  { id: 'federation-token', label: 'Federation Token',  icon: Users       },
  { id: 'web-identity',     label: 'Web Identity',      icon: Globe       },
]

export default function StsSidebar({ active, onSelect }: Props) {
  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      <div className="px-4 pt-5 pb-3 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <h3 className="text-xs font-bold text-4 uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} /> STS Operations
        </h3>
      </div>

      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {OPS.map(op => {
          const isActive = active === op.id
          const Icon = op.icon
          return (
            <button
              key={op.id}
              onClick={() => onSelect(op.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors border ${
                isActive
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-semibold'
                  : 'hover:bg-raised text-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'opacity-100' : 'opacity-60'} />
                <span className="text-sm">{op.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
