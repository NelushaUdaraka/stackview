import { useState } from 'react'
import { Search, Plus, HardDrive, Loader2 } from 'lucide-react'
import type { S3BucketInfo } from '../../types'

interface Props {
  buckets: S3BucketInfo[]
  selectedBucket: S3BucketInfo | null
  onSelectBucket: (bucket: S3BucketInfo) => void
  onCreateBucket: () => void
  loading: boolean
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function S3Sidebar({
  buckets,
  selectedBucket,
  onSelectBucket,
  onCreateBucket,
  loading
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = buckets.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div
        className="px-3 pt-3 pb-2 border-b border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Buckets {!loading && buckets.length > 0 && `(${buckets.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buckets..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* Bucket list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : buckets.length === 0 ? (
              <>
                <HardDrive size={22} className="text-4 mb-2" />
                <p className="text-xs text-3">No buckets yet</p>
                <p className="text-[10px] text-4 mt-1">Create one below</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((bucket) => {
            const isSelected = selectedBucket?.name === bucket.name
            return (
              <button
                key={bucket.name}
                onClick={() => onSelectBucket(bucket)}
                title={bucket.name}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left
                  border-b border-theme transition-colors
                  border-l-2 group
                  ${isSelected
                    ? 'bg-emerald-500/10 border-l-emerald-500'
                    : 'hover:bg-raised border-l-transparent'
                  }`}
              >
                <HardDrive
                  size={14}
                  className={`mt-0.5 shrink-0 ${isSelected ? 'text-emerald-500' : 'text-4'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium break-all line-clamp-2 leading-snug ${isSelected ? 'text-1' : 'text-2'}`}>
                    {bucket.name}
                  </p>
                  {bucket.creationDate && (
                    <p className="text-[10px] text-4 mt-0.5">{formatDate(bucket.creationDate)}</p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer: create */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateBucket}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        >
          <Plus size={13} />
          New Bucket
        </button>
      </div>
    </div>
  )
}
