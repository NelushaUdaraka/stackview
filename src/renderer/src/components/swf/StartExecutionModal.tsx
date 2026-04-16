import { useState } from 'react'
import { X, GitBranch, AlertTriangle, Loader2, Play } from 'lucide-react'
import type { SwfWorkflowType } from '../../types'

interface Props {
  domain: string
  workflowTypes: SwfWorkflowType[]
  onClose: () => void
  onStarted: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

export default function StartExecutionModal({
  domain,
  workflowTypes,
  onClose,
  onStarted,
  showToast,
}: Props) {
  const registered = workflowTypes.filter((t) => t.status === 'REGISTERED')

  const [workflowId, setWorkflowId] = useState('')
  const [selectedType, setSelectedType] = useState(registered[0]?.name ?? '')
  const [selectedVersion, setSelectedVersion] = useState(registered[0]?.version ?? '')
  const [input, setInput] = useState('')
  const [tags, setTags] = useState('')
  const [executionTimeout, setExecutionTimeout] = useState('')
  const [taskTimeout, setTaskTimeout] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const versionsForType = registered
    .filter((t) => t.name === selectedType)
    .map((t) => t.version)

  const handleTypeChange = (typeName: string) => {
    setSelectedType(typeName)
    const versions = registered.filter((t) => t.name === typeName).map((t) => t.version)
    setSelectedVersion(versions[0] ?? '')
  }

  const handleSubmit = async () => {
    if (!workflowId.trim()) { setError('Workflow ID is required'); return }
    if (!selectedType) { setError('Workflow type is required'); return }
    if (!selectedVersion) { setError('Workflow version is required'); return }
    setError('')
    setSubmitting(true)

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const res = await window.electronAPI.swfStartExecution(
      domain,
      workflowId.trim(),
      selectedType,
      selectedVersion,
      input.trim() || undefined,
      tagList.length > 0 ? tagList : undefined,
      executionTimeout.trim() || undefined,
      taskTimeout.trim() || undefined
    )
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Execution "${workflowId.trim()}" started (run: ${res.data})`)
      onStarted()
    } else {
      setError(res.error || 'Failed to start execution')
    }
  }

  const uniqueTypeNames = [...new Set(registered.map((t) => t.name))]

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
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-theme sticky top-0 z-10"
          style={{ backgroundColor: 'rgb(var(--bg-base))' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500/15">
              <Play size={16} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Start Workflow Execution</h2>
              <p className="text-[10px] text-3">Domain: {domain}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Workflow ID <span className="text-red-500">*</span>
            </label>
            <input
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              placeholder="e.g. order-12345"
              className="input-base w-full text-sm"
              autoFocus
            />
            <p className="text-[10px] text-4 mt-1">Unique identifier for this execution</p>
          </div>

          {registered.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              <GitBranch size={13} className="shrink-0" />
              No registered workflow types found. Register a workflow type first.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">
                  Workflow Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="input-base w-full text-sm"
                >
                  {uniqueTypeNames.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">
                  Version <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="input-base w-full text-sm"
                >
                  {versionsForType.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Input <span className="text-4 font-normal">(optional, JSON)</span>
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"orderId": "123", "customerId": "456"}'
              rows={3}
              className="input-base w-full text-sm font-mono resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">
              Tags <span className="text-4 font-normal">(optional, comma-separated)</span>
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. production, order, high-priority"
              className="input-base w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">
                Execution Timeout (s) <span className="text-4 font-normal">(optional)</span>
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
                Task Timeout (s) <span className="text-4 font-normal">(optional)</span>
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
        <div
          className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme"
          style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.3)' }}
        >
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !workflowId.trim() || !selectedType || !selectedVersion}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Start Execution
          </button>
        </div>
      </div>
    </div>
  )
}
