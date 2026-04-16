import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Folder, FolderPlus, File, Trash2, Download, Copy, Check, Upload,
  RefreshCw, ChevronRight, Home, Link, Loader2, AlertTriangle,
  Info, X
} from 'lucide-react'
import type { S3ObjectInfo, S3ObjectMeta } from '../../types'
import UploadObjectModal from './UploadObjectModal'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  bucket: string
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined) return '—'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function displayName(key: string, prefix: string): string {
  return key.slice(prefix.length)
}

function folderName(prefixKey: string, parentPrefix: string): string {
  const name = prefixKey.slice(parentPrefix.length)
  return name.endsWith('/') ? name.slice(0, -1) : name
}

export default function ObjectsPanel({ bucket }: Props) {
  const { showToast } = useToastContext()
  const [prefix, setPrefix] = useState('')
  const [objects, setObjects] = useState<S3ObjectInfo[]>([])
  const [prefixes, setPrefixes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<S3ObjectInfo | null>(null)
  const [selectedMeta, setSelectedMeta] = useState<S3ObjectMeta | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [showUpload, setShowUpload] = useState(false)
  const [nextToken, setNextToken] = useState<string | undefined>()
  const [confirmDeleteKeys, setConfirmDeleteKeys] = useState<string[] | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const folderInputRef = useRef<HTMLInputElement>(null)

  const loadObjects = useCallback(async (p: string, token?: string) => {
    setLoading(true)
    try {
      const result = await window.electronAPI.s3ListObjects(bucket, p, token)
      if (result.success && result.data) {
        if (token) {
          setObjects((prev) => [...prev, ...result.data!.objects])
        } else {
          setObjects(result.data.objects)
        }
        setPrefixes(result.data.prefixes)
        setNextToken(result.data.nextToken)
      } else {
        showToast('error', result.error ?? 'Failed to list objects')
      }
    } finally {
      setLoading(false)
    }
  }, [bucket])

  useEffect(() => {
    setPrefix('')
    setObjects([])
    setPrefixes([])
    setSelected(null)
    setSelectedMeta(null)
    setChecked(new Set())
    loadObjects('')
  }, [bucket, loadObjects])

  const navigateToPrefix = (p: string) => {
    setPrefix(p)
    setSelected(null)
    setChecked(new Set())
    setObjects([])
    setPrefixes([])
    loadObjects(p)
  }

  const selectObject = async (obj: S3ObjectInfo) => {
    setSelected(obj)
    setLoadingMeta(true)
    setSelectedMeta(null)
    const result = await window.electronAPI.s3HeadObject(bucket, obj.key)
    if (result.success && result.data) {
      setSelectedMeta(result.data)
    }
    setLoadingMeta(false)
  }

  const toggleCheck = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAll = () => {
    if (checked.size === objects.length) {
      setChecked(new Set())
    } else {
      setChecked(new Set(objects.map((o) => o.key)))
    }
  }

  const handleDeleteObject = async (key: string) => {
    const result = await window.electronAPI.s3DeleteObject(bucket, key)
    if (result.success) {
      setObjects((prev) => prev.filter((o) => o.key !== key))
      if (selected?.key === key) { setSelected(null); setSelectedMeta(null) }
      setChecked((prev) => { const n = new Set(prev); n.delete(key); return n })
      showToast('success', 'Object deleted')
    } else {
      showToast('error', result.error ?? 'Delete failed')
    }
    setConfirmDeleteKeys(null)
  }

  const handleBulkDelete = async () => {
    const keys = Array.from(checked)
    const result = await window.electronAPI.s3DeleteObjects(bucket, keys)
    if (result.success) {
      setObjects((prev) => prev.filter((o) => !checked.has(o.key)))
      if (selected && checked.has(selected.key)) { setSelected(null); setSelectedMeta(null) }
      setChecked(new Set())
      showToast('success', `Deleted ${result.data ?? keys.length} object(s)`)
    } else {
      showToast('error', result.error ?? 'Bulk delete failed')
    }
    setConfirmDeleteKeys(null)
  }

  const handleDownload = async (obj: S3ObjectInfo) => {
    const name = displayName(obj.key, prefix) || obj.key.split('/').pop() || 'download'
    const { canceled, filePath } = await window.electronAPI.saveFile(name)
    if (canceled || !filePath) return
    const result = await window.electronAPI.s3DownloadObject(bucket, obj.key, filePath)
    if (result.success) {
      showToast('success', 'Downloaded successfully')
    } else {
      showToast('error', result.error ?? 'Download failed')
    }
  }

  const openCreateFolder = () => {
    setShowCreateFolder(true)
    setNewFolderName('')
    setTimeout(() => folderInputRef.current?.focus(), 50)
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    const key = `${prefix}${name}/`
    const result = await window.electronAPI.s3CreateFolder(bucket, key)
    if (result.success) {
      setShowCreateFolder(false)
      setNewFolderName('')
      showToast('success', `Folder "${name}" created`)
      loadObjects(prefix)
    } else {
      showToast('error', result.error ?? 'Failed to create folder')
    }
  }

  // Breadcrumb segments from prefix
  const breadcrumbs: { label: string; prefix: string }[] = [
    { label: bucket, prefix: '' }
  ]
  if (prefix) {
    const parts = prefix.split('/').filter(Boolean)
    parts.forEach((part, i) => {
      breadcrumbs.push({ label: part, prefix: parts.slice(0, i + 1).join('/') + '/' })
    })
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Confirm delete overlay */}
      {confirmDeleteKeys && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="card p-5 shadow-xl w-80">
            <p className="text-sm font-semibold text-1 mb-1">Confirm Delete</p>
            <p className="text-xs text-3 mb-4">
              Delete {confirmDeleteKeys.length === 1
                ? <span className="font-mono text-2">{confirmDeleteKeys[0].split('/').pop()}</span>
                : `${confirmDeleteKeys.length} objects`}? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteKeys(null)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
              <button
                onClick={() => confirmDeleteKeys.length === 1
                  ? handleDeleteObject(confirmDeleteKeys[0])
                  : handleBulkDelete()
                }
                className="btn-danger text-xs py-1.5 px-3"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
      >
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 flex-1 min-w-0 text-xs">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.prefix} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight size={11} className="text-4 shrink-0" />}
              {i === 0 && <Home size={11} className="text-4 shrink-0" />}
              <button
                onClick={() => i < breadcrumbs.length - 1 && navigateToPrefix(crumb.prefix)}
                className={`truncate transition-colors ${
                  i < breadcrumbs.length - 1
                    ? 'text-3 hover:text-1'
                    : 'text-1 font-medium cursor-default'
                }`}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {checked.size > 0 && (
            <button
              onClick={() => setConfirmDeleteKeys(Array.from(checked))}
              className="btn-danger gap-1 !py-1 !px-2.5 text-xs"
            >
              <Trash2 size={12} />
              Delete {checked.size}
            </button>
          )}
          <button
            onClick={openCreateFolder}
            className="btn-secondary gap-1 !py-1 !px-2.5 text-xs"
            title="New folder"
          >
            <FolderPlus size={12} />
            New Folder
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary gap-1 !py-1 !px-2.5 text-xs"
          >
            <Upload size={12} />
            Upload
          </button>
          <button
            onClick={() => { setChecked(new Set()); loadObjects(prefix) }}
            disabled={loading}
            className="btn-ghost !px-2 !py-1.5"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Inline create folder bar */}
      {showCreateFolder && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-b border-theme shrink-0"
          style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.7)' }}
        >
          <FolderPlus size={13} className="text-amber-500 shrink-0" />
          <input
            ref={folderInputRef}
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') { setShowCreateFolder(false); setNewFolderName('') }
            }}
            placeholder="Folder name…"
            className="input-base flex-1 text-xs !py-1"
          />
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
            className="btn-primary text-xs !py-1 !px-3 gap-1"
          >
            <Check size={12} />
            Create
          </button>
          <button
            onClick={() => { setShowCreateFolder(false); setNewFolderName('') }}
            className="btn-ghost !py-1 !px-2 text-xs"
            title="Cancel"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Body: list + detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Object list */}
        <div className="flex flex-col overflow-hidden" style={{ width: selected ? '55%' : '100%', transition: 'width 0.15s' }}>
          {/* Table header */}
          <div
            className="flex items-center gap-3 px-3 py-2 border-b border-theme text-[10px] font-bold text-4 uppercase tracking-wider shrink-0"
            style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}
          >
            <input
              type="checkbox"
              checked={objects.length > 0 && checked.size === objects.length}
              onChange={toggleAll}
              className="w-3 h-3 shrink-0"
            />
            <span className="flex-1">Name</span>
            <span className="w-20 text-right hidden sm:block">Size</span>
            <span className="w-36 hidden md:block">Modified</span>
            <span className="w-20 text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {loading && objects.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-4" />
              </div>
            ) : objects.length === 0 && prefixes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Info size={24} className="text-4 mb-3" />
                <p className="text-sm font-medium text-2 mb-1">This folder is empty</p>
                <p className="text-xs text-3">Upload objects to get started</p>
              </div>
            ) : (
              <>
                {/* Folder rows */}
                {prefixes.map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-3 px-3 py-2.5 border-b border-theme hover:bg-raised cursor-pointer group transition-colors"
                    onClick={() => navigateToPrefix(p)}
                  >
                    <div className="w-3 h-3 shrink-0" />
                    <Folder size={14} className="text-amber-500 shrink-0" />
                    <span className="flex-1 text-xs text-2 font-medium truncate min-w-0">
                      {folderName(p, prefix)}/
                    </span>
                    <span className="w-20 text-right text-[10px] text-4 hidden sm:block">—</span>
                    <span className="w-36 text-[10px] text-4 hidden md:block">—</span>
                    <div className="w-20 flex justify-end">
                      <ChevronRight size={13} className="text-4" />
                    </div>
                  </div>
                ))}

                {/* Object rows */}
                {objects.map((obj) => {
                  const name = displayName(obj.key, prefix) || obj.key
                  const isSelected = selected?.key === obj.key
                  return (
                    <div
                      key={obj.key}
                      onClick={() => selectObject(obj)}
                      className={`flex items-center gap-3 px-3 py-2.5 border-b border-theme cursor-pointer group transition-colors
                        ${isSelected ? 'bg-emerald-500/10' : 'hover:bg-raised'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(obj.key)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleCheck(obj.key)}
                        className="w-3 h-3 shrink-0"
                      />
                      <File size={14} className={`shrink-0 ${isSelected ? 'text-emerald-500' : 'text-3'}`} />
                      <span className={`flex-1 text-xs truncate min-w-0 ${isSelected ? 'text-1 font-medium' : 'text-2'}`}>
                        {name}
                      </span>
                      <span className="w-20 text-right text-[10px] text-3 hidden sm:block">{formatBytes(obj.size)}</span>
                      <span className="w-36 text-[10px] text-3 hidden md:block truncate">{formatDate(obj.lastModified)}</span>
                      <div className="w-20 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(obj) }}
                          className="p-1 text-3 hover:text-1 rounded transition-colors"
                          title="Download"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteKeys([obj.key]) }}
                          className="p-1 text-3 hover:text-red-500 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Load more */}
                {nextToken && (
                  <div className="flex justify-center py-3">
                    <button
                      onClick={() => loadObjects(prefix, nextToken)}
                      disabled={loading}
                      className="btn-ghost text-xs gap-1.5"
                    >
                      {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div
            className="flex flex-col overflow-y-auto border-l border-theme"
            style={{ width: '45%', backgroundColor: 'rgb(var(--bg-base))' }}
          >
            <ObjectDetailPanel
              bucket={bucket}
              obj={selected}
              meta={selectedMeta}
              loadingMeta={loadingMeta}
              onClose={() => { setSelected(null); setSelectedMeta(null) }}
              onDelete={() => setConfirmDeleteKeys([selected.key])}
              onDownload={() => handleDownload(selected)}
            />
          </div>
        )}
      </div>

      {showUpload && (
        <UploadObjectModal
          bucket={bucket}
          prefix={prefix}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); loadObjects(prefix) }}
        />
      )}
    </div>
  )
}

// ── Object Detail Panel ──────────────────────────────────────────────────────

interface DetailProps {
  bucket: string
  obj: S3ObjectInfo
  meta: S3ObjectMeta | null
  loadingMeta: boolean
  onClose: () => void
  onDelete: () => void
  onDownload: () => void
}

function ObjectDetailPanel({
  bucket, obj, meta, loadingMeta, onClose, onDelete, onDownload
}: DetailProps) {
  const { showToast } = useToastContext()
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const name = obj.key.split('/').pop() || obj.key

  const generateUrl = async () => {
    setLoadingUrl(true)
    const result = await window.electronAPI.s3GetPresignedUrl(bucket, obj.key, 3600)
    if (result.success && result.data) {
      setPresignedUrl(result.data)
    } else {
      showToast('error', result.error ?? 'Failed to generate URL')
    }
    setLoadingUrl(false)
  }

  const copyText = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <File size={14} className="text-emerald-500 shrink-0" />
          <span className="text-sm font-bold text-1 truncate">{name}</span>
        </div>
        <button onClick={onClose} className="text-4 hover:text-2 shrink-0 p-1">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Key */}
      <div>
        <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Object Key</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-2 break-all">{obj.key}</span>
          <button onClick={() => copyText(obj.key, setCopiedKey)} className="text-4 hover:text-2 shrink-0">
            {copiedKey ? <Check size={11} /> : <Copy size={11} />}
          </button>
        </div>
      </div>

      {/* Metadata */}
      {loadingMeta ? (
        <div className="flex items-center gap-2 text-xs text-3">
          <Loader2 size={13} className="animate-spin" />
          Loading metadata…
        </div>
      ) : meta ? (
        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {[
                ['Size', formatBytes(meta.size)],
                ['Content Type', meta.contentType ?? '—'],
                ['Last Modified', formatDate(meta.lastModified)],
                ['ETag', meta.etag ?? '—'],
              ].map(([k, v], i) => (
                <tr key={k} className="border-b border-theme last:border-0"
                  style={i % 2 ? { backgroundColor: 'rgb(var(--bg-raised) / 0.5)' } : undefined}>
                  <td className="px-3 py-2 text-3 font-medium w-2/5">{k}</td>
                  <td className="px-3 py-2 text-2 font-mono break-all">{v}</td>
                </tr>
              ))}
              {meta.metadata && Object.entries(meta.metadata).map(([k, v], i) => (
                <tr key={`meta-${k}`} className="border-b border-theme last:border-0"
                  style={i % 2 ? { backgroundColor: 'rgb(var(--bg-raised) / 0.5)' } : undefined}>
                  <td className="px-3 py-2 text-3 font-medium w-2/5">{k}</td>
                  <td className="px-3 py-2 text-2 font-mono break-all">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Presigned URL */}
      <div>
        <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-2">Presigned URL</p>
        {presignedUrl ? (
          <div className="space-y-2">
            <div
              className="flex items-start gap-2 p-2 rounded-lg border border-theme"
              style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
            >
              <span className="font-mono text-[10px] text-3 break-all flex-1">{presignedUrl}</span>
              <button
                onClick={() => copyText(presignedUrl, setCopiedUrl)}
                className="text-4 hover:text-2 shrink-0 mt-0.5"
              >
                {copiedUrl ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
            <p className="text-[10px] text-4">Expires in 1 hour</p>
          </div>
        ) : (
          <button
            onClick={generateUrl}
            disabled={loadingUrl}
            className="btn-ghost text-xs gap-1.5 border border-theme w-full justify-center py-2"
          >
            {loadingUrl ? <Loader2 size={12} className="animate-spin" /> : <Link size={12} />}
            Generate Presigned URL
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={onDownload} className="btn-secondary flex-1 gap-1.5 text-xs py-1.5 justify-center">
          <Download size={13} />
          Download
        </button>
        <button onClick={onDelete} className="btn-danger flex-1 gap-1.5 text-xs py-1.5 justify-center">
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  )
}
