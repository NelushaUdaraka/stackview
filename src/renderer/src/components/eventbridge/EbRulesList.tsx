import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Power, Search, Clock, Target, ChevronDown, ChevronRight, X, LayoutList, Loader2, Workflow, AlertTriangle, Check, Copy, Send } from 'lucide-react'
import type { EbBus, EbRule } from '../../types'
import EbTargetList from './EbTargetList'

interface Props {
  bus: EbBus
  showToast: (type: 'success' | 'error', text: string) => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

export default function EbRulesList({ bus, showToast }: Props) {
  const [rules, setRules] = useState<EbRule[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [deletingList, setDeletingList] = useState<string[]>([])

  const loadRules = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.ebListRules(bus.name)
    if (res.success && res.data) setRules(res.data)
    setLoading(false)
  }, [bus.name])

  useEffect(() => { loadRules() }, [loadRules])

  const filtered = rules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async (ruleName: string) => {
    setDeletingList(prev => [...prev, ruleName])
    const res = await window.electronAPI.ebDeleteRule(bus.name, ruleName)
    setDeletingList(prev => prev.filter(a => a !== ruleName))
    if (res.success) {
      showToast('success', 'Rule deleted successfully')
      loadRules()
    } else {
      showToast('error', res.error || 'Failed to delete rule')
    }
  }

  const handleToggleState = async (rule: EbRule) => {
    if (rule.state === 'ENABLED') await window.electronAPI.ebDisableRule(bus.name, rule.name)
    else await window.electronAPI.ebEnableRule(bus.name, rule.name)
    loadRules()
  }

