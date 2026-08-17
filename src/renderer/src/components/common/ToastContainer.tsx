import { CheckCircle, AlertTriangle, X } from 'lucide-react'
import type { Toast } from '../../hooks/useToast'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const color = t.type === 'success' ? 'rgb(var(--ok))' : 'rgb(var(--danger))'
        const Icon = t.type === 'success' ? CheckCircle : AlertTriangle
        return (
          <div
            key={t.id}
            className="relative pointer-events-auto flex items-stretch w-80 overflow-hidden card"
            style={{
              backgroundColor: 'rgb(var(--bg-raised))',
              boxShadow: '0 18px 44px rgba(0,0,0,.45)',
              animation: 'stackview-fade-in 0.18s ease-out',
            }}
          >
            <div className="w-1 shrink-0" style={{ backgroundColor: color }} />

            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-3 min-w-0">
              <Icon size={15} className="shrink-0" style={{ color }} />
              <span className="flex-1 text-[12.5px] font-medium text-1 leading-snug">{t.text}</span>
              <button
                onClick={() => onDismiss(t.id)}
                className="shrink-0 text-4 hover:text-2 transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>

            <div className="absolute bottom-0 left-1 right-0 h-0.5 overflow-hidden">
              <div
                className="h-full opacity-50"
                style={{ backgroundColor: color, animation: `toast-progress ${t.duration}ms linear forwards` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
