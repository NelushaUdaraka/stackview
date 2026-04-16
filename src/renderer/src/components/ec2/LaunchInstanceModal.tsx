import { useState, useEffect } from 'react'
import { X, Server, Loader2 } from 'lucide-react'
import type { Ec2KeyPair, Ec2SecurityGroup, Ec2Subnet } from '../../types'

interface Props {
  onClose: () => void
  onLaunched: () => void
}

const COMMON_AMIS = [
  { label: 'Amazon Linux 2', value: 'ami-0c55b159cbfafe1f0' },
  { label: 'Ubuntu 22.04 LTS', value: 'ami-0149b2da6ceec4bb0' },
  { label: 'Windows Server 2022', value: 'ami-0a244485e2e4ffd04' },
]

const INSTANCE_TYPES = [
  't2.micro', 't2.small', 't2.medium', 't2.large',
  't3.micro', 't3.small', 't3.medium', 't3.large',
  'm5.large', 'm5.xlarge', 'c5.large', 'r5.large',
]

export default function LaunchInstanceModal({ onClose, onLaunched }: Props) {
  const [tagName, setTagName] = useState('')
  const [imageId, setImageId] = useState(COMMON_AMIS[0].value)
  const [customAmi, setCustomAmi] = useState('')
  const [instanceType, setInstanceType] = useState('t2.micro')
  const [keyName, setKeyName] = useState('')
  const [securityGroupIds, setSecurityGroupIds] = useState<string[]>([])
  const [subnetId, setSubnetId] = useState('')
  const [userData, setUserData] = useState('')

  const [keyPairs, setKeyPairs] = useState<Ec2KeyPair[]>([])
  const [secGroups, setSecGroups] = useState<Ec2SecurityGroup[]>([])
  const [subnets, setSubnets] = useState<Ec2Subnet[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      window.electronAPI.ec2ListKeyPairs(),
      window.electronAPI.ec2ListSecurityGroups(),
      window.electronAPI.ec2ListSubnets(),
    ]).then(([kp, sg, sn]) => {
      if (kp.success && kp.data) setKeyPairs(kp.data)
      if (sg.success && sg.data) setSecGroups(sg.data)
      if (sn.success && sn.data) setSubnets(sn.data)
    })
  }, [])

  const effectiveImageId = customAmi.trim() || imageId

  const handleLaunch = async () => {
    if (!effectiveImageId) { setError('Image ID is required'); return }
    setLoading(true)
    setError(null)
    const res = await window.electronAPI.ec2LaunchInstance({
      imageId: effectiveImageId,
      instanceType,
      keyName: keyName || undefined,
      securityGroupIds: securityGroupIds.length > 0 ? securityGroupIds : undefined,
      subnetId: subnetId || undefined,
      userData: userData || undefined,
      tagName: tagName || undefined,
    })
    setLoading(false)
    if (!res.success) { setError(res.error ?? 'Launch failed'); return }
    onLaunched()
  }

  const toggleSecGroup = (id: string) => {
    setSecurityGroupIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="no-drag fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="flex flex-col w-full max-w-xl max-h-[90vh] rounded-2xl border border-theme shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.6)' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-500/10">
              <Server size={15} className="text-orange-500" />
            </div>
            <h2 className="text-sm font-bold text-1">Launch Instance</h2>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Name tag <span className="text-3 font-normal">(optional)</span></label>
            <input
              className="input-base w-full text-sm"
              placeholder="my-instance"
              value={tagName}
              onChange={e => setTagName(e.target.value)}
            />
          </div>

          {/* AMI */}
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Amazon Machine Image (AMI)</label>
            <select className="input-base w-full text-sm mb-2" value={imageId} onChange={e => setImageId(e.target.value)}>
              {COMMON_AMIS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <input
              className="input-base w-full text-sm font-mono"
              placeholder="Or enter custom AMI ID (e.g. ami-12345678)"
              value={customAmi}
              onChange={e => setCustomAmi(e.target.value)}
            />
          </div>

          {/* Instance Type */}
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Instance Type</label>
            <select className="input-base w-full text-sm" value={instanceType} onChange={e => setInstanceType(e.target.value)}>
              {INSTANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Key Pair */}
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Key Pair <span className="text-3 font-normal">(optional)</span></label>
            <select className="input-base w-full text-sm" value={keyName} onChange={e => setKeyName(e.target.value)}>
              <option value="">— None —</option>
              {keyPairs.map(kp => (
                <option key={kp.KeyName} value={kp.KeyName ?? ''}>{kp.KeyName}</option>
              ))}
            </select>
          </div>

          {/* Security Groups */}
          {secGroups.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">Security Groups <span className="text-3 font-normal">(optional)</span></label>
              <div className="border border-theme rounded-xl overflow-hidden max-h-32 overflow-y-auto">
                {secGroups.map(sg => (
                  <label
                    key={sg.GroupId}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-raised border-b border-theme last:border-0 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={securityGroupIds.includes(sg.GroupId ?? '')}
                      onChange={() => toggleSecGroup(sg.GroupId ?? '')}
                      className="rounded"
                    />
                    <span className="text-xs text-2">{sg.GroupName}</span>
                    <span className="text-[10px] text-3 font-mono ml-auto">{sg.GroupId}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Subnet */}
          {subnets.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">Subnet <span className="text-3 font-normal">(optional)</span></label>
              <select className="input-base w-full text-sm" value={subnetId} onChange={e => setSubnetId(e.target.value)}>
                <option value="">— Default —</option>
                {subnets.map(sn => (
                  <option key={sn.SubnetId} value={sn.SubnetId ?? ''}>
                    {sn.SubnetId} ({sn.AvailabilityZone}) — {sn.CidrBlock}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User Data */}
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">User Data <span className="text-3 font-normal">(optional, plain text)</span></label>
            <textarea
              className="input-base w-full text-xs font-mono resize-none"
              rows={3}
              placeholder="#!/bin/bash&#10;echo 'Hello World'"
              value={userData}
              onChange={e => setUserData(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
          <button onClick={onClose} className="btn-ghost text-sm rounded-xl">Cancel</button>
          <button
            onClick={handleLaunch}
            disabled={loading || !effectiveImageId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Server size={14} />}
            Launch
          </button>
        </div>
      </div>
    </div>
  )
}