  const toggleExpandRule = (ruleName: string) => {
    setExpandedRules(prev => {
      const next = new Set(prev)
      if (next.has(ruleName)) next.delete(ruleName)
      else next.add(ruleName)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full bg-app relative animate-in fade-in duration-300">
      <div className="px-5 py-4 border-b border-theme flex items-center justify-between shrink-0" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <h3 className="text-sm font-bold text-1 flex items-center gap-2">
          <LayoutList size={16} className="text-fuchsia-500" /> Event Rules
          <span className="ml-2 px-2 py-0.5 rounded-full bg-raised text-[10px] font-bold text-3">{rules.length}</span>
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative w-64 no-drag">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rules..."
              className="sidebar-search pl-8 bg-base"
            />
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-secondary text-xs py-1.5 gap-1.5 border-fuchsia-500/30 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 text-fuchsia-600 dark:text-fuchsia-400 font-semibold uppercase tracking-tight">
            <Plus size={12} /> Create Rule
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center p-12 text-3"><Loader2 size={24} className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-3 h-full">
            <Workflow size={32} className="opacity-20 mb-4" />
            <p className="text-sm font-medium text-2">No rules found</p>
            <p className="text-xs mt-1 max-w-xs leading-relaxed">Rules match incoming events and route them to targets for processing. Create your first rule to start.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme w-20">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme">Rule Name</th>
                <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme">Type / Pattern / Schedule</th>
                <th className="px-5 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {filtered.map((rule, i) => {
                const isEnabled = rule.state === 'ENABLED'
                const isExpanded = expandedRules.has(rule.name)
                const isDeleting = deletingList.includes(rule.name)
                
                return (
                  <>
                    <tr key={rule.name} className={`hover:bg-raised/30 transition-colors group border-b border-theme/50 last:border-0 ${isExpanded ? 'bg-raised/10' : ''}`}>
                      <td className="px-5 py-3">
                        <div 
                          onClick={() => handleToggleState(rule)}
                          className={`w-3 h-3 rounded-full shrink-0 cursor-pointer shadow-sm transition-all hover:scale-110 ${isEnabled ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'}`} 
                          title={isEnabled ? 'Rule is Enabled (Click to disable)' : 'Rule is Disabled (Click to enable)'} 
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-1 truncate group-hover:text-fuchsia-500 transition-colors">{rule.name}</span>
                          {rule.description ? (
                            <span className="text-[10px] text-3 truncate max-w-[200px] mt-0.5 font-medium">{rule.description}</span>
                          ) : (
                            <span className="text-[10px] text-4 italic mt-0.5">No description</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                         <div className="flex items-center gap-3">
                            {rule.eventPattern ? (
                               <div className="flex items-center gap-2 max-w-[300px]">
                                  <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/10 text-[9px] font-bold uppercase tracking-wider text-fuchsia-600 border border-fuchsia-500/20 shrink-0">PATTERN</span>
                                  <span className="text-[11px] font-mono text-3 truncate opacity-60 italic">{rule.eventPattern.replace(/\s+/g, ' ').substring(0, 40)}...</span>
                               </div>
                            ) : (
                               <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] font-bold uppercase tracking-wider text-amber-600 border border-amber-500/20 shrink-0">SCHEDULE</span>
                                  <span className="text-[11px] font-mono text-amber-600/80 font-bold">{rule.scheduleExpression}</span>
                               </div>
                            )}
                         </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                         <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => toggleExpandRule(rule.name)}
                              className={`btn-ghost !p-2 text-3 transition-all ${isExpanded ? 'text-fuchsia-500 bg-fuchsia-500/10 rotate-180' : 'hover:text-fuchsia-500'}`}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <div className="w-px h-4 bg-theme-sub mx-1 opacity-50" />
                            <button 
                              onClick={() => handleDelete(rule.name)}
                              disabled={isDeleting}
                              className="btn-ghost !p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 hover:bg-red-500/10"
                              title="Delete Rule"
                            >
                              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                         </div>
                      </td>
                    </tr>
                    {isExpanded && (
                       <tr key={`${rule.name}-expanded`}>
                          <td colSpan={4} className="px-6 py-6 bg-raised/20 border-b border-theme shadow-inner">
                             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-top-2 duration-300">
                                {/* Left Side: Rule Definition */}
                                <div className="lg:col-span-7 space-y-6">
                                   {rule.eventPattern && (
                                      <div className="space-y-3">
                                         <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-bold text-4 uppercase tracking-widest block">Rule Definition: Event Pattern</label>
                                            <div className="flex items-center gap-3">
                                               <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                                                  <Check size={10} /> Valid JSON
                                               </span>
                                               <CopyButton text={rule.eventPattern} />
                                            </div>
                                         </div>
                                         <div className="relative group/pattern">
                                            <div className="absolute -inset-0.5 bg-gradient-to-br from-fuchsia-500/20 to-transparent rounded-2xl blur opacity-20 group-hover/pattern:opacity-40 transition-opacity pointer-events-none" />
                                            <pre className="relative p-5 bg-base rounded-xl border border-theme text-xs font-mono whitespace-pre overflow-auto max-h-[400px] text-1 leading-relaxed shadow-xl custom-scrollbar">
                                               {rule.eventPattern}
                                            </pre>
                                         </div>
                                      </div>
                                   )}
                                   {rule.scheduleExpression && (
                                      <div className="space-y-3">
                                         <label className="text-[10px] font-bold text-4 uppercase tracking-widest block px-1 flex items-center gap-2">
                                            <Clock size={12} className="text-fuchsia-500" /> Trigger Schedule
                                         </label>
                                         <div className="p-6 bg-base rounded-xl border border-theme shadow-lg flex items-center justify-between group/schedule">
                                            <div className="flex items-center gap-4">
                                               <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner group-hover/schedule:scale-105 transition-transform">
                                                  <Clock size={24} />
                                               </div>
                                               <div>
                                                  <p className="text-sm font-bold text-1 font-mono">{rule.scheduleExpression}</p>
                                                  <p className="text-[11px] text-3 mt-0.5">Events will trigger based on this cron/rate expression.</p>
                                               </div>
                                            </div>
                                            <CopyButton text={rule.scheduleExpression} />
                                         </div>
                                      </div>
                                   )}
                                </div>

                                {/* Right Side: Targets */}
                                <div className="lg:col-span-5 space-y-6">
                                   <div className="space-y-3">
                                      <div className="flex items-center justify-between px-1">
                                         <div className="flex items-center gap-2">
                                            <Target size={14} className="text-fuchsia-500" />
                                            <span className="text-[10px] font-bold text-4 uppercase tracking-widest">Target Configuration</span>
                                         </div>
                                      </div>
                                      <div className="rounded-xl border border-theme bg-base overflow-x-auto relative min-h-[200px]">
                                         <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                                            <Workflow size={120} />
                                         </div>
                                         <div className="relative">
                                            <EbTargetList busName={bus.name} ruleName={rule.name} />
                                         </div>
                                      </div>
                                      <p className="text-[10px] text-4 leading-relaxed px-1">
                                         You can associate multiple AWS resources as targets for this rule. Events that match the pattern above will be delivered to all active targets.
                                      </p>
                                   </div>
                                </div>
                             </div>
                          </td>
                       </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateRuleModal busName={bus.name} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadRules() }} />}
    </div>
  )
}

function CreateRuleModal({ busName, onClose, onCreated }: { busName: string, onClose: () => void, onCreated: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [type, setType] = useState<'pattern' | 'schedule'>('pattern')
  const [pattern, setPattern] = useState('{\n  "source": ["my.app"]\n}')
  const [schedule, setSchedule] = useState('rate(5 minutes)')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      if (type === 'pattern') JSON.parse(pattern)
      const res = await window.electronAPI.ebPutRule(busName, name, type === 'pattern' ? pattern : undefined, type === 'schedule' ? schedule : undefined, desc)
      if (res.success) onCreated()
      else setError(res.error || 'Failed to create rule')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
       {/* Modal precisely matched to CreateTopicModal.tsx / CreateSubscriptionModal.tsx */}
       <div className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgb(192 38 211 / 0.15)' }}>
                   <Plus size={16} style={{ color: 'rgb(192 38 211)' }} />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-1">Create Event Rule</h2>
                   <p className="text-[10px] text-3">Bus: <span className="font-mono">{busName}</span></p>
                </div>
             </div>
             <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
          </div>
          
          <div className="p-5 overflow-auto space-y-5">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="block text-xs font-semibold text-2 ml-1 uppercase tracking-tight">Rule Name *</label>
                   <input autoFocus value={name} onChange={e => setName(e.target.value)} className="input-base w-full text-sm font-mono" placeholder="my-rule" />
                </div>
                <div className="space-y-1.5">
                   <label className="block text-xs font-semibold text-2 ml-1 uppercase tracking-tight">Type</label>
                   <div className="flex p-1 bg-raised rounded-lg border border-theme h-9">
                      <button onClick={() => setType('pattern')} className={`flex-1 text-[11px] font-bold rounded transition-all uppercase tracking-tight ${type === 'pattern' ? 'bg-base text-fuchsia-500 shadow-sm' : 'text-3 hover:text-2'}`}>Pattern</button>
                      <button onClick={() => setType('schedule')} className={`flex-1 text-[11px] font-bold rounded transition-all uppercase tracking-tight ${type === 'schedule' ? 'bg-base text-fuchsia-500 shadow-sm' : 'text-3 hover:text-2'}`}>Schedule</button>
                   </div>
                </div>
             </div>
             
             <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-2 ml-1 uppercase tracking-tight">Description</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} className="input-base w-full text-sm" placeholder="Optional description..." />
             </div>

             {type === 'pattern' ? (
                <div className="space-y-1.5">
                   <label className="block text-xs font-semibold text-2 ml-1 uppercase tracking-tight">Event Pattern (JSON) *</label>
                   <textarea value={pattern} onChange={e => setPattern(e.target.value)} className="input-base w-full min-h-[140px] font-mono !py-3 resize-none leading-relaxed" spellCheck={false} placeholder='{ "source": ["..."] }' />
                </div>
             ) : (
                <div className="space-y-1.5">
                   <label className="block text-xs font-semibold text-2 ml-1 uppercase tracking-tight">Schedule Expression *</label>
                   <input value={schedule} onChange={e => setSchedule(e.target.value)} className="input-base w-full text-sm font-mono" placeholder="rate(5 minutes)" />
                   <p className="text-[10px] text-3 mt-1 leading-relaxed italic">Use rate(5 minutes) or cron(0 12 * * ? *) syntax.</p>
                </div>
             )}

             {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
                   <AlertTriangle size={13} className="shrink-0" /> {error}
                </div>
             )}
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30 shrink-0">
             <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
             <button
                onClick={handleCreate}
                disabled={loading || !name}
                className="flex items-center gap-1.5 px-6 py-2 text-sm font-semibold bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl transition-colors disabled:opacity-40 shadow-sm hover:shadow-fuchsia-500/20"
             >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Create Rule
             </button>
          </div>
       </div>
    </div>
  )
}
