import { useState } from 'react'
import { Search, Plus, ShieldCheck, Loader2 } from 'lucide-react'
import type { AcmCertificate } from '../../types'

interface Props {
  certificates: AcmCertificate[]
  selectedCert: AcmCertificate | null
  onSelectCert: (cert: AcmCertificate) => void
  onRequest: () => void
  onImport: () => void
  loading?: boolean
}

function statusColor(status?: string): string {
  switch (status) {
    case 'ISSUED': return 'emerald'
    case 'PENDING_VALIDATION': return 'amber'
    case 'FAILED': return 'red'
    case 'EXPIRED': return 'red'
    case 'REVOKED': return 'red'
    case 'INACTIVE': return 'zinc'
    default: return 'zinc'
  }
}

export default function AcmSidebar({ certificates, selectedCert, onSelectCert, onRequest, onImport, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = certificates.filter(c => {
    const s = search.toLowerCase()
    if (c.DomainName.toLowerCase().includes(s)) return true
    if (c.CertificateArn.toLowerCase().includes(s)) return true
    if ((c.SubjectAlternativeNames || []).some(san => san.toLowerCase().includes(s))) return true
    return false
  })

  return (
    <div className="flex flex-col h-full w-full border-r border-theme" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-4 uppercase tracking-wider">
            Certificates {!loading && certificates.length > 0 && `(${certificates.length})`}
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-3" />}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search domain or ARN..."
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
            ) : certificates.length === 0 ? (
              <>
                <ShieldCheck size={22} className="text-4 mb-2 opacity-20" />
                <p className="text-xs text-3 font-medium">No certificates</p>
                <p className="text-[10px] text-4 mt-1">Request or import a certificate</p>
              </>
            ) : (
              <>
                <Search size={18} className="text-4 mb-2" />
                <p className="text-xs text-3 font-medium">No matches</p>
              </>
            )}
          </div>
        ) : (
          filtered.map(cert => {
            const isSelected = selectedCert?.CertificateArn === cert.CertificateArn
            const color = statusColor(cert.Status)
            const isImported = cert.Type === 'IMPORTED'

            return (
              <button
                key={cert.CertificateArn}
                onClick={() => onSelectCert(cert)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-theme transition-colors border-l-2 group
                  ${isSelected ? 'bg-teal-500/10 border-l-teal-500' : 'hover:bg-raised border-l-transparent'}`}
              >
                <ShieldCheck size={13} className={`mt-0.5 shrink-0 ${isSelected ? 'text-teal-500' : 'text-4'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate leading-snug mb-0.5 ${isSelected ? 'text-1' : 'text-2'}`}>
                    {cert.DomainName}
                  </p>
                  <div className="flex items-center gap-1.5 justify-between">
                    <p className={`text-[9px] font-mono tracking-wider truncate ${isSelected ? 'text-teal-600' : 'text-4'}`}>
                      {isImported ? 'IMPORTED' : cert.Type || 'ACM'}
                    </p>
                    <p className={`text-[8px] font-bold uppercase tracking-widest shrink-0 text-${color}-500`}>
                      {cert.Status || '—'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-theme shrink-0 space-y-1.5" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.4)' }}>
        <button
          onClick={onRequest}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          Request Certificate
        </button>
        <button
          onClick={onImport}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold
            bg-raised hover:bg-overlay text-2 border border-theme rounded-lg transition-colors"
        >
          <Plus size={13} />
          Import Certificate
        </button>
      </div>
    </div>
  )
}
