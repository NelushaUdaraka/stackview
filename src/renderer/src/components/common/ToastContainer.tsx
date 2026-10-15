import { Check, AlertTriangle, X } from 'lucide-react'
import type { Toast } from '../../hooks/useToast'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  // The live region stays mounted so screen readers announce toasts as they arrive.
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => {
        const success = t.type === 'success'
        return (
          <div
            key={t.id}
            role={success ? 'status' : 'alert'}
            className="popover relative pointer-events-auto flex items-start gap-3 w-80 pl-3.5 pr-2 py-3 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300"
          >
            <span
              className={`mt-px w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                success ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
              }`}
              aria-hidden
            >
              {success ? <Check size={12} strokeWidth={3} /> : <AlertTriangle size={11} strokeWidth={2.5} />}
            </span>
            <p className="flex-1 min-w-0 text-[13px] font-medium text-1 leading-snug break-words pt-px">{t.text}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className="icon-btn w-6 h-6 -mt-0.5"
              aria-label="Dismiss notification"
            >
              <X size={13} />
            </button>

            {/* Time remaining */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5" aria-hidden>
              <div
                className={`h-full ${success ? 'bg-emerald-500' : 'bg-red-500'} opacity-60`}
                style={{ animation: `toast-progress ${t.duration}ms linear forwards` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
