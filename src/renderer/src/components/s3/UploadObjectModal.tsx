import { useState } from 'react'
import { X, Upload, FolderOpen, CheckCircle, AlertTriangle, Loader2, Trash2 } from 'lucide-react'

interface UploadFile {
  path: string
  name: string
  key: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

interface Props {
  bucket: string
  prefix: string
  onClose: () => void
  onUploaded: () => void
}

function basename(p: string) {
  return p.split(/[\\/]/).pop() ?? p
}

export default function UploadObjectModal({ bucket, prefix, onClose, onUploaded }: Props) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  const pickFiles = async () => {
    const result = await window.electronAPI.openFiles()
    if (result.canceled || !result.filePaths.length) return
    const newFiles: UploadFile[] = result.filePaths.map((p) => ({
      path: p,
      name: basename(p),
      key: prefix + basename(p),
      status: 'pending'
    }))
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.path))
      return [...prev, ...newFiles.filter((f) => !existing.has(f.path))]
    })
  }

  const removeFile = (path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path))
  }

  const updateKey = (path: string, key: string) => {
    setFiles((prev) => prev.map((f) => f.path === path ? { ...f, key } : f))
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    let allOk = true
    for (const file of files) {
      setFiles((prev) =>
        prev.map((f) => f.path === file.path ? { ...f, status: 'uploading' } : f)
      )
      const result = await window.electronAPI.s3UploadObject(bucket, file.key, file.path)
      if (result.success) {
        setFiles((prev) =>
          prev.map((f) => f.path === file.path ? { ...f, status: 'done' } : f)
        )
      } else {
        allOk = false
        setFiles((prev) =>
          prev.map((f) =>
            f.path === file.path
              ? { ...f, status: 'error', error: result.error ?? 'Upload failed' }
              : f
          )
        )
      }
    }
    setUploading(false)
    setDone(true)
    if (allOk) {
      setTimeout(() => { onUploaded(); onClose() }, 800)
    }
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!uploading ? onClose : undefined} />
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl border border-theme flex flex-col"
        style={{ backgroundColor: 'rgb(var(--bg-base))', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Upload size={15} className="text-brand-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Upload Objects</h2>
              <p className="text-[10px] text-3 font-mono">{bucket}{prefix ? `/${prefix}` : ''}</p>
            </div>
          </div>
          {!uploading && (
            <button onClick={onClose} className="btn-ghost !px-2 !py-2">
              <X size={15} />
            </button>
          )}
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {files.length === 0 ? (
            <button
              onClick={pickFiles}
              className="w-full flex flex-col items-center justify-center gap-3 py-10
                border-2 border-dashed border-theme rounded-xl
                hover:border-brand-500/40 hover:bg-brand-500/5 transition-colors"
            >
              <FolderOpen size={28} className="text-4" />
              <div className="text-center">
                <p className="text-sm font-medium text-2">Click to select files</p>
                <p className="text-xs text-3 mt-0.5">Multiple files supported</p>
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <div
                  key={f.path}
                  className="flex items-center gap-3 p-3 rounded-xl border border-theme"
                  style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}
                >
                  {/* Status icon */}
                  <div className="shrink-0">
                    {f.status === 'pending' && <Upload size={14} className="text-3" />}
                    {f.status === 'uploading' && <Loader2 size={14} className="animate-spin text-brand-500" />}
                    {f.status === 'done' && <CheckCircle size={14} className="text-emerald-500" />}
                    {f.status === 'error' && <AlertTriangle size={14} className="text-red-500" />}
                  </div>

                  {/* Key input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={f.key}
                      onChange={(e) => updateKey(f.path, e.target.value)}
                      disabled={f.status !== 'pending'}
                      className="input-base !py-1 !px-2 text-xs font-mono"
                      title="Object key (path in bucket)"
                    />
                    {f.error && (
                      <p className="text-[10px] text-red-500 mt-0.5">{f.error}</p>
                    )}
                  </div>

                  {/* Remove */}
                  {f.status === 'pending' && (
                    <button
                      onClick={() => removeFile(f.path)}
                      className="shrink-0 p-1 text-4 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}

              {!uploading && !done && (
                <button
                  onClick={pickFiles}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
                    border border-dashed border-theme text-xs text-3
                    hover:border-brand-500/40 hover:text-2 transition-colors mt-1"
                >
                  <FolderOpen size={13} />
                  Add more files
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-theme shrink-0">
          <span className="text-xs text-3">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            {!uploading && (
              <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-4">
                Cancel
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading || pendingCount === 0}
              className="btn-primary text-xs py-1.5 px-4 gap-1.5"
            >
              {uploading && <Loader2 size={12} className="animate-spin" />}
              {uploading ? 'Uploading...' : `Upload ${pendingCount > 0 ? pendingCount : ''} File${pendingCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
