import { useState, useCallback, useEffect } from 'react'
import { HardDrive, Plus, Trash2, Loader2, Search, Link, Unlink } from 'lucide-react'
import type { Ec2Volume } from '../../types'

function stateColor(state?: string) {
  switch (state) {
    case 'available': return 'bg-emerald-500/15 text-emerald-400'
    case 'in-use': return 'bg-blue-500/15 text-blue-400'
    case 'deleting': return 'bg-red-500/15 text-red-400'
    default: return 'bg-zinc-500/15 text-zinc-400'
  }
}

export default function VolumesView() {
  const [volumes, setVolumes] = useState<Ec2Volume[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ az: 'us-east-1a', size: '8', volumeType: 'gp2' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Attach modal
  const [attachModal, setAttachModal] = useState<string | null>(null)
  const [attachForm, setAttachForm] = useState({ instanceId: '', device: '/dev/sdf' })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.ec2ListVolumes()
    if (res.success && res.data) setVolumes(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setCreating(true); setError(null)
    const res = await window.electronAPI.ec2CreateVolume({
      availabilityZone: form.az,
      size: parseInt(form.size),
      volumeType: form.volumeType,
    })
    setCreating(false)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    setShowCreate(false); load()
  }

  const handleDelete = async (volumeId: string) => {
    if (!confirm(`Delete volume ${volumeId}?`)) return
    const res = await window.electronAPI.ec2DeleteVolume(volumeId)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    load()
  }

  const handleAttach = async () => {
    if (!attachModal || !attachForm.instanceId) return
    const res = await window.electronAPI.ec2AttachVolume({
      volumeId: attachModal,
      instanceId: attachForm.instanceId,
      device: attachForm.device,
    })
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    setAttachModal(null); load()
  }

  const handleDetach = async (volumeId: string) => {
    if (!confirm(`Detach volume ${volumeId}?`)) return
    const res = await window.electronAPI.ec2DetachVolume(volumeId)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    load()
  }

  const filtered = volumes.filter(v =>
    (v.VolumeId ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.AvailabilityZone ?? '').includes(search) ||
    (v.VolumeType ?? '').includes(search)
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input className="sidebar-search pl-7 w-full" placeholder="Search volumes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1" />
        <span className="text-xs text-3">{filtered.length} volume{filtered.length !== 1 ? 's' : ''}</span>
        {loading && <Loader2 size={13} className="animate-spin text-3" />}
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
        >
          <Plus size={13} /> Create Volume
        </button>
      </div>

      {showCreate && (
        <div className="px-4 py-3 border-b border-theme shrink-0 space-y-2" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
          <div className="flex gap-2 flex-wrap">
            <input className="input-base text-sm w-36" placeholder="Availability Zone" value={form.az} onChange={e => setForm(f => ({ ...f, az: e.target.value }))} />
            <input className="input-base text-sm w-20" placeholder="Size (GiB)" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} type="number" min={1} />
            <select className="input-base text-sm w-24" value={form.volumeType} onChange={e => setForm(f => ({ ...f, volumeType: e.target.value }))}>
              <option value="gp2">gp2</option>
              <option value="gp3">gp3</option>
              <option value="io1">io1</option>
              <option value="st1">st1</option>
              <option value="sc1">sc1</option>
              <option value="standard">standard</option>
            </select>
            <button onClick={handleCreate} disabled={creating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg disabled:opacity-50">
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost text-xs rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {error && <p className="mx-4 mt-2 text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 shrink-0">{error}</p>}

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <HardDrive size={32} className="text-4 mb-3 opacity-20" />
            <p className="text-sm text-3 font-medium">{loading ? 'Loading...' : 'No volumes found'}</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
              <tr className="border-b border-theme">
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Volume ID</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Size</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Type</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">AZ</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">State</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Attachment</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(vol => {
                const attachment = vol.Attachments?.[0]
                return (
                  <tr key={vol.VolumeId} className="border-b border-theme hover:bg-raised transition-colors">
                    <td className="px-4 py-2.5 font-mono text-1">{vol.VolumeId}</td>
                    <td className="px-4 py-2.5 text-2">{vol.Size} GiB</td>
                    <td className="px-4 py-2.5 text-2">{vol.VolumeType}</td>
                    <td className="px-4 py-2.5 text-2">{vol.AvailabilityZone}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${stateColor(vol.State)}`}>
                        {vol.State}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-2 text-[10px]">
                      {attachment ? `${attachment.InstanceId} (${attachment.Device})` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        {vol.State === 'available' ? (
                          <button
                            onClick={() => { setAttachModal(vol.VolumeId!); setAttachForm({ instanceId: '', device: '/dev/sdf' }) }}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Link size={11} /> Attach
                          </button>
                        ) : vol.State === 'in-use' ? (
                          <button
                            onClick={() => handleDetach(vol.VolumeId!)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                          >
                            <Unlink size={11} /> Detach
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(vol.VolumeId!)}
                          disabled={vol.State === 'in-use'}
                          className="p-1.5 text-3 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Attach modal */}
      {attachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-80 rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
            <div className="px-4 py-3 border-b border-theme flex items-center justify-between" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.6)' }}>
              <p className="text-sm font-bold text-1">Attach Volume</p>
              <button onClick={() => setAttachModal(null)} className="btn-ghost !p-1.5 rounded-lg"><HardDrive size={13} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-2 mb-1">Instance ID</label>
                <input className="input-base w-full text-sm" placeholder="i-xxxxxxxxx" value={attachForm.instanceId} onChange={e => setAttachForm(f => ({ ...f, instanceId: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1">Device Name</label>
                <input className="input-base w-full text-sm font-mono" placeholder="/dev/sdf" value={attachForm.device} onChange={e => setAttachForm(f => ({ ...f, device: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 pb-4">
              <button onClick={() => setAttachModal(null)} className="btn-ghost text-sm rounded-xl">Cancel</button>
              <button onClick={handleAttach} disabled={!attachForm.instanceId} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl disabled:opacity-50">
                <Link size={13} /> Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
