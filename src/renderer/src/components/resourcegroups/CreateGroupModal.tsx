import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

const DEFAULT_TAG_QUERY = JSON.stringify({
  ResourceTypeFilters: ['AWS::AllSupported'],
  TagFilters: [{ Key: 'env', Values: ['dev'] }],
}, null, 2)

interface Props {
  onClose: () => void
  onCreated: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

export default function CreateGroupModal({ onClose, onCreated, showToast }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [queryType, setQueryType] = useState<'TAG_FILTERS_1_0' | 'CLOUDFORMATION_STACK_1_0'>('TAG_FILTERS_1_0')
  const [queryJson, setQueryJson] = useState(DEFAULT_TAG_QUERY)
  const [saving, setSaving] = useState(false)
  const [jsonError, setJsonError] = useState('')

  const validateJson = (value: string) => {
    try { JSON.parse(value); setJsonError('') } catch { setJsonError('Invalid JSON') }
    setQueryJson(value)
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    if (jsonError) return
    try { JSON.parse(queryJson) } catch { setJsonError('Invalid JSON'); return }
    setSaving(true)
    const res = await window.electronAPI.rgCreateGroup(name.trim(), description, queryType, queryJson)
    setSaving(false)
    if (res.success) {
      showToast('success', `Group "${name}" created`)
      onCreated()
    } else {
      showToast('error', res.error ?? 'Failed to create group')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl flex flex-col" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h3 className="text-sm font-bold text-1">Create Resource Group</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={14} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-resource-group"
              className="input-base w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="input-base w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Query Type</label>
            <div className="flex gap-2">
              {(['TAG_FILTERS_1_0', 'CLOUDFORMATION_STACK_1_0'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setQueryType(t)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                    ${queryType === t ? 'bg-orange-500/15 border-orange-500/40 text-orange-500' : 'border-theme text-3 hover:text-2'}`}
                >
                  {t === 'TAG_FILTERS_1_0' ? 'Tag Filters' : 'CloudFormation Stack'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-4 uppercase tracking-wider">Resource Query (JSON)</label>
              {jsonError && <span className="text-[10px] text-red-400">{jsonError}</span>}
            </div>
            <textarea
              value={queryJson}
              onChange={(e) => validateJson(e.target.value)}
              rows={8}
              spellCheck={false}
              className={`input-base w-full text-xs font-mono resize-none ${jsonError ? 'border-red-500/50' : ''}`}
            />
            <p className="text-[10px] text-4 mt-1">
              {queryType === 'TAG_FILTERS_1_0'
                ? 'Use ResourceTypeFilters and TagFilters to match resources by tag.'
                : 'Use StackIdentifier to reference a CloudFormation stack ARN.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-theme">
          <button onClick={onClose} className="btn-ghost text-xs px-4 py-2">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim() || !!jsonError}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Create Group
          </button>
        </div>
      </div>
    </div>
  )
}
