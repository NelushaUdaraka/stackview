import { useState } from 'react'
import { Search, Plus, Server, Loader2 } from 'lucide-react'
import type { Ec2Instance } from '../../types'

interface Props {
  instances: Ec2Instance[]
  selectedInstanceId: string | null
  onSelectInstance: (id: string) => void
  onLaunchInstance: () => void
  loading?: boolean
}

function getInstanceName(instance: Ec2Instance): string {
  const nameTag = instance.Tags?.find(t => t.Key === 'Name')
  return nameTag?.Value || instance.InstanceId || 'Unknown'
}

function getStateColor(state?: string) {
  switch (state) {
    case 'running': return 'bg-emerald-500'
    case 'stopped': return 'bg-red-500'
    case 'pending': return 'bg-amber-500'
    case 'stopping': return 'bg-orange-500'
    case 'terminated': return 'bg-zinc-500'
    default: return 'bg-zinc-400'
  }
}

export default function EC2Sidebar({ instances, selectedInstanceId, onSelectInstance, onLaunchInstance, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = instances.filter(i => {
    const name = getInstanceName(i).toLowerCase()
    const id = (i.InstanceId ?? '').toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || id.includes(q)
  })

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Instances {!loading && instances.length > 0 && `(${instances.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search instances..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : instances.length === 0 ? (
              <>
                <Server size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No instances</p>
                <p className="text-[10px] text-4 mt-1">Launch one below</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map(instance => {
            const isSelected = selectedInstanceId === instance.InstanceId
            const state = instance.State?.Name ?? 'unknown'
            return (
              <button
                key={instance.InstanceId}
                onClick={() => onSelectInstance(instance.InstanceId!)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2
                  ${isSelected ? 'bg-orange-500/10 border-l-orange-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                  <Server size={13} className={isSelected ? 'text-orange-500' : 'text-4'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${isSelected ? 'text-1' : 'text-2'}`}>
                    {getInstanceName(instance)}
                  </p>
                  <p className="text-[10px] text-3 truncate font-mono">{instance.InstanceId}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStateColor(state)}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-orange-500' : 'text-4'}`}>
                      {state}
                    </span>
                    {instance.InstanceType && (
                      <>
                        <span className="text-[9px] text-4">•</span>
                        <span className="text-[9px] text-3">{instance.InstanceType}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onLaunchInstance}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          Launch Instance
        </button>
      </div>
    </div>
  )
}
