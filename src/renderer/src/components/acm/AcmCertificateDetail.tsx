import { useState } from 'react'
import {
  ShieldCheck, ShieldAlert, Copy, Check, Trash2, RefreshCw, Loader2,
  Tag, FileText, Globe, Clock, AlertTriangle
} from 'lucide-react'
import type { AcmCertificate } from '../../types'

interface Props {
  cert: AcmCertificate
  onRefresh: () => void
  onDeleted: () => void
  showToast: (type: 'success' | 'error', text: string) => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors shrink-0"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

function InfoRow({ label, value, mono = false, copyable = false }: { label: string; value?: string | null; mono?: boolean; copyable?: boolean }) {
  const display = value || '—'
  const isDash = !value
  return (
    <div>
      <p className="text-[10px] text-4 font-bold uppercase tracking-widest mb-1.5">{label}</p>
      <div className={`flex items-center justify-between gap-2 text-sm ${isDash ? 'text-4' : 'text-1'} ${mono ? 'font-mono text-xs' : 'font-semibold'}`}>
        <span className="truncate">{display}</span>
        {copyable && value && <CopyButton text={value} />}
      </div>
    </div>
  )
}

function statusBadgeClass(status?: string): string {
  switch (status) {
    case 'ISSUED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    case 'PENDING_VALIDATION': return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    case 'FAILED': return 'bg-red-500/10 text-red-600 border-red-500/20'
    case 'EXPIRED': return 'bg-red-500/10 text-red-600 border-red-500/20'
    case 'REVOKED': return 'bg-red-500/10 text-red-600 border-red-500/20'
    default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  }
}

export default function AcmCertificateDetail({ cert, onRefresh, onDeleted, showToast }: Props) {
  const [actioning, setActioning] = useState(false)
  const [showPem, setShowPem] = useState(false)
  const [pemData, setPemData] = useState<{ certificate: string; certificateChain?: string } | null>(null)
  const [pemLoading, setPemLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setConfirmDelete(false)
    setActioning(true)
    const res = await window.electronAPI.acmDeleteCertificate(cert.CertificateArn)
    setActioning(false)
    if (res.success) {
      showToast('success', `Certificate deleted`)
      onDeleted()
    } else {
      showToast('error', res.error || 'Failed to delete certificate')
    }
  }

  const handleRenew = async () => {
    setActioning(true)
    const res = await window.electronAPI.acmRenewCertificate(cert.CertificateArn)
    setActioning(false)
    if (res.success) {
      showToast('success', 'Certificate renewal initiated')
      onRefresh()
    } else {
      showToast('error', res.error || 'Failed to renew certificate')
    }
  }

  const handleViewPem = async () => {
    if (showPem) { setShowPem(false); return }
    setPemLoading(true)
    const res = await window.electronAPI.acmGetCertificatePem(cert.CertificateArn)
    setPemLoading(false)
    if (res.success && res.data) {
      setPemData(res.data)
      setShowPem(true)
    } else {
      showToast('error', res.error || 'Failed to get certificate PEM')
    }
  }

  const isIssued = cert.Status === 'ISSUED'
  const isPendingValidation = cert.Status === 'PENDING_VALIDATION'
  const arnShort = cert.CertificateArn.split('/').pop() || cert.CertificateArn

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-theme bg-base shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-3 rounded-2xl border ${isIssued ? 'bg-teal-500/10 border-teal-500/20 text-teal-500' : isPendingValidation ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {isIssued ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg font-bold text-1 truncate">{cert.DomainName}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${statusBadgeClass(cert.Status)}`}>
                  {cert.Status || '—'}
                </span>
                {cert.Type && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-teal-500/10 text-teal-600 border border-teal-500/20">
                    {cert.Type}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-3 font-mono">
                <span className="truncate">{arnShort}</span>
                <CopyButton text={cert.CertificateArn} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <button
              onClick={handleViewPem}
              disabled={pemLoading}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-colors bg-raised hover:bg-overlay text-2 border border-theme"
            >
              {pemLoading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              {showPem ? 'Hide PEM' : 'View PEM'}
            </button>
            {cert.RenewalEligibility === 'ELIGIBLE' && (
              <button
                onClick={handleRenew}
                disabled={actioning}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-colors bg-teal-600 hover:bg-teal-500 text-white"
              >
                {actioning ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Renew
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={actioning}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-colors border
                ${confirmDelete
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-600'
                  : 'bg-raised hover:bg-red-500/10 text-red-500 border-theme hover:border-red-500/30'}`}
            >
              {actioning ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* PEM Panel */}
        {showPem && pemData && (
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-teal-500 uppercase tracking-widest">Certificate PEM</p>
              <CopyButton text={pemData.certificate} />
            </div>
            <pre className="text-[10px] font-mono text-2 whitespace-pre-wrap break-all bg-base rounded-lg p-3 border border-theme max-h-48 overflow-auto">
              {pemData.certificate}
            </pre>
            {pemData.certificateChain && (
              <>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs font-bold text-teal-500 uppercase tracking-widest">Certificate Chain</p>
                  <CopyButton text={pemData.certificateChain} />
                </div>
                <pre className="text-[10px] font-mono text-2 whitespace-pre-wrap break-all bg-base rounded-lg p-3 border border-theme max-h-48 overflow-auto">
                  {pemData.certificateChain}
                </pre>
              </>
            )}
          </div>
        )}

        {/* Pending validation notice */}
        {isPendingValidation && cert.DomainValidationOptions && cert.DomainValidationOptions.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Pending Validation</p>
            </div>
            {cert.DomainValidationOptions.map((v, i) => (
              <div key={i} className="bg-base rounded-lg border border-theme p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-1">{v.DomainName}</p>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${v.ValidationStatus === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {v.ValidationStatus || '—'}
                  </span>
                </div>
                {v.ResourceRecord && (
                  <div className="space-y-1 text-xs text-3">
                    <div className="flex items-center gap-2">
                      <span className="text-4 w-8 shrink-0">Name</span>
                      <span className="font-mono truncate flex-1 text-2">{v.ResourceRecord.Name}</span>
                      <CopyButton text={v.ResourceRecord.Name} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-4 w-8 shrink-0">Type</span>
                      <span className="font-mono text-2">{v.ResourceRecord.Type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-4 w-8 shrink-0">Value</span>
                      <span className="font-mono truncate flex-1 text-2">{v.ResourceRecord.Value}</span>
                      <CopyButton text={v.ResourceRecord.Value} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Main info grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={13} className="text-teal-500" /> Certificate Details
            </h4>
            <div className="bg-base rounded-xl border border-theme p-5 space-y-4">
              <InfoRow label="Certificate ARN" value={cert.CertificateArn} mono copyable />
              <InfoRow label="Domain Name" value={cert.DomainName} />
              <InfoRow label="Status" value={cert.Status} />
              <InfoRow label="Type" value={cert.Type} />
              <InfoRow label="Key Algorithm" value={cert.KeyAlgorithm} />
              <InfoRow label="Signature Algorithm" value={cert.SignatureAlgorithm} />
              <InfoRow label="Renewal Eligibility" value={cert.RenewalEligibility} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
              <Clock size={13} className="text-teal-500" /> Validity & Dates
            </h4>
            <div className="bg-base rounded-xl border border-theme p-5 space-y-4">
              <InfoRow label="Created At" value={cert.CreatedAt ? new Date(cert.CreatedAt).toLocaleString() : null} />
              <InfoRow label="Issued At" value={cert.IssuedAt ? new Date(cert.IssuedAt).toLocaleString() : null} />
              <InfoRow label="Not Before" value={cert.NotBefore ? new Date(cert.NotBefore).toLocaleString() : null} />
              <InfoRow label="Not After" value={cert.NotAfter ? new Date(cert.NotAfter).toLocaleString() : null} />
              <InfoRow label="Serial" value={cert.Serial} mono />
              <InfoRow label="Subject" value={cert.Subject} mono />
              <InfoRow label="Issuer" value={cert.Issuer} mono />
            </div>
          </div>
        </div>

        {/* SANs */}
        {cert.SubjectAlternativeNames && cert.SubjectAlternativeNames.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
              <Globe size={13} className="text-teal-500" /> Subject Alternative Names ({cert.SubjectAlternativeNames.length})
            </h4>
            <div className="bg-base rounded-xl border border-theme p-4 flex flex-wrap gap-2">
              {cert.SubjectAlternativeNames.map(san => (
                <span key={san} className="px-2 py-1 text-xs font-mono bg-raised border border-theme rounded-lg text-2 flex items-center gap-1.5">
                  {san} <CopyButton text={san} />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* In-use by */}
        {cert.InUseBy && cert.InUseBy.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
              <Globe size={13} className="text-teal-500" /> In Use By
            </h4>
            <div className="bg-base rounded-xl border border-theme p-4 space-y-2">
              {cert.InUseBy.map(arn => (
                <div key={arn} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-2 truncate flex-1">{arn}</span>
                  <CopyButton text={arn} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {cert.Tags && cert.Tags.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-3 uppercase tracking-widest flex items-center gap-2">
              <Tag size={13} className="text-teal-500" /> Tags
            </h4>
            <div className="bg-base rounded-xl border border-theme p-4 flex flex-wrap gap-2">
              {cert.Tags.map(t => (
                <span key={t.Key} className="px-2 py-1 text-xs bg-raised border border-theme rounded-lg text-2">
                  <span className="font-semibold text-1">{t.Key}</span>
                  {t.Value ? <span className="text-3"> = {t.Value}</span> : null}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
