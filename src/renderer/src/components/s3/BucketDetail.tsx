import { useState, useEffect } from 'react'
import { HardDrive, FolderOpen, Settings, Trash2, Check, AlertTriangle, Copy, Loader2 } from 'lucide-react'
import type { S3BucketInfo } from '../../types'
import ObjectsPanel from './ObjectsPanel'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  bucket: S3BucketInfo
  endpoint: string
  region: string
  onDeleted: () => void
}

type Tab = 'objects' | 'properties'

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export default function BucketDetail({ bucket, endpoint, region, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<Tab>('objects')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bucketRegion, setBucketRegion] = useState<string | null>(null)
  const [copiedName, setCopiedName] = useState(false)

  useEffect(() => {
    setActiveTab('objects')
    setConfirmDelete(false)
    setBucketRegion(null)
  }, [bucket.name])

  const loadBucketRegion = async () => {
    const result = await window.electronAPI.s3GetBucketLocation(bucket.name)
    if (result.success && result.data) {
      setBucketRegion(result.data)
    }
  }

  useEffect(() => {
    if (activeTab === 'properties') {
      loadBucketRegion()
    }
  }, [activeTab, bucket.name])

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setDeleting(true)
    const result = await window.electronAPI.s3DeleteBucket(bucket.name)
    setDeleting(false)
    if (result.success) {
      onDeleted()
    } else {
      showToast('error', result.error ?? 'Failed to delete bucket')
      setConfirmDelete(false)
    }
  }

  const copyName = async () => {
    await navigator.clipboard.writeText(bucket.name)
    setCopiedName(true)
    setTimeout(() => setCopiedName(false), 2000)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'objects', label: 'Objects', icon: <FolderOpen size={13} /> },
    { id: 'properties', label: 'Properties', icon: <Settings size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div
        className="px-5 pt-4 pb-0 border-b border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <HardDrive size={18} className="text-emerald-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-1 truncate">{bucket.name}</h2>
                <button onClick={copyName} className="text-4 hover:text-2 shrink-0 transition-colors">
                  {copiedName ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <p className="text-xs text-3 font-mono">{endpoint}/{bucket.name}</p>
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors shrink-0
              ${confirmDelete
                ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'
              }`}
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {confirmDelete ? 'Confirm Delete' : 'Delete Bucket'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-300'
                  : 'border-transparent text-3 hover:text-1'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'objects' && (
          <ObjectsPanel bucket={bucket.name} />
        )}
        {activeTab === 'properties' && (
          <PropertiesTab bucket={bucket} bucketRegion={bucketRegion} region={region} />
        )}
      </div>
    </div>
  )
}

function PropertiesTab({
  bucket,
  bucketRegion,
  region
}: {
  bucket: S3BucketInfo
  bucketRegion: string | null
  region: string
}) {
  return (
    <div className="p-5 overflow-y-auto h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {/* Identity */}
        <div className="card p-4 space-y-3">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Identity</p>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Bucket Name</p>
            <p className="text-sm font-mono text-1 break-all">{bucket.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-3 mb-0.5">ARN</p>
            <p className="text-xs font-mono text-2 break-all">arn:aws:s3:::{bucket.name}</p>
          </div>
        </div>

        {/* Location */}
        <div className="card p-4 space-y-3">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Location</p>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Region</p>
            {bucketRegion === null ? (
              <div className="flex items-center gap-2 text-xs text-3">
                <Loader2 size={12} className="animate-spin" />Loading…
              </div>
            ) : (
              <p className="text-sm font-mono text-1">{bucketRegion}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Active Region</p>
            <p className="text-xs font-mono text-2">{region}</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="card p-4 space-y-3">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Timestamps</p>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Created</p>
            <p className="text-xs text-2">{formatDate(bucket.creationDate)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
