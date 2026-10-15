import { useEffect, useState } from 'react'
import { Download, X, Sparkles } from 'lucide-react'
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
      role="status"
      className="popover fixed bottom-5 right-5 z-50 w-80 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300"
    >
      <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-500" aria-hidden />
      <div className="px-4 pt-3.5 pb-3.5">
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0" aria-hidden>
            <Sparkles size={15} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-1 leading-snug">
              Update ready to install
            </p>
            <p className="text-xs text-3 mt-0.5">
              {status.version
                ? `StackView v${status.version} has been downloaded.`
                : 'A new version has been downloaded.'}
            </p>
          </div>
          <button
            onClick={() => setDismissedVersion(status.version ?? 'unknown')}
            className="icon-btn w-6 h-6 -mt-1 -mr-1.5"
            aria-label="Dismiss"
            title="Dismiss for this session"
          >
            <X size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3.5 pl-11">
          <button
            onClick={onInstall}
            className="flex-1 flex items-center justify-center gap-2 h-8 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
          >
            <Download size={13} />
            Restart &amp; install
          </button>
          <button
            onClick={() => setDismissedVersion(status.version ?? 'unknown')}
            className="h-8 px-3 text-xs font-medium text-2 hover:text-1 hover:bg-raised rounded-lg transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
