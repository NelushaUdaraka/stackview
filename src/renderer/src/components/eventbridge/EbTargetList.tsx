import { useState, useCallback, useEffect } from 'react'
import { Plus, Trash2, Crosshair, Target as TargetIcon, Database, ArrowRight, ShieldCheck, X, Loader2 } from 'lucide-react'
import type { EbTarget } from '../../types'

interface Props {
  busName: string
  ruleName: string
}

export default function EbTargetList({ busName, ruleName }: Props) {
  const [targets, setTargets] = useState<EbTarget[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const [newId, setNewId] = useState('')
  const [newArn, setNewArn] = useState('')
  const [newInput, setNewInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const loadTargets = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.ebListTargetsByRule(busName, ruleName)
    if (res.success && res.data) {
      setTargets(res.data)
    }
    setLoading(false)
  }, [busName, ruleName])

  useEffect(() => {
    loadTargets()
  }, [loadTargets])

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newId.trim() || !newArn.trim()) return
    setErrorMsg('')
    setAdding(true)

    if (newInput.trim()) {
      try {
        JSON.parse(newInput)
      } catch {
        setErrorMsg('Input must be a valid JSON string.')
        setAdding(false)
        return
      }
    }

    const res = await window.electronAPI.ebPutTargets(busName, ruleName, [{
      id: newId.trim(),
      arn: newArn.trim(),
      input: newInput.trim() || undefined
    }])

    if (res.success) {
      setNewId('')
      setNewArn('')
      setNewInput('')
      setShowAdd(false)
      loadTargets()
    } else {
      setErrorMsg(res.error || 'Failed to add target')
    }
    setAdding(false)
  }

  const handleRemoveTarget = async (targetId: string) => {
    const res = await window.electronAPI.ebRemoveTargets(busName, ruleName, [targetId])
    if (res.success) {
      loadTargets()
    }
  }

  return (
    <div className="flex flex-col h-full bg-app/50 animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-4 border-b border-theme bg-base">
        <div className="text-[10px] font-bold text-2 flex items-center gap-2 uppercase tracking-widest">
          <TargetIcon size={14} className="text-fuchsia-500" />
          Configured Targets
          {!loading && targets.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-base border border-theme text-3 font-mono">{targets.length}</span>}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-md border
            ${showAdd ? 'bg-raised border-theme text-1' : 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-600 hover:bg-fuchsia-500/20'}`}
        >
          {showAdd ? <X size={12} /> : <Plus size={12} />}
          {showAdd ? 'Close' : 'Add Target'}
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-[160px] p-2">
        {showAdd && (
          <form onSubmit={handleAddTarget} className="bg-base p-5 rounded-xl border border-theme mb-4 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-center gap-2 mb-2 text-fuchsia-500 font-bold text-[11px] uppercase tracking-wide">
                <ShieldCheck size={14} /> NEW TARGET DEFINITION
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-3 uppercase font-bold tracking-tight block ml-1">Target ID *</label>
                <input value={newId} onChange={e => setNewId(e.target.value)} required className="input-base w-full text-xs" placeholder="e.g. LambdaTarget" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-3 uppercase font-bold tracking-tight block ml-1">ARN *</label>
                <input value={newArn} onChange={e => setNewArn(e.target.value)} required className="input-base w-full text-xs font-mono" placeholder="arn:aws:lambda:..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-3 uppercase font-bold tracking-tight block ml-1">Constant Input (Optional JSON)</label>
              <textarea
                value={newInput}
                onChange={e => setNewInput(e.target.value)}
                className="input-base w-full !py-2.5 !text-xs min-h-[90px] font-mono whitespace-pre resize-none leading-relaxed"
                placeholder='{ "key": "value" }'
                spellCheck={false}
              />
            </div>
            {errorMsg && <div className="text-[10px] text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-medium">{errorMsg}</div>}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={adding || !newId || !newArn} className="btn-primary px-6 h-8 text-xs bg-fuchsia-600 hover:bg-fuchsia-500 font-bold shadow-lg shadow-fuchsia-500/20">
                {adding ? <Loader2 size={14} className="animate-spin" /> : 'Register Target'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8 text-3 animate-pulse"><Loader2 size={24} className="animate-spin" /></div>
        ) : targets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
             <Crosshair size={32} className="text-4 opacity-10 mb-3" />
             <p className="text-[11px] text-4 font-bold uppercase tracking-widest italic">No Targets Found</p>
             <p className="text-[10px] text-4 mt-1">Configure a target to route matching events.</p>
          </div>
        ) : (
          <div className="space-y-2.5 px-1">
            {targets.map(t => (
              <div key={t.id} className="group p-3 bg-base rounded-xl border border-theme/80 hover:border-fuchsia-500/30 transition-all shadow-sm hover:shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <div className="p-1.5 rounded-lg bg-raised text-fuchsia-500 border border-theme">
                        <ArrowRight size={12} />
                     </div>
                     <span className="font-bold text-1 text-[11px] tracking-tight">{t.id}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveTarget(t.id)}
                    className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove Target"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-3 font-mono text-[10px] bg-raised/50 py-1 px-2 rounded-lg border border-theme/30 truncate select-all">
                   <Database size={10} className="shrink-0" /> {t.arn}
                </div>
                {t.input && (
                  <div className="mt-2.5 pt-2.5 border-t border-theme/50 flex flex-col gap-1.5">
                    <span className="text-[9px] text-4 font-bold uppercase tracking-widest ml-1">Static Payload</span>
                    <pre className="text-[10px] font-mono text-2 p-3 bg-base/80 rounded-lg overflow-x-auto border border-theme leading-relaxed">
                      {t.input}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
