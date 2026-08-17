import { useState, useCallback, useEffect } from 'react'
import { useToastContext } from '../../contexts/ToastContext'
import { AlertTriangle, X, Plus, Loader2, Mic } from 'lucide-react'
import type { AppSettings, TranscribeJob } from '../../types'
import TranscribeJobDetail from './TranscribeJobDetail'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, statusColor, stateOf, type RailItem,
} from '../common/ui'

const LANGUAGE_CODES = [
  'en-US', 'en-GB', 'en-AU', 'en-IN', 'es-US', 'es-ES', 'fr-FR', 'fr-CA',
  'de-DE', 'it-IT', 'pt-BR', 'pt-PT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW',
  'ar-AE', 'ar-SA', 'hi-IN', 'th-TH', 'tr-TR', 'ru-RU', 'nl-NL', 'id-ID',
]

const MEDIA_FORMATS = ['mp3', 'mp4', 'wav', 'flac', 'ogg', 'amr', 'webm', 'm4a']

// ── Create Job Modal ──────────────────────────────────────────────────────────

function CreateJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToastContext()
  const [jobName, setJobName] = useState('')
  const [languageCode, setLanguageCode] = useState('en-US')
  const [mediaUri, setMediaUri] = useState('')
  const [mediaFormat, setMediaFormat] = useState('')
  const [outputBucket, setOutputBucket] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!jobName.trim()) { setError('Job name is required'); return }
    if (!mediaUri.trim()) { setError('Media URI is required'); return }
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.transcribeStartJob({
      jobName: jobName.trim(),
      languageCode,
      mediaUri: mediaUri.trim(),
      mediaFormat: mediaFormat || undefined,
      outputBucketName: outputBucket.trim() || undefined,
    })
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Transcription job "${jobName.trim()}" started`)
      onCreated()
    } else {
      setError(res.error || 'Failed to start transcription job')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/15">
              <Mic size={16} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Start Transcription Job</h2>
              <p className="text-[10px] text-3">Speech-to-text via LocalStack</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Job Name <span className="text-red-500">*</span></label>
            <input
              value={jobName}
              onChange={e => setJobName(e.target.value)}
              placeholder="e.g. my-transcription-job"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Media File URI <span className="text-red-500">*</span></label>
            <input
              value={mediaUri}
              onChange={e => setMediaUri(e.target.value)}
              placeholder="s3://my-bucket/audio/file.mp3"
              className="input-base w-full text-sm font-mono"
            />
            <p className="text-[10px] text-4 mt-1">S3 URI pointing to your audio/video file</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">Language Code</label>
              <select
                value={languageCode}
                onChange={e => setLanguageCode(e.target.value)}
                className="input-base w-full text-sm"
              >
                {LANGUAGE_CODES.map(lc => (
                  <option key={lc} value={lc}>{lc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">Media Format <span className="text-4 font-normal">(optional)</span></label>
              <select
                value={mediaFormat}
                onChange={e => setMediaFormat(e.target.value)}
                className="input-base w-full text-sm"
              >
                <option value="">Auto-detect</option>
                {MEDIA_FORMATS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Output S3 Bucket <span className="text-4 font-normal">(optional)</span></label>
            <input
              value={outputBucket}
              onChange={e => setOutputBucket(e.target.value)}
              placeholder="my-output-bucket"
              className="input-base w-full text-sm"
            />
            <p className="text-[10px] text-4 mt-1">Bucket name (not full URI) to store transcript result</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme bg-raised/30">
          <button onClick={onClose} className="btn-ghost text-sm font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !jobName.trim() || !mediaUri.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Start Job
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

interface Props {
  settings: AppSettings
}

export default function TranscribeLayout({ settings }: Props) {
  const [jobs, setJobs] = useState<TranscribeJob[]>([])
  const [selectedJob, setSelectedJob] = useState<TranscribeJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const { showToast } = useToastContext()

  const loadJobs = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.transcribeListJobs()
    if (res.success && res.data) {
      setJobs(res.data)
      if (selectedJob) {
        const refreshed = res.data.find((j: TranscribeJob) => j.jobName === selectedJob.jobName)
        setSelectedJob(refreshed || null)
      } else if (res.data.length > 0) {
        setSelectedJob(res.data[0])
      }
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load transcription jobs')
    }
    setLoading(false)
  }, [selectedJob, showToast])

  useEffect(() => { loadJobs() }, [])

  const handleJobCreated = () => {
    setShowCreate(false)
    loadJobs()
  }

  const handleRefreshJob = async () => {
    if (!selectedJob) return
    const res = await window.electronAPI.transcribeGetJob(selectedJob.jobName)
    if (res.success && res.data) {
      setSelectedJob(res.data)
      setJobs(prev => prev.map(j => j.jobName === res.data!.jobName ? res.data! : j))
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to refresh job')
    }
  }

  const railItems: RailItem[] = jobs.map(j => ({
    id: j.jobName,
    name: j.jobName,
    icon: Mic,
    state: stateOf(j.jobStatus) ?? 'warn',
    sub: j.jobStatus?.toUpperCase(),
    meta: j.languageCode,
    keywords: j.mediaUri,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="TRANSCRIPTION JOBS"
            items={railItems}
            selectedId={selectedJob?.jobName ?? null}
            onSelect={item => setSelectedJob(jobs.find(j => j.jobName === item.id) ?? null)}
            icon={Mic}
            searchPlaceholder="Search jobs..."
            onCreate={() => setShowCreate(true)}
            createLabel="Start Job"
            loading={loading}
            emptyLabel="No transcription jobs"
          />
        }
        inspector={
          selectedJob ? (
            <Inspector
              kind="job"
              icon={Mic}
              iconColor="#3b82f6"
              title={selectedJob.jobName}
              subtitle={selectedJob.languageCode || 'Transcription job'}
              rows={[
                { key: 'Status', value: selectedJob.jobStatus, color: statusColor(selectedJob.jobStatus) },
                { key: 'Language', value: selectedJob.languageCode ?? '—', color: 'rgb(var(--text-2))' },
                { key: 'Format', value: selectedJob.mediaFormat ?? '—', color: 'rgb(var(--text-2))' },
                {
                  key: 'Created',
                  value: selectedJob.creationTime
                    ? new Date(selectedJob.creationTime).toLocaleString()
                    : '—',
                  color: 'rgb(var(--text-2))',
                },
                ...(selectedJob.failureReason
                  ? [{ key: 'Failure', value: selectedJob.failureReason, color: 'rgb(var(--danger))' }]
                  : []),
              ]}
            />
          ) : undefined
        }
      >
        {selectedJob ? (
          <TranscribeJobDetail
            key={selectedJob.jobName}
            job={selectedJob}
            onRefresh={handleRefreshJob}
            onDeleted={() => {
              setSelectedJob(null)
              loadJobs()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Mic}
              title={loading ? 'Loading jobs…' : 'Select a job'}
              hint={
                jobs.length === 0 && !loading
                  ? 'Start a transcription job to get started.'
                  : 'Pick a job from the rail to read its transcript.'
              }
              action={
                jobs.length === 0 && !loading ? (
                  <button onClick={() => setShowCreate(true)} className="btn-primary">
                    <Plus size={12} />
                    Start Transcription Job
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onCreated={handleJobCreated} />}
    </>
  )
}
