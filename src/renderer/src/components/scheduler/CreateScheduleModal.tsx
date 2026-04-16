import { useState } from 'react'
import { X, Plus, Clock, Loader2, AlertTriangle, CalendarClock, Target } from 'lucide-react'
import type { EbScheduleGroup } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  groups: EbScheduleGroup[]
  defaultGroup: EbScheduleGroup | null
  onClose: () => void
  onCreated: () => void
}

type ScheduleType = 'rate' | 'cron' | 'at'

export default function CreateScheduleModal({ groups, defaultGroup, onClose, onCreated }: Props) {
  const { showToast } = useToastContext()
  // Step 1: Basic
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [groupName, setGroupName] = useState(defaultGroup?.name || 'default')
  const [state, setState] = useState<'ENABLED' | 'DISABLED'>('ENABLED')

  // Step 2: Expression
  const [scheduleType, setScheduleType] = useState<ScheduleType>('rate')
  const [rateValue, setRateValue] = useState('5')
  const [rateUnit, setRateUnit] = useState<'minutes' | 'hours' | 'days'>('minutes')
  const [cronExpression, setCronExpression] = useState('0 12 * * ? *')
  const [atDateTime, setAtDateTime] = useState('')
  const [timezone, setTimezone] = useState('UTC')

  // Step 3: Target
  const [targetArn, setTargetArn] = useState('')
  const [targetRoleArn, setTargetRoleArn] = useState('')
  const [targetInput, setTargetInput] = useState('{}')

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const getScheduleExpression = (): string => {
    if (scheduleType === 'rate') return `rate(${rateValue} ${rateUnit})`
    if (scheduleType === 'cron') return `cron(${cronExpression})`
    if (scheduleType === 'at') return `at(${atDateTime})`
    return ''
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      if (targetInput.trim()) JSON.parse(targetInput)
    } catch {
      setError('Target input must be valid JSON')
      setSubmitting(false)
      return
    }

    const res = await window.electronAPI.schedulerCreateSchedule({
      name: name.trim(),
      groupName: groupName || 'default',
      scheduleExpression: getScheduleExpression(),
      scheduleExpressionTimezone: timezone || 'UTC',
      description: description.trim() || undefined,
      state,
      targetArn: targetArn.trim(),
      targetRoleArn: targetRoleArn.trim(),
      targetInput: targetInput.trim() !== '{}' ? targetInput.trim() : undefined
    })

    setSubmitting(false)
    if (res.success) {
      showToast('success', `Schedule "${name}" created`)
      onCreated()
    } else {
      setError(res.error || 'Failed to create schedule')
    }
  }

  const canGoToStep2 = name.trim().length > 0
  const canGoToStep3 = scheduleType === 'rate'
    ? (parseInt(rateValue) > 0)
    : scheduleType === 'at'
      ? atDateTime.trim().length > 0
      : cronExpression.trim().length > 0
  const canSubmit = targetArn.trim().length > 0 && targetRoleArn.trim().length > 0

  const STEPS = ['Basic Info', 'Schedule', 'Target']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-xl rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/15">
              <CalendarClock size={16} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Schedule</h2>
              <p className="text-[10px] text-3">EventBridge Scheduler</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 px-5 py-3 border-b border-theme bg-raised/20">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-lg transition-all
                ${step === i + 1 ? 'text-amber-500' : step > i + 1 ? 'text-emerald-500' : 'text-4'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border
                  ${step === i + 1 ? 'bg-amber-500/10 border-amber-500 text-amber-500' : step > i + 1 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'border-theme text-4'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                {s}
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-theme mx-1" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 min-h-[260px]">
          {/* Step 1: Basic */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Schedule Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="my-daily-job" className="input-base w-full text-sm" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-2 mb-1.5">Group</label>
                  <select value={groupName} onChange={e => setGroupName(e.target.value)} className="input-base w-full text-sm">
                    {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-2 mb-1.5">Initial State</label>
                  <select value={state} onChange={e => setState(e.target.value as 'ENABLED' | 'DISABLED')} className="input-base w-full text-sm">
                    <option value="ENABLED">Enabled</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." className="input-base w-full text-sm" />
              </div>
            </div>
          )}

          {/* Step 2: Schedule Expression */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-2 mb-2">Schedule Type</label>
                <div className="flex gap-2">
                  {(['rate', 'cron', 'at'] as ScheduleType[]).map(t => (
                    <button key={t} onClick={() => setScheduleType(t)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all capitalize
                        ${scheduleType === t ? 'bg-amber-500/10 border-amber-500 text-amber-600' : 'border-theme text-3 hover:border-amber-500/40 hover:text-2'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {scheduleType === 'rate' && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-2 mb-1.5">Value</label>
                      <input type="number" min="1" value={rateValue} onChange={e => setRateValue(e.target.value)} className="input-base w-full text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-2 mb-1.5">Unit</label>
                      <select value={rateUnit} onChange={e => setRateUnit(e.target.value as any)} className="input-base w-full text-sm">
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-raised border border-theme">
                    <p className="text-[10px] text-4 uppercase tracking-wider mb-0.5">Preview</p>
                    <p className="text-xs font-mono text-amber-500 font-bold">{getScheduleExpression()}</p>
                  </div>
                </div>
              )}

              {scheduleType === 'cron' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-2 mb-1.5">Cron Expression (AWS format)</label>
                    <input value={cronExpression} onChange={e => setCronExpression(e.target.value)} placeholder="0 12 * * ? *" className="input-base w-full text-sm font-mono" />
                    <p className="text-[10px] text-4 mt-1 ml-1">Format: min hour day month weekday year (e.g., <span className="font-mono">0 12 * * ? *</span> = daily at noon UTC)</p>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-raised border border-theme">
                    <p className="text-[10px] text-4 uppercase tracking-wider mb-0.5">Preview</p>
                    <p className="text-xs font-mono text-amber-500 font-bold">{getScheduleExpression()}</p>
                  </div>
                </div>
              )}

              {scheduleType === 'at' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-2 mb-1.5">Date & Time (ISO 8601)</label>
                    <input type="datetime-local" value={atDateTime} onChange={e => setAtDateTime(e.target.value.replace('T', 'T'))} className="input-base w-full text-sm" />
                  </div>
                  {atDateTime && (
                    <div className="px-3 py-2 rounded-lg bg-raised border border-theme">
                      <p className="text-[10px] text-4 uppercase tracking-wider mb-0.5">Preview</p>
                      <p className="text-xs font-mono text-amber-500 font-bold">at({new Date(atDateTime).toISOString().replace('.000Z', '')})</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Timezone</label>
                <input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="UTC" className="input-base w-full text-sm" />
              </div>
            </div>
          )}

          {/* Step 3: Target */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Target ARN *</label>
                <input value={targetArn} onChange={e => setTargetArn(e.target.value)} placeholder="arn:aws:lambda:us-east-1:000000000000:function:my-fn" className="input-base w-full text-sm font-mono" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Execution Role ARN *</label>
                <input value={targetRoleArn} onChange={e => setTargetRoleArn(e.target.value)} placeholder="arn:aws:iam::000000000000:role/SchedulerRole" className="input-base w-full text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Input Payload (JSON)</label>
                <textarea value={targetInput} onChange={e => setTargetInput(e.target.value)} rows={4}
                  className="input-base w-full text-xs font-mono resize-none leading-relaxed" placeholder='{"key": "value"}' spellCheck={false} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-theme bg-raised/30">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-ghost text-sm font-semibold px-3 py-1.5">
                ← Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 ? !canGoToStep2 : !canGoToStep3}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors disabled:opacity-40"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors disabled:opacity-40"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Create Schedule
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
