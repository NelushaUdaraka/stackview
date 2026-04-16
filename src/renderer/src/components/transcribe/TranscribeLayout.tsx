import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import { AlertTriangle, X, Plus, Loader2, Mic } from 'lucide-react'
import type { AppSettings, TranscribeJob } from '../../types'
import TranscribeSidebar from './TranscribeSidebar'
import TranscribeJobDetail from './TranscribeJobDetail'

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
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadJobs = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.transcribeListJobs()
    if (res.success && res.data) {
      setJobs(res.data)
      if (selectedJob) {
        const refreshed = res.data.find(j => j.jobName === selectedJob.jobName)
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

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <TranscribeSidebar
            jobs={jobs}
            selectedJob={selectedJob}
            onSelectJob={setSelectedJob}
            onCreateJob={() => setShowCreate(true)}
            loading={loading}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-app">
          {selectedJob ? (
            <TranscribeJobDetail
              key={selectedJob.jobName}
              job={selectedJob}
              onRefresh={handleRefreshJob}
              onDeleted={() => { setSelectedJob(null); loadJobs() }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Mic size={40} className="text-blue-500 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No job selected</p>
                <p className="text-xs text-3">{loading ? 'Loading transcription jobs...' : jobs.length === 0 ? 'Start a transcription job to get started' : 'Select a job from the sidebar'}</p>
              </div>
              {!loading && jobs.length === 0 && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                >
                  <Plus size={14} /> Start Transcription Job
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateJobModal
          onClose={() => setShowCreate(false)}
          onCreated={handleJobCreated}
        />
      )}
    </div>
  )
}
