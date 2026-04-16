import { Network, Globe, PlayCircle, Key } from 'lucide-react'

interface Props {
  activeTab: 'APIs' | 'CustomDomains' | 'UsagePlans' | 'ApiKeys'
  setActiveTab: (tab: 'APIs' | 'CustomDomains' | 'UsagePlans' | 'ApiKeys') => void
  counts: {
    apis: number
  }
}

export default function ApigwSidebar({ activeTab, setActiveTab, counts }: Props) {
  const tabs = [
    { id: 'APIs', label: 'REST APIs', icon: Network, count: counts.apis },
    { id: 'CustomDomains', label: 'Custom Domains', icon: Globe, count: 0 },
    { id: 'UsagePlans', label: 'Usage Plans', icon: PlayCircle, count: 0 },
    { id: 'ApiKeys', label: 'API Keys', icon: Key, count: 0 },
  ] as const

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      <div className="px-4 pt-5 pb-3 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <h3 className="text-xs font-bold text-4 uppercase tracking-widest flex items-center gap-2">
          <Network size={14} /> API Gateway v1
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors border ${isActive ? 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold' : 'hover:bg-raised text-2 border-transparent'}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'opacity-100' : 'opacity-60'} />
                <span className="text-sm">{t.label}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? 'bg-violet-500/20' : 'bg-theme text-4'}`}>
                {t.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
