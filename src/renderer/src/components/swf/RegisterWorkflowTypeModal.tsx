import { useState } from 'react'
import { X, GitBranch, AlertTriangle, Loader2, Plus } from 'lucide-react'

interface Props {
  domain: string
  onClose: () => void
  onCreated: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

export default function RegisterWorkflowTypeModal({ domain, onClose, onCreated, showToast }: Props) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0')
  const [description, setDescription] = useState('')
  const [defaultTaskList, setDefaultTaskList] = useState('')
  const [executionTimeout, setExecutionTimeout] = useState('')
  const [taskTimeout, setTaskTimeout] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Workflow type name is required'); return }
    if (!version.trim()) { setError('Version is required'); return }
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.swfRegisterWorkflowType(
      domain,
      name.trim(),
      version.trim(),
      description.trim() || undefined,
      defaultTaskList.trim() || undefined,
      executionTimeout.trim() || undefined,
      taskTimeout.trim() || undefined
    )
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Workflow type "${name.trim()}" v${version.trim()} registered`)
      onCreated()
    } else {
      setError(res.error || 'Failed to register workflow type')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500/15">
              <GitBranch size={16} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Register Workflow Type</h2>
              <p className="text-[10px] text-3">Domain: {domain}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. OrderProcessing"
                className="input-base w-full text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">
                Version <span className="text-red-500">*</span>
              </label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0"
                className="input-base w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Description{' '}
              <span className="text-4 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this workflow type does..."
              rows={2}
              className="input-base w-full text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Default Task List{' '}
              <span className="text-4 font-normal">(optional)</span>
            </label>
            <input
              value={defaultTaskList}
              onChange={(e) => setDefaultTaskList(e.target.value)}
              placeholder="e.g. default"
              className="input-base w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">
                Execution Timeout (s){' '}
                <span className="text-4 font-normal">(optional)</span>
              </label>
              <input
                value={executionTimeout}
                onChange={(e) => setExecutionTimeout(e.target.value)}
                placeholder="e.g. 3600"
                className="input-base w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">
                Decision Task Timeout (s){' '}
                <span className="text-4 font-normal">(optional)</span>
              </label>
              <input
                value={taskTimeout}
                onChange={(e) => setTaskTimeout(e.target.value)}
                placeholder="e.g. 300"
                className="input-base w-full text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.3)' }}>
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !version.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Register Type
          </button>
        </div>
      </div>
    </div>
  )
}
