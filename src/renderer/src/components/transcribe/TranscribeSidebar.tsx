import { useState } from 'react'
import { Search, Plus, Mic, Loader2 } from 'lucide-react'
import type { TranscribeJob } from '../../types'

interface Props {
  jobs: TranscribeJob[]
  selectedJob: TranscribeJob | null
  onSelectJob: (job: TranscribeJob) => void
  onCreateJob: () => void
  loading?: boolean
}

function statusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'COMPLETED': return 'emerald'
    case 'IN_PROGRESS': return 'blue'
    case 'QUEUED': return 'amber'
    case 'FAILED': return 'red'
    default: return 'zinc'
  }
}

export default function TranscribeSidebar({ jobs, selectedJob, onSelectJob, onCreateJob, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = jobs.filter(j =>
    j.jobName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Transcription Jobs {!loading && jobs.length > 0 && `(${jobs.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="sidebar-search pl-7"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-4 mb-2" />
            ) : jobs.length === 0 ? (
              <>
                <Mic size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No jobs found</p>
                <p className="text-[10px] text-4 mt-1">Start a transcription job to get started</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map(job => {
            const isSelected = selectedJob?.jobName === job.jobName
            const color = statusColor(job.jobStatus)
            return (
              <button
                key={job.jobName}
                onClick={() => onSelectJob(job)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2
                  ${isSelected ? 'bg-blue-500/10 border-l-blue-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <Mic size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${isSelected ? 'text-1' : 'text-2'}`}>
                    {job.jobName}
                  </p>
                  <div className="flex items-center gap-1.5 justify-between">
                    <p className={`text-[9px] text-4 truncate`}>
                      {job.languageCode || '—'}
                    </p>
                    <p className={`text-[8px] font-bold uppercase tracking-widest text-${color}-500`}>
                      {job.jobStatus}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onCreateJob}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          Start Transcription Job
        </button>
      </div>
    </div>
  )
}
