import { User, Users, Shield, FileText, Component } from 'lucide-react'

interface Props {
  activeTab: 'Users' | 'Groups' | 'Roles' | 'Policies'
  setActiveTab: (tab: 'Users' | 'Groups' | 'Roles' | 'Policies') => void
  counts: {
    users: number
    groups: number
    roles: number
    policies: number
  }
}

export default function IamSidebar({ activeTab, setActiveTab, counts }: Props) {
  const tabs = [
    { id: 'Users', label: 'Users', icon: User, count: counts.users },
    { id: 'Groups', label: 'Groups', icon: Users, count: counts.groups },
    { id: 'Roles', label: 'Roles', icon: Shield, count: counts.roles },
    { id: 'Policies', label: 'Policies', icon: FileText, count: counts.policies },
  ] as const

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      <div className="px-4 pt-5 pb-3 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <h3 className="text-xs font-bold text-4 uppercase tracking-widest flex items-center gap-2">
          <Component size={14} /> IAM Resources
        </h3>
      </div>

      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {tabs.map(t => {
          const isActive = activeTab === t.id
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors border ${isActive ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold' : 'hover:bg-raised text-2 border-transparent'}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'opacity-100' : 'opacity-60'} />
                <span className="text-sm">{t.label}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? 'bg-rose-500/20' : 'bg-theme text-4'}`}>
                {t.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
