import { useState, useEffect, useRef } from 'react'
import {
  X, LayoutTemplate, Loader2, Plus, Trash2,
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  FileText, ClipboardPaste, UploadCloud, Wand2
} from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  stackName: string
  onClose: () => void
  onUpdated: () => void
}

interface Param {
  id: string
  key: string
  description: string
  defaultValue: string
  allowedValues: string[]
  noEcho: boolean
  value: string
  usePrevious: boolean         // keep existing value
}

const CAPABILITIES = ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND']
const STEPS = ['Template', 'Parameters', 'Configure', 'Review']

function formatTemplate(body: string): string {
  try {
    const parsed = JSON.parse(body)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return body.split('\n').map(l => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n')
  }
}

export default function UpdateStackModal({ stackName, onClose, onUpdated }: Props) {
  const { showToast } = useToastContext()
  const [step, setStep] = useState(0)

  // Step 1 – Template
  const [templateSource, setTemplateSource] = useState<'paste' | 'file'>('paste')
  const [templateBody, setTemplateBody] = useState('')
  const [fileName, setFileName] = useState('')
  const [fetching, setFetching] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  // Validation
  const [validating, setValidating] = useState(false)
  const [validState, setValidState] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [validError, setValidError] = useState('')
  const [validDesc, setValidDesc] = useState('')
  const [detectedCaps, setDetectedCaps] = useState<string[]>([])

  // Step 2 – Parameters (pre-populated from describe stack)
  const [params, setParams] = useState<Param[]>([])

  // Step 3 – Configure
  const [capabilities, setCapabilities] = useState<string[]>([])
  const [tags, setTags] = useState<{ id: string; key: string; value: string }[]>([])

  // Submission
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // ── Fetch current template AND existing parameters ────────────────────────
  useEffect(() => {
    const fetchExisting = async () => {
      setFetching(true)
      const [tplRes, descRes] = await Promise.all([
        window.electronAPI.cfnGetTemplate(stackName),
        window.electronAPI.cfnDescribeStack(stackName),
      ])
      if (tplRes.success && tplRes.data) setTemplateBody(tplRes.data)
      else showToast('error', 'Failed to fetch current template')

      if (descRes.success && descRes.data?.Parameters) {
        // Pre-populate params from the current deployed stack
        const existing: Param[] = descRes.data.Parameters.map((p: any) => ({
          id: p.ParameterKey,
          key: p.ParameterKey,
          description: '',
          defaultValue: '',
          allowedValues: [],
          noEcho: false,
          value: p.ParameterValue ?? '',
          usePrevious: true,
        }))
        setParams(existing)
      }
      setFetching(false)
    }
    fetchExisting()
  }, [stackName])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const text = await file.text()
    setTemplateBody(text)
    setValidState('idle')
  }

  const handleFormat = () => setTemplateBody(formatTemplate(templateBody))

  const validateTemplate = async (body: string) => {
    if (!body.trim()) { setValidState('invalid'); setValidError('Template is empty'); return false }
    setValidating(true); setValidState('idle'); setValidError(''); setValidDesc('')
    const res = await window.electronAPI.cfnValidateTemplate(body)
    setValidating(false)
    if (res.success && res.data) {
      setValidState('valid')
      setValidDesc(res.data.description ?? '')
      setDetectedCaps(res.data.capabilities ?? [])
      // Merge template params with existing values
      const incoming: Param[] = (res.data.parameters ?? []).map((p: any) => ({
        id: p.key,
        key: p.key,
        description: p.description ?? '',
        defaultValue: p.defaultValue ?? '',
        allowedValues: p.allowedValues ?? [],
        noEcho: p.noEcho ?? false,
        value: p.defaultValue ?? '',
        usePrevious: false,
      }))
      setParams(prev => {
        const existingMap = new Map(prev.map(x => [x.key, x]))
        return incoming.map(ip => {
          const ex = existingMap.get(ip.key)
          return ex ? { ...ip, value: ex.value, usePrevious: ex.usePrevious } : ip
        })
      })
      return true
    } else {
      setValidState('invalid'); setValidError(res.error ?? 'Validation failed'); return false
    }
  }

  const handleNextFromTemplate = async () => {
    const ok = await validateTemplate(templateBody)
    if (ok) setStep(1)
  }

  const updateParam = (id: string, field: 'value' | 'usePrevious', val: string | boolean) =>
    setParams(p => p.map(x => x.id === id ? { ...x, [field]: val } : x))

  const toggleCap = (c: string) =>
    setCapabilities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  const addTag = () =>
    setTags(t => [...t, { id: Math.random().toString(36).substr(2,8), key: '', value: '' }])
  const updateTag = (id: string, f: 'key' | 'value', v: string) =>
    setTags(t => t.map(x => x.id === id ? { ...x, [f]: v } : x))
  const removeTag = (id: string) => setTags(t => t.filter(x => x.id !== id))

  const handleUpdate = async () => {
    setLoading(true); setSubmitError('')
    const ps = params
      .filter(p => p.key.trim() && !p.usePrevious)
      .map(p => ({ key: p.key, value: p.value }))
    const res = await window.electronAPI.cfnUpdateStack(stackName, templateBody, ps, capabilities)
    setLoading(false)
    if (res.success) { onUpdated() } else { setSubmitError(res.error ?? 'Failed to update stack') }
  }

  const canGoNext = (): boolean => {
    if (step === 0) return templateBody.trim().length > 0
    return true
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl border border-theme flex flex-col max-h-[90vh]" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(249 115 22 / 0.1)' }}>
              <LayoutTemplate size={15} style={{ color: 'rgb(249 115 22)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Update Stack</h2>
              <p className="text-xs text-3 font-mono">{stackName}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2"><X size={15} /></button>
        </div>

        {/* Step progress */}
        <div className="px-6 py-3 border-b border-theme shrink-0">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <button onClick={() => i < step ? setStep(i) : undefined}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-colors
                    ${i === step ? 'text-orange-500' : i < step ? 'text-2 hover:text-orange-400 cursor-pointer' : 'text-4 cursor-default'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                    ${i === step ? 'bg-orange-500 text-white' : i < step ? 'bg-emerald-500 text-white' : 'bg-raised text-3'}`}>
                    {i < step ? '✓' : i + 1}
                  </span>{s}
                </button>
                {i < STEPS.length - 1 && <ChevronRight size={13} className="text-4 mx-0.5 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Step 0: Template ── */}
          {step === 0 && (
            fetching ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-3" /></div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-3 leading-relaxed">The current deployed template is pre-loaded. Edit it, or upload a replacement file.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setTemplateSource('paste'); setFileName('') }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors
                      ${templateSource === 'paste' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-theme text-2 hover:border-orange-500/50'}`}>
                    <ClipboardPaste size={13} /> Edit current template
                  </button>
                  <button onClick={() => { setTemplateSource('file'); fileRef.current?.click() }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors
                      ${templateSource === 'file' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-theme text-2 hover:border-orange-500/50'}`}>
                    <UploadCloud size={13} /> Replace with file
                  </button>
                  <input ref={fileRef} type="file" accept=".yaml,.yml,.json,.template" className="hidden" onChange={handleFileSelect} />
                  {fileName && <span className="flex items-center gap-1 text-xs text-2 ml-1"><FileText size={12} />{fileName}</span>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-4 uppercase tracking-wider">Template Body</label>
                    <div className="flex items-center gap-3">
                      <button onClick={handleFormat} disabled={!templateBody.trim()}
                        className="flex items-center gap-1.5 text-xs font-semibold text-2 hover:text-1 disabled:opacity-40 transition-colors">
                        <Wand2 size={12} /> Format
                      </button>
                      <button onClick={() => validateTemplate(templateBody)} disabled={validating || !templateBody.trim()}
                        className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-400 disabled:opacity-40 transition-colors">
                        {validating ? <Loader2 size={12} className="animate-spin" /> : null} Validate
                      </button>
                    </div>
                  </div>
                  <textarea value={templateBody} onChange={e => { setTemplateBody(e.target.value); setValidState('idle'); setValidError('') }}
                    className="input-base w-full font-mono text-xs resize-none" rows={13} />
                  {validState === 'valid' && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-emerald-500">
                      <CheckCircle2 size={13} /><span>Template is valid{validDesc ? ` — ${validDesc}` : ''}</span>
                    </div>
                  )}
                  {validState === 'invalid' && (
                    <div className="flex items-start gap-2 mt-2 text-xs text-red-500">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" /><span>{validError}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* ── Step 1: Parameters ── */}
          {step === 1 && (
            <div className="space-y-3">
              {params.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-3">
                  <CheckCircle2 size={28} className="text-emerald-500 mb-3" />
                  <p className="text-sm font-semibold text-2">No parameters</p>
                  <p className="text-xs mt-1">This template has no configurable parameters.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-3">Previous parameter values are pre-filled. Toggle "Use previous value" to keep existing values without change.</p>
                  {params.map(p => (
                    <div key={p.id} className="space-y-1.5 p-3 rounded-xl border border-theme bg-raised/20">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <label className="text-xs font-semibold text-1 truncate">{p.key}</label>
                          {p.defaultValue && (
                            <span className="text-[10px] text-3 font-mono bg-raised px-1.5 py-0.5 rounded shrink-0">
                              default: {p.defaultValue}
                            </span>
                          )}
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                          <input type="checkbox" checked={p.usePrevious} onChange={e => updateParam(p.id, 'usePrevious', e.target.checked)}
                            className="rounded border-theme bg-base text-orange-500 focus:ring-orange-500" />
                          <span className="text-[10px] text-3 whitespace-nowrap">Use previous</span>
                        </label>
                      </div>
                      {p.description && <p className="text-[10px] text-3">{p.description}</p>}
                      {!p.usePrevious && (
                        p.allowedValues.length > 0 ? (
                          <select value={p.value} onChange={e => updateParam(p.id, 'value', e.target.value)}
                            className="input-base text-xs py-1.5 w-full">
                            {p.allowedValues.map(av => <option key={av} value={av}>{av}</option>)}
                          </select>
                        ) : (
                          <input type={p.noEcho ? 'password' : 'text'} value={p.value}
                            onChange={e => updateParam(p.id, 'value', e.target.value)}
                            placeholder={p.defaultValue ? `Default: ${p.defaultValue}` : `Enter value for ${p.key}`}
                            className="input-base text-xs py-1.5 w-full" />
                        )
                      )}
                      {p.usePrevious && (
                        <p className="text-[10px] text-3 italic">Keeping previous value: <span className="font-mono not-italic text-2">{p.value || '(not set)'}</span></p>
                      )}
                      {p.allowedValues.length > 0 && !p.usePrevious && (
                        <p className="text-[10px] text-3">Allowed: {p.allowedValues.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Configure ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-2">IAM Capabilities</label>
                <div className="space-y-2">
                  {CAPABILITIES.map(c => (
                    <label key={c} className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg hover:bg-raised transition-colors">
                      <input type="checkbox" checked={capabilities.includes(c) || detectedCaps.includes(c)}
                        onChange={() => toggleCap(c)} className="mt-0.5 rounded border-theme bg-base text-orange-500 focus:ring-orange-500" />
                      <div>
                        <p className="text-xs font-semibold text-1">{c}</p>
                        <p className="text-[10px] text-3">
                          {c === 'CAPABILITY_IAM' && 'Required when template creates IAM resources.'}
                          {c === 'CAPABILITY_NAMED_IAM' && 'Required when template creates named IAM resources.'}
                          {c === 'CAPABILITY_AUTO_EXPAND' && 'Required for templates with macros or transforms.'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {detectedCaps.length > 0 && <p className="text-[10px] text-orange-500 mt-2">⚠ Template requires: {detectedCaps.join(', ')}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-4 uppercase tracking-wider">Tags</label>
                  <button onClick={addTag} className="flex items-center gap-1 text-[10px] uppercase font-bold text-orange-500 hover:text-orange-400 border border-transparent hover:border-orange-500/30 px-2 py-1 rounded transition-all">
                    <Plus size={12} /> Add tag
                  </button>
                </div>
                {tags.map(t => (
                  <div key={t.id} className="flex items-center gap-2 mb-2">
                    <input type="text" placeholder="Key" value={t.key} onChange={e => updateTag(t.id, 'key', e.target.value)} className="input-base text-xs py-1.5 flex-1" />
                    <input type="text" placeholder="Value" value={t.value} onChange={e => updateTag(t.id, 'value', e.target.value)} className="input-base text-xs py-1.5 flex-1" />
                    <button onClick={() => removeTag(t.id)} className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-3">Review your changes before updating the stack.</p>
              <ReviewSection title="Stack"><ReviewRow label="Name" value={stackName} /></ReviewSection>
              <ReviewSection title="Template">
                <ReviewRow label="Source" value={fileName || 'Edited current template'} />
                <ReviewRow label="Size" value={`${templateBody.length} chars`} />
                {validDesc && <ReviewRow label="Description" value={validDesc} />}
              </ReviewSection>
              {params.length > 0 && (
                <ReviewSection title="Parameters">
                  {params.map(p => (
                    <ReviewRow key={p.id} label={p.key}
                      value={p.usePrevious ? '(use previous value)' : (p.value || `(default: ${p.defaultValue || 'empty'})`)} />
                  ))}
                </ReviewSection>
              )}
              {capabilities.length > 0 && (
                <ReviewSection title="Capabilities">
                  {capabilities.map(c => <ReviewRow key={c} label="" value={c} />)}
                </ReviewSection>
              )}
              {tags.length > 0 && (
                <ReviewSection title="Tags">
                  {tags.map(t => <ReviewRow key={t.id} label={t.key} value={t.value} />)}
                </ReviewSection>
              )}
              {submitError && (
                <div className="flex items-start gap-2 text-xs text-red-500 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" /><span>{submitError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-theme shrink-0">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="btn-secondary text-xs py-1.5 px-4 flex items-center gap-1.5">
            <ChevronLeft size={13} />{step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={step === 0 ? handleNextFromTemplate : () => setStep(s => s + 1)}
              disabled={!canGoNext() || validating || fetching}
              className="btn-primary text-xs py-1.5 px-4 gap-1.5 text-white flex items-center"
              style={canGoNext() && !validating ? { backgroundColor: 'rgb(249 115 22)' } : {}}>
              {validating ? <Loader2 size={12} className="animate-spin" /> : null}
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <button onClick={handleUpdate} disabled={loading}
              className="btn-primary text-xs py-1.5 px-5 gap-1.5 text-white flex items-center"
              style={{ backgroundColor: 'rgb(249 115 22)' }}>
              {loading && <Loader2 size={12} className="animate-spin" />} Update Stack
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-theme overflow-hidden">
      <div className="px-4 py-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised))' }}>
        <p className="text-[10px] font-bold text-4 uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-theme">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 px-4 py-2">
      {label && <span className="text-xs text-3 w-32 shrink-0">{label}</span>}
      <span className="text-xs text-1 font-mono break-all">{value}</span>
    </div>
  )
}
