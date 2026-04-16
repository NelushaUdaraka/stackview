import { useState, useCallback, useEffect } from 'react'
import { Image, Loader2, Search } from 'lucide-react'
import type { Ec2Image } from '../../types'

export default function AMIsView() {
  const [images, setImages] = useState<Ec2Image[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.ec2ListImages(['self'])
    if (res.success && res.data) setImages(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  const filtered = images.filter(img =>
    (img.ImageId ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (img.Name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (img.Description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function stateColor(state?: string) {
    switch (state) {
      case 'available': return 'bg-emerald-500/15 text-emerald-400'
      case 'pending': return 'bg-amber-500/15 text-amber-400'
      case 'failed': return 'bg-red-500/15 text-red-400'
      default: return 'bg-zinc-500/15 text-zinc-400'
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input className="sidebar-search pl-7 w-full" placeholder="Search AMIs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1" />
        <span className="text-xs text-3">{filtered.length} image{filtered.length !== 1 ? 's' : ''}</span>
        {loading && <Loader2 size={13} className="animate-spin text-3" />}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <Image size={32} className="text-4 mb-3 opacity-20" />
            <p className="text-sm text-3 font-medium">{loading ? 'Loading...' : 'No AMIs found'}</p>
            <p className="text-xs text-4 mt-1">Only owner "self" AMIs are listed</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
              <tr className="border-b border-theme">
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Image ID</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Name</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">State</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Architecture</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Root Device</th>
                <th className="px-4 py-2.5 text-left font-semibold text-3 uppercase tracking-wider text-[10px]">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(img => (
                <tr key={img.ImageId} className="border-b border-theme hover:bg-raised transition-colors">
                  <td className="px-4 py-2.5 font-mono text-1">{img.ImageId}</td>
                  <td className="px-4 py-2.5 text-2 max-w-xs truncate">{img.Name || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${stateColor(img.State)}`}>
                      {img.State}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-2">{img.Architecture}</td>
                  <td className="px-4 py-2.5 text-2">{img.RootDeviceType}</td>
                  <td className="px-4 py-2.5 text-3">{img.CreationDate ? new Date(img.CreationDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
