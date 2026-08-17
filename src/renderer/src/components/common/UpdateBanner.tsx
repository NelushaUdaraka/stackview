import { useEffect, useState } from 'react'
import { CheckCircle2, Download, X } from 'lucide-react'
import type { UpdaterStatus } from '../../types'

interface Props {
  status: UpdaterStatus
  onInstall: () => void
}

/** Corner card announcing a downloaded update, dismissible for the session. */
export default function UpdateBanner({ status, onInstall }: Props) {
  // Session-only dismiss, keyed by version so a new version re-arms the card.
  const [dismissedVersion, setDismissedVersion] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (status.status !== 'ready') return
    if (dismissedVersion && status.version && dismissedVersion !== status.version) {
      setDismissedVersion(undefined)
    }
  }, [status.status, status.version, dismissedVersion])

  if (status.status !== 'ready') return null
  if (dismissedVersion && dismissedVersion === status.version) return null

  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-80 overflow-hidden card"
      style={{
        borderColor: 'rgb(var(--ok) / 0.35)',
        boxShadow: '0 24px 60px rgba(0,0,0,.45)',
        animation: 'stackview-fade-in 0.2s ease-out',
      }}
    >
      <div className="flex items-stretch">
        <div className="w-1 shrink-0" style={{ backgroundColor: 'rgb(var(--ok))' }} />

        <div className="flex-1 px-3.5 py-3 min-w-0">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: 'rgb(var(--ok))' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-1 leading-snug">Update ready to install</p>
              <p className="text-[11.5px] text-3 mt-0.5 truncate">
                {status.version
                  ? `StackView v${status.version} is downloaded and ready.`
                  : 'A new version is downloaded and ready.'}
              </p>
            </div>
            <button
              onClick={() => setDismissedVersion(status.version ?? 'unknown')}
              className="shrink-0 text-4 hover:text-2 transition-colors -mt-0.5"
              aria-label="Dismiss"
              title="Dismiss for this session"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button onClick={onInstall} className="btn-primary flex-1">
              <Download size={13} />
              Install &amp; Restart
            </button>
            <button onClick={() => setDismissedVersion(status.version ?? 'unknown')} className="btn-ghost">
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
