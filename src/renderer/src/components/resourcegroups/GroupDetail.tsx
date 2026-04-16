import { useState, useEffect, useCallback } from 'react'
import { Boxes, Trash2, Loader2, Check, Copy, RefreshCw, FileJson, Tag, Settings } from 'lucide-react'
import type { RgGroup } from '../../types'

interface Props {
  group: RgGroup
  onDeleted: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

type Tab = 'query' | 'tags' | 'configuration'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="p-0.5 rounded hover:bg-raised text-3 hover:text-1 transition-colors shrink-0"
    >
      {copied ? <Check size={11} className="text-orange-500" /> : <Copy size={11} />}
    </button>
  )
}

export default function GroupDetail({ group, onDeleted, showToast }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('query')
  const [detail, setDetail] = useState<{
    group: RgGroup; query?: { type: string; query: string }; tags?: Record<string, string>; configuration?: any[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit query state
  const [editingQuery, setEditingQuery] = useState(false)
  const [editQueryJson, setEditQueryJson] = useState('')
  const [editQueryType, setEditQueryType] = useState<'TAG_FILTERS_1_0' | 'CLOUDFORMATION_STACK_1_0'>('TAG_FILTERS_1_0')
  const [queryJsonError, setQueryJsonError] = useState('')
  const [savingQuery, setSavingQuery] = useState(false)

  // Edit description state
  const [editingDesc, setEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [savingDesc, setSavingDesc] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.rgGetGroup(group.name)
    if (res.success && res.data) {
      setDetail(res.data)
      setEditQueryJson(res.data.query?.query ?? '{}')
      setEditQueryType((res.data.query?.type as any) ?? 'TAG_FILTERS_1_0')
      setEditDesc(res.data.group.description ?? '')
    } else {
      showToast('error', res.error ?? 'Failed to load group')
    }
    setLoading(false)
  }, [group.name, showToast])

  useEffect(() => { setActiveTab('query'); load() }, [group.name]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.rgDeleteGroup(group.name)
    setDeleting(false)
    if (res.success) {
      showToast('success', `Group "${group.name}" deleted`)
      onDeleted()
    } else {
      showToast('error', res.error ?? 'Failed to delete group')
      setConfirmDelete(false)
    }
  }

  const handleSaveQuery = async () => {
    try { JSON.parse(editQueryJson) } catch { setQueryJsonError('Invalid JSON'); return }
    setSavingQuery(true)
    const res = await window.electronAPI.rgUpdateGroupQuery(group.name, editQueryType, editQueryJson)
    setSavingQuery(false)
    if (res.success) {
      showToast('success', 'Query updated')
      setEditingQuery(false)
      load()
    } else {
      showToast('error', res.error ?? 'Failed to update query')
    }
  }

  const handleSaveDesc = async () => {
    setSavingDesc(true)
    const res = await window.electronAPI.rgUpdateGroup(group.name, editDesc)
    setSavingDesc(false)
    if (res.success) {
      showToast('success', 'Description updated')
      setEditingDesc(false)
      load()
    } else {
      showToast('error', res.error ?? 'Failed to update group')
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'query', label: 'Query', icon: <FileJson size={13} /> },
    { id: 'tags', label: 'Tags', icon: <Tag size={13} /> },
    { id: 'configuration', label: 'Configuration', icon: <Settings size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-4 pb-0 border-b border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-orange-500/10">
              <Boxes size={18} className="text-orange-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-1 truncate">{group.name}</h2>
              <p className="text-xs text-3 font-mono truncate">{group.groupArn}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={load} disabled={loading} className="btn-ghost !px-2 !py-1.5">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                  : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'
                }`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>
        <div className="flex items-center -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                ${activeTab === tab.id ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-3 hover:text-1'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-3" /></div>
        ) : !detail ? null : (
          <>
            {activeTab === 'query' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                {/* Left column: Description + ARN stacked */}
                <div className="space-y-4">
                {/* Description */}
                <div className="card p-4 border-theme">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Description</p>
                    {!editingDesc && (
                      <button onClick={() => setEditingDesc(true)} className="text-[10px] text-3 hover:text-1">Edit</button>
                    )}
                  </div>
                  {editingDesc ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="input-base w-full text-sm"
                        placeholder="Group description"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveDesc}
                          disabled={savingDesc}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg"
                        >
                          {savingDesc && <Loader2 size={11} className="animate-spin" />} Save
                        </button>
                        <button onClick={() => setEditingDesc(false)} className="btn-ghost text-xs px-3 py-1">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-2">{detail.group.description || <span className="text-4">—</span>}</p>
                  )}
                </div>

                {/* ARN */}
                <div className="card p-4 border-theme">
                  <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-2">Group ARN</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-2 break-all">{detail.group.groupArn}</p>
                    <CopyButton text={detail.group.groupArn} />
                  </div>
                </div>
                </div>{/* end left column */}

                {/* Right column: Query */}
                <div className="card p-4 border-theme">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Resource Query</p>
                      {detail.query && (
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border border-theme bg-raised text-3">
                          {detail.query.type}
                        </span>
                      )}
                    </div>
                    {!editingQuery && detail.query && (
                      <button onClick={() => setEditingQuery(true)} className="text-[10px] text-3 hover:text-1">Edit</button>
                    )}
                  </div>
                  {editingQuery ? (
                    <div className="space-y-2">
                      <div className="flex gap-2 mb-2">
                        {(['TAG_FILTERS_1_0', 'CLOUDFORMATION_STACK_1_0'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setEditQueryType(t)}
                            className={`flex-1 py-1 text-[10px] font-semibold rounded-lg border transition-colors
                              ${editQueryType === t ? 'bg-orange-500/15 border-orange-500/40 text-orange-500' : 'border-theme text-3 hover:text-2'}`}
                          >
                            {t === 'TAG_FILTERS_1_0' ? 'Tag Filters' : 'CloudFormation Stack'}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={editQueryJson}
                        onChange={(e) => { setEditQueryJson(e.target.value); try { JSON.parse(e.target.value); setQueryJsonError('') } catch { setQueryJsonError('Invalid JSON') } }}
                        rows={8}
                        spellCheck={false}
                        className={`input-base w-full text-xs font-mono resize-none ${queryJsonError ? 'border-red-500/50' : ''}`}
                      />
                      {queryJsonError && <p className="text-[10px] text-red-400">{queryJsonError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveQuery}
                          disabled={savingQuery || !!queryJsonError}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg disabled:opacity-50"
                        >
                          {savingQuery && <Loader2 size={11} className="animate-spin" />} Save Query
                        </button>
                        <button onClick={() => setEditingQuery(false)} className="btn-ghost text-xs px-3 py-1">Cancel</button>
                      </div>
                    </div>
                  ) : detail.query ? (
                    <pre className="text-xs font-mono text-2 bg-raised rounded-lg p-3 border border-theme overflow-x-auto">
                      {JSON.stringify(JSON.parse(detail.query.query), null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-4">No query configured</p>
                  )}
                </div>

              </div>
            )}

            {activeTab === 'tags' && (
              <div>
                <div className="card p-4 border-theme">
                  <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-3">Group Tags</p>
                  {!detail.tags || Object.keys(detail.tags).length === 0 ? (
                    <p className="text-sm text-4">No tags</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(detail.tags).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-3 py-1.5 border-b border-theme last:border-0">
                          <span className="text-xs font-mono font-semibold text-orange-500 w-32 shrink-0 truncate">{k}</span>
                          <span className="text-xs font-mono text-2 truncate">{v}</span>
                          <CopyButton text={v} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'configuration' && (
              <div>
                <div className="card p-4 border-theme">
                  <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-3">Group Configuration</p>
                  {!detail.configuration || detail.configuration.length === 0 ? (
                    <p className="text-sm text-4">No configuration set for this group</p>
                  ) : (
                    <pre className="text-xs font-mono text-2 bg-raised rounded-lg p-3 border border-theme overflow-x-auto">
                      {JSON.stringify(detail.configuration, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}

