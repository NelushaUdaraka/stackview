import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import { AlertTriangle, X, Plus, Loader2, ShieldCheck, Upload } from 'lucide-react'
import type { AppSettings, AcmCertificate } from '../../types'
import AcmSidebar from './AcmSidebar'
import AcmCertificateDetail from './AcmCertificateDetail'

// ── Request Certificate Modal ──────────────────────────────────────────────────

function RequestCertificateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToastContext()
  const [domainName, setDomainName] = useState('')
  const [sansRaw, setSansRaw] = useState('')
  const [validationMethod, setValidationMethod] = useState<'DNS' | 'EMAIL'>('DNS')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!domainName.trim()) { setError('Domain name is required'); return }
    setError('')
    setSubmitting(true)

    const sans = sansRaw
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => s !== domainName.trim())

    const res = await window.electronAPI.acmRequestCertificate({
      domainName: domainName.trim(),
      subjectAlternativeNames: sans.length > 0 ? sans : undefined,
      validationMethod,
    })
    setSubmitting(false)
    if (res.success) {
      showToast('success', `Certificate requested successfully`)
      onCreated()
    } else {
      setError(res.error || 'Failed to request certificate')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-teal-500/15">
              <ShieldCheck size={16} className="text-teal-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Request Certificate</h2>
              <p className="text-[10px] text-3">AWS Certificate Manager (ACM)</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Domain Name <span className="text-red-500">*</span></label>
            <input
              value={domainName}
              onChange={e => setDomainName(e.target.value)}
              placeholder="e.g. example.com or *.example.com"
              className="input-base w-full text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Additional Names (SANs)</label>
            <textarea
              value={sansRaw}
              onChange={e => setSansRaw(e.target.value)}
              placeholder="One domain per line&#10;e.g. www.example.com&#10;api.example.com"
              className="input-base w-full text-sm resize-none h-20 font-mono"
            />
            <p className="text-[10px] text-4 mt-1">One domain per line. Wildcards allowed (*.example.com)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Validation Method</label>
            <div className="flex gap-2">
              {(['DNS', 'EMAIL'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setValidationMethod(m)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors
                    ${validationMethod === m
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-500'
                      : 'bg-raised border-theme text-3 hover:text-2'}`}
                >
                  {m}
                </button>
              ))}
            </div>
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
            disabled={!domainName.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Request
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Import Certificate Modal ───────────────────────────────────────────────────

function ImportCertificateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToastContext()
  const [certificate, setCertificate] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [certificateChain, setCertificateChain] = useState('')
  const [existingArn, setExistingArn] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!certificate.trim()) { setError('Certificate PEM is required'); return }
    if (!privateKey.trim()) { setError('Private key PEM is required'); return }
    setError('')
    setSubmitting(true)
    const res = await window.electronAPI.acmImportCertificate({
      certificate: certificate.trim(),
      privateKey: privateKey.trim(),
      certificateChain: certificateChain.trim() || undefined,
      existingArn: existingArn.trim() || undefined,
    })
    setSubmitting(false)
    if (res.success) {
      showToast('success', 'Certificate imported successfully')
      onCreated()
    } else {
      setError(res.error || 'Failed to import certificate')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl border border-theme shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-teal-500/15">
              <Upload size={16} className="text-teal-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Import Certificate</h2>
              <p className="text-[10px] text-3">Bring Your Own Certificate (BYOC)</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Certificate Body (PEM) <span className="text-red-500">*</span></label>
            <textarea
              value={certificate}
              onChange={e => setCertificate(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              className="input-base w-full text-xs font-mono resize-none h-28"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Private Key (PEM) <span className="text-red-500">*</span></label>
            <textarea
              value={privateKey}
              onChange={e => setPrivateKey(e.target.value)}
              placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
              className="input-base w-full text-xs font-mono resize-none h-28"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Certificate Chain (PEM) <span className="text-3 font-normal">Optional</span></label>
            <textarea
              value={certificateChain}
              onChange={e => setCertificateChain(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              className="input-base w-full text-xs font-mono resize-none h-20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Existing Certificate ARN <span className="text-3 font-normal">Optional — to reimport</span></label>
            <input
              value={existingArn}
              onChange={e => setExistingArn(e.target.value)}
              placeholder="arn:aws:acm:..."
              className="input-base w-full text-sm font-mono"
            />
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
            disabled={!certificate.trim() || !privateKey.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Upload size={14} /> Import
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Layout ─────────────────────────────────────────────────────────────────────

interface Props {
  settings: AppSettings
}

export default function AcmLayout({ settings: _settings }: Props) {
  const [certificates, setCertificates] = useState<AcmCertificate[]>([])
  const [selectedCert, setSelectedCert] = useState<AcmCertificate | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })
  const { showToast } = useToastContext()

  const loadCertificates = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.acmListCertificates()
    if (res.success && res.data) {
      setCertificates(res.data)
      if (selectedCert) {
        const refreshed = res.data.find(c => c.CertificateArn === selectedCert.CertificateArn)
        setSelectedCert(refreshed || null)
      } else if (res.data.length > 0) {
        setSelectedCert(res.data[0])
      }
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load certificates')
    }
    setLoading(false)
  }, [selectedCert, showToast])

  useEffect(() => { loadCertificates() }, [])

  const handleCreated = () => {
    setShowRequest(false)
    setShowImport(false)
    loadCertificates()
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10">
          <AcmSidebar
            certificates={certificates}
            selectedCert={selectedCert}
            onSelectCert={setSelectedCert}
            onRequest={() => setShowRequest(true)}
            onImport={() => setShowImport(true)}
            loading={loading}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-app">
          {selectedCert ? (
            <AcmCertificateDetail
              cert={selectedCert}
              onRefresh={loadCertificates}
              onDeleted={() => { setSelectedCert(null); loadCertificates() }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                <ShieldCheck size={40} className="text-teal-500 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-2 mb-1">No certificate selected</p>
                <p className="text-xs text-3">{loading ? 'Loading certificates...' : certificates.length === 0 ? 'Request or import a certificate to get started' : 'Select a certificate from the sidebar'}</p>
              </div>
              {!loading && certificates.length === 0 && (
                <button onClick={() => setShowRequest(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors">
                  <Plus size={14} /> Request Certificate
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showRequest && (
        <RequestCertificateModal onClose={() => setShowRequest(false)} onCreated={handleCreated} />
      )}
      {showImport && (
        <ImportCertificateModal onClose={() => setShowImport(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
