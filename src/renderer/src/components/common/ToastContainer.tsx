import { CheckCircle, AlertTriangle, X } from 'lucide-react'
import type { Toast } from '../../hooks/useToast'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="relative pointer-events-auto flex items-stretch w-80 bg-overlay border border-theme rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-300"
        >
          {/* Left accent bar */}
          <div className={`w-1 shrink-0 ${t.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />

          {/* Content */}
          <div className="flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0">
            {t.type === 'success'
              ? <CheckCircle size={15} className="shrink-0 text-emerald-500" />
              : <AlertTriangle size={15} className="shrink-0 text-red-500" />
            }
            <span className="flex-1 text-sm font-medium text-1 leading-snug">{t.text}</span>
            <button
              onClick={() => onDismiss(t.id)}
              className="shrink-0 text-4 hover:text-2 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-1 right-0 h-0.5 overflow-hidden">
            <div
              className={`h-full ${t.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} opacity-50`}
              style={{
                animation: `toast-progress ${t.duration}ms linear forwards`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
