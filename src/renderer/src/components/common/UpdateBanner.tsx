import { useEffect, useState } from 'react'
import { CheckCircle2, Download, X } from 'lucide-react'
import type { UpdaterStatus } from '../../types'

interface Props {
  status: UpdaterStatus
  onInstall: () => void
}

export default function UpdateBanner({ status, onInstall }: Props) {
  // Session-only dismiss, keyed by version so a new version re-arms the card.
  const [dismissedVersion, setDismissedVersion] = useState<string | undefined>(undefined)

  // Re-arm when a different version becomes ready.
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
      className="fixed bottom-6 right-6 z-50 w-80 rounded-xl shadow-2xl border border-emerald-500/30 overflow-hidden animate-in slide-in-from-right-4 duration-300"
      style={{ backgroundColor: 'rgb(var(--bg-base))' }}
    >
      <div className="flex items-stretch">
        {/* Left accent bar */}
        <div className="w-1 shrink-0 bg-emerald-500" />

        <div className="flex-1 px-4 py-3.5 min-w-0">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-1 leading-snug">
                Update ready to install
              </p>
              <p className="text-xs text-3 mt-0.5 truncate">
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
            <button
              onClick={onInstall}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
            >
              <Download size={13} />
              Install &amp; Restart
            </button>
            <button
              onClick={() => setDismissedVersion(status.version ?? 'unknown')}
              className="px-3 py-2 text-xs font-medium text-3 hover:text-1 hover:bg-raised rounded-lg transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
