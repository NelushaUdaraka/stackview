import { useState } from 'react'
import type { ReactNode } from 'react'
import { Play, Square, RotateCcw, Trash2, Loader2, Server, Info, Tag } from 'lucide-react'
import type { Ec2Instance } from '../../types'

interface Props {
  instance: Ec2Instance
  onRefresh: () => void
  onDeleted: () => void
}

type Tab = 'overview' | 'tags'

function getInstanceName(instance: Ec2Instance): string {
  return instance.Tags?.find(t => t.Key === 'Name')?.Value || instance.InstanceId || 'Unknown'
}

function StateChip({ state }: { state?: string }) {
  const colors: Record<string, string> = {
    running: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    stopped: 'bg-red-500/15 text-red-400 ring-red-500/30',
    pending: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    stopping: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
    terminated: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
  }
  const cls = colors[state ?? ''] ?? 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {state ?? 'unknown'}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-theme last:border-0">
      <span className="text-xs text-3 w-36 shrink-0">{label}</span>
      <span className={`text-xs font-mono break-all ${value ? 'text-1' : 'text-4'}`}>
        {value || '—'}
      </span>
    </div>
  )
}

export default function InstanceDetail({ instance, onRefresh, onDeleted }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const state = instance.State?.Name
  const iid = instance.InstanceId!

  async function doAction(fn: () => Promise<any>) {
    setBusy(true)
    setError(null)
    try {
      const res = await fn()
      if (!res.success) setError(res.error ?? 'Unknown error')
      else onRefresh()
    } catch (e) {
      setError(String(e))
    }
    setBusy(false)
  }

  const handleStart = () => doAction(() => window.electronAPI.ec2StartInstances([iid]))
  const handleStop = () => doAction(() => window.electronAPI.ec2StopInstances([iid]))
  const handleReboot = () => doAction(() => window.electronAPI.ec2RebootInstances([iid]))
  const handleTerminate = async () => {
    if (!confirm(`Terminate instance ${iid}? This cannot be undone.`)) return
    setBusy(true)
    setError(null)
    const res = await window.electronAPI.ec2TerminateInstances([iid])
    setBusy(false)
    if (!res.success) setError(res.error ?? 'Failed')
    else onDeleted()
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Info size={12} /> },
    { id: 'tags', label: 'Tags', icon: <Tag size={12} /> },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-orange-500/10 shrink-0">
              <Server size={18} className="text-orange-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-1 truncate">{getInstanceName(instance)}</h2>
              <p className="text-xs text-3 font-mono">{instance.InstanceId}</p>
            </div>
            <StateChip state={state} />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {busy && <Loader2 size={14} className="animate-spin text-3" />}
            <button
              onClick={handleStart}
              disabled={busy || state === 'running' || state === 'pending'}
              title="Start"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <Play size={12} /> Start
            </button>
            <button
              onClick={handleStop}
              disabled={busy || state !== 'running'}
              title="Stop"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <Square size={12} /> Stop
            </button>
            <button
              onClick={handleReboot}
              disabled={busy || state !== 'running'}
              title="Reboot"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <RotateCcw size={12} /> Reboot
            </button>
            <button
              onClick={handleTerminate}
              disabled={busy || state === 'terminated'}
              title="Terminate"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 size={12} /> Terminate
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-theme shrink-0 px-4" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
              ${activeTab === t.id ? 'border-orange-500 text-orange-600 dark:text-orange-300' : 'border-transparent text-3 hover:text-1'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-1">
            <InfoRow label="Instance ID" value={instance.InstanceId} />
            <InfoRow label="Instance Type" value={instance.InstanceType} />
            <InfoRow label="State" value={instance.State?.Name} />
            <InfoRow label="Image ID (AMI)" value={instance.ImageId} />
            <InfoRow label="Key Name" value={instance.KeyName} />
            <InfoRow label="Public IP" value={instance.PublicIpAddress} />
            <InfoRow label="Private IP" value={instance.PrivateIpAddress} />
            <InfoRow label="VPC ID" value={instance.VpcId} />
            <InfoRow label="Subnet ID" value={instance.SubnetId} />
            <InfoRow label="Architecture" value={instance.Architecture} />
            <InfoRow label="Platform" value={instance.Platform ?? 'Linux/UNIX'} />
            <InfoRow label="Launch Time" value={instance.LaunchTime} />
            <InfoRow label="Monitoring" value={instance.Monitoring?.State} />
            <InfoRow label="Availability Zone" value={instance.Placement?.AvailabilityZone} />
            <InfoRow label="Tenancy" value={instance.Placement?.Tenancy} />
            <InfoRow label="Root Device Type" value={instance.RootDeviceType} />
            <InfoRow label="Root Device Name" value={instance.RootDeviceName} />
            {(instance.SecurityGroups?.length ?? 0) > 0 && (
              <div className="flex items-start gap-3 py-2 border-b border-theme">
                <span className="text-xs text-3 w-36 shrink-0">Security Groups</span>
                <div className="flex flex-col gap-1">
                  {instance.SecurityGroups!.map(sg => (
                    <span key={sg.GroupId} className="text-xs text-1 font-mono">
                      {sg.GroupName} ({sg.GroupId})
                    </span>
                  ))}
                </div>
              </div>
            )}
            <InfoRow label="Reservation ID" value={instance.ReservationId} />
          </div>
        )}

        {activeTab === 'tags' && (
          <div>
            {(instance.Tags?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Tag size={28} className="text-4 mb-3 opacity-20" />
                <p className="text-sm text-3 font-medium">No tags</p>
              </div>
            ) : (
              <div className="rounded-xl border border-theme overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
                      <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Key</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instance.Tags!.map((tag, i) => (
                      <tr key={i} className="border-b border-theme last:border-0 hover:bg-raised transition-colors">
                        <td className="px-4 py-2.5 font-mono text-1">{tag.Key}</td>
                        <td className="px-4 py-2.5 font-mono text-2">{tag.Value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
