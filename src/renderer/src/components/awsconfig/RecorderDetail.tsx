import { useState, useCallback } from 'react'
import { Trash2, Loader2, Play, Square } from 'lucide-react'
import type { ConfigRecorder } from '../../types'

interface Props {
  recorder: ConfigRecorder
  onDeleted: () => void
  onChanged: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

function InfoRow({ label, value }: { label: string; value?: string | boolean | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-mono ${value === undefined || value === null || value === '' ? 'text-4' : 'text-2'}`}>
        {value === undefined || value === null || value === '' ? '—' : String(value)}
      </p>
    </div>
  )
}

export default function RecorderDetail({ recorder, onDeleted, onChanged, showToast }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const res = await window.electronAPI.configDeleteRecorder(recorder.name)
    if (res.success) { onDeleted() }
    else { showToast('error', res.error ?? 'Delete failed'); setConfirmDelete(false) }
    setDeleting(false)
  }, [confirmDelete, recorder.name, onDeleted, showToast])

  const handleToggle = useCallback(async () => {
    setToggling(true)
    const res = recorder.recording
      ? await window.electronAPI.configStopRecorder(recorder.name)
      : await window.electronAPI.configStartRecorder(recorder.name)
    if (res.success) { showToast('success', recorder.recording ? 'Recorder stopped' : 'Recorder started'); onChanged() }
    else { showToast('error', res.error ?? 'Action failed') }
    setToggling(false)
  }, [recorder, onChanged, showToast])

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-4">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-0.5">Configuration Recorder</p>
          <h2 className="text-sm font-semibold text-1">{recorder.name}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
              ${recorder.recording
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'}`}
          >
            {toggling ? <Loader2 size={12} className="animate-spin" /> : recorder.recording ? <Square size={12} /> : <Play size={12} />}
            {recorder.recording ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
              ${confirmDelete ? 'bg-red-600 hover:bg-red-500 text-white' : 'btn-ghost text-red-400 hover:text-red-300'}`}
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {confirmDelete ? 'Confirm' : 'Delete'}
          </button>
          {confirmDelete && !deleting && (
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost text-xs px-2 py-1.5">Cancel</button>
          )}
        </div>
      </div>

      {/* status banner */}
      <div className={`rounded-lg px-4 py-2.5 border text-xs font-semibold
        ${recorder.recording
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-raised border-theme text-4'}`}>
        {recorder.recording ? '● Recording' : '○ Not recording'}
      </div>

      {/* info grid */}
      <div className="card p-4 border-theme grid grid-cols-2 gap-4">
        <InfoRow label="Role ARN" value={recorder.roleARN} />
        <InfoRow label="All Supported" value={recorder.allSupported ? 'Yes' : 'No'} />
        <InfoRow label="Include Global Resources" value={recorder.includeGlobalResourceTypes ? 'Yes' : 'No'} />
        <InfoRow label="Last Status" value={recorder.lastStatus} />
        <InfoRow label="Last Start Time" value={recorder.lastStartTime ? new Date(recorder.lastStartTime).toLocaleString() : undefined} />
        <InfoRow label="Last Stop Time" value={recorder.lastStopTime ? new Date(recorder.lastStopTime).toLocaleString() : undefined} />
      </div>

      {/* resource types */}
      {!recorder.allSupported && recorder.resourceTypes.length > 0 && (
        <div className="card p-4 border-theme">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-2">Recorded Resource Types</p>
          <div className="flex flex-wrap gap-1.5">
            {recorder.resourceTypes.map(rt => (
              <span key={rt} className="text-[10px] font-mono bg-raised px-2 py-0.5 rounded border border-theme text-3">{rt}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
