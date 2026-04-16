import React, { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import {
  Copy, Check, AlertTriangle, Loader2, Play, RefreshCw,
  Fingerprint, Shield, User, Key, Globe, Hash
} from 'lucide-react'
import type { AppSettings, StsCallerIdentity, StsCredentials, StsAssumedRoleResult, StsFederatedUserResult } from '../../types'
import StsSidebar from './StsSidebar'
import type { StsOperation } from './StsSidebar'

// ── Shared helpers ────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={handleCopy} title="Copy" className="shrink-0 p-1 rounded transition-colors text-4 hover:text-1 hover:bg-raised">
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  )
}

function InfoRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  const display = value || '—'
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-theme last:border-0">
      <span className="text-xs font-semibold text-3 shrink-0 w-36">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className={`text-xs truncate ${!value ? 'text-4' : 'text-1'} ${mono ? 'font-mono' : ''}`}>{display}</span>
        {value && <CopyButton value={value} />}
      </div>
    </div>
  )
}

function CredentialsCard({ credentials }: { credentials: StsCredentials }) {
  return (
    <div className="mt-5 rounded-xl border border-theme overflow-hidden bg-base">
      <div className="px-4 py-3 border-b border-theme bg-raised/50 flex items-center gap-2">
        <Key size={13} className="text-yellow-500" />
        <span className="text-xs font-bold text-2 uppercase tracking-wider">Temporary Credentials</span>
      </div>
      <div className="px-4">
        <InfoRow label="Access Key ID"     value={credentials.accessKeyId}    mono />
        <InfoRow label="Secret Access Key" value={credentials.secretAccessKey} mono />
        <InfoRow label="Session Token"     value={credentials.sessionToken}   mono />
        <InfoRow label="Expiration"        value={credentials.expiration ? new Date(credentials.expiration).toLocaleString() : undefined} />
      </div>
    </div>
  )
}

function ErrorCard({ error }: { error: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-500 mt-4">
      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
      <span className="break-all">{error}</span>
    </div>
  )
}

// ── Identity Panel ────────────────────────────────────────────────────────────

function IdentityPanel() {
  const [identity, setIdentity] = useState<StsCallerIdentity | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.stsGetCallerIdentity()
      if (res.success && res.data) setIdentity(res.data)
      else setError(res.error || 'Failed to get caller identity')
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-500/10">
            <Fingerprint size={16} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-1">Caller Identity</h2>
            <p className="text-xs text-3 mt-0.5">Returns details about the IAM user or role whose credentials are used to call LocalStack.</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold btn-ghost rounded-lg disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="max-w-2xl">
          <div className="rounded-xl border border-theme overflow-hidden bg-base">
            <div className="px-4 py-3 border-b border-theme bg-raised/50 flex items-center gap-2">
              <User size={13} className="text-yellow-500" />
              <span className="text-xs font-bold text-2 uppercase tracking-wider">Identity Details</span>
            </div>
            <div className="px-4">
              <InfoRow label="Account ID" value={identity?.account} mono />
              <InfoRow label="User ID"    value={identity?.userId}  mono />
              <InfoRow label="ARN"        value={identity?.arn}     mono />
            </div>
          </div>
          {error && <ErrorCard error={error} />}
        </div>
      </div>
    </div>
  )
}

// ── Assume Role Panel ─────────────────────────────────────────────────────────

function AssumeRolePanel() {
  const [roleArn, setRoleArn] = useState('')
  const [sessionName, setSessionName] = useState('stackview-session')
  const [duration, setDuration] = useState('3600')
  const [policy, setPolicy] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StsAssumedRoleResult | null>(null)
  const [error, setError] = useState('')

  const run = async () => {
    if (!roleArn.trim() || !sessionName.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await window.electronAPI.stsAssumeRole(roleArn.trim(), sessionName.trim(), duration ? parseInt(duration) : undefined, policy.trim() || undefined)
      if (res.success && res.data) setResult(res.data)
      else setError(res.error || 'Failed to assume role')
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-500/10">
            <Shield size={16} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-1">Assume Role</h2>
            <p className="text-xs text-3 mt-0.5">Returns temporary credentials for an IAM role. Useful for cross-account access and delegation.</p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading || !roleArn.trim() || !sessionName.trim()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          Assume Role
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Role ARN <span className="text-red-400">*</span></label>
            <input value={roleArn} onChange={e => setRoleArn(e.target.value)} placeholder="arn:aws:iam::000000000000:role/MyRole" className="input-base w-full text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Session Name <span className="text-red-400">*</span></label>
            <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="my-session" className="input-base w-full text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Duration (seconds)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="900" max="43200" placeholder="3600" className="input-base w-40 text-sm" />
            <p className="text-[10px] text-4 mt-1">Range: 900–43200</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Inline Policy <span className="text-4 font-normal">(optional)</span></label>
            <textarea value={policy} onChange={e => setPolicy(e.target.value)} placeholder={'{\n  "Version": "2012-10-17",\n  "Statement": [...]\n}'} className="input-base w-full text-xs font-mono h-28 resize-y" />
          </div>

          {error && <ErrorCard error={error} />}

          {result && (
            <>
              <div className="rounded-xl border border-theme overflow-hidden bg-base">
                <div className="px-4 py-3 border-b border-theme bg-raised/50 flex items-center gap-2">
                  <Shield size={13} className="text-yellow-500" />
                  <span className="text-xs font-bold text-2 uppercase tracking-wider">Assumed Role User</span>
                </div>
                <div className="px-4">
                  <InfoRow label="Assumed Role ARN" value={result.assumedRoleArn} mono />
                  <InfoRow label="Assumed Role ID"  value={result.assumedRoleId}  mono />
                  <InfoRow label="Session Name"     value={result.sessionName} />
                </div>
              </div>
              <CredentialsCard credentials={result.credentials} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Session Token Panel ───────────────────────────────────────────────────────

function SessionTokenPanel() {
  const [duration, setDuration] = useState('3600')
  const [serialNumber, setSerialNumber] = useState('')
  const [tokenCode, setTokenCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StsCredentials | null>(null)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await window.electronAPI.stsGetSessionToken(duration ? parseInt(duration) : undefined, serialNumber.trim() || undefined, tokenCode.trim() || undefined)
      if (res.success && res.data) setResult(res.data)
      else setError(res.error || 'Failed to get session token')
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-500/10">
            <Key size={16} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-1">Session Token</h2>
            <p className="text-xs text-3 mt-0.5">Returns temporary credentials for an IAM user. Optionally requires MFA authentication.</p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          Get Token
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Duration (seconds)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="900" max="129600" placeholder="3600" className="input-base w-40 text-sm" />
            <p className="text-[10px] text-4 mt-1">Range: 900–129600</p>
          </div>

          <div className="rounded-xl border border-theme p-4 space-y-4 bg-raised/30">
            <p className="text-xs font-semibold text-3">MFA (optional)</p>
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">Serial Number</label>
              <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="arn:aws:iam::000000000000:mfa/user" className="input-base w-full text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-2 mb-1.5">Token Code</label>
              <input value={tokenCode} onChange={e => setTokenCode(e.target.value)} placeholder="123456" className="input-base w-40 text-sm font-mono" maxLength={6} />
            </div>
          </div>

          {error && <ErrorCard error={error} />}
          {result && <CredentialsCard credentials={result} />}
        </div>
      </div>
    </div>
  )
}

// ── Federation Token Panel ────────────────────────────────────────────────────

function FederationTokenPanel() {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('3600')
  const [policy, setPolicy] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StsFederatedUserResult | null>(null)
  const [error, setError] = useState('')

  const run = async () => {
    if (!name.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await window.electronAPI.stsGetFederationToken(name.trim(), duration ? parseInt(duration) : undefined, policy.trim() || undefined)
      if (res.success && res.data) setResult(res.data)
      else setError(res.error || 'Failed to get federation token')
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-500/10">
            <User size={16} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-1">Federation Token</h2>
            <p className="text-xs text-3 mt-0.5">Returns temporary credentials for a federated user. Used for custom identity experiences.</p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading || !name.trim()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          Get Token
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Federated User Name <span className="text-red-400">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. my-federated-user" className="input-base w-full text-sm" />
            <p className="text-[10px] text-4 mt-1">2–32 characters, alphanumeric + =,.@-</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Duration (seconds)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="900" max="129600" placeholder="3600" className="input-base w-40 text-sm" />
            <p className="text-[10px] text-4 mt-1">Range: 900–129600</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Inline Policy <span className="text-4 font-normal">(optional)</span></label>
            <textarea value={policy} onChange={e => setPolicy(e.target.value)} placeholder={'{\n  "Version": "2012-10-17",\n  "Statement": [...]\n}'} className="input-base w-full text-xs font-mono h-28 resize-y" />
          </div>

          {error && <ErrorCard error={error} />}

          {result && (
            <>
              <div className="rounded-xl border border-theme overflow-hidden bg-base">
                <div className="px-4 py-3 border-b border-theme bg-raised/50 flex items-center gap-2">
                  <User size={13} className="text-yellow-500" />
                  <span className="text-xs font-bold text-2 uppercase tracking-wider">Federated User</span>
                </div>
                <div className="px-4">
                  <InfoRow label="Federated User ID" value={result.federatedUserId} mono />
                  <InfoRow label="ARN"               value={result.arn}             mono />
                </div>
              </div>
              <CredentialsCard credentials={result.credentials} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Web Identity Panel ────────────────────────────────────────────────────────

function WebIdentityPanel() {
  const [roleArn, setRoleArn] = useState('')
  const [sessionName, setSessionName] = useState('stackview-web-session')
  const [webIdentityToken, setWebIdentityToken] = useState('')
  const [duration, setDuration] = useState('3600')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StsAssumedRoleResult | null>(null)
  const [error, setError] = useState('')

  const run = async () => {
    if (!roleArn.trim() || !sessionName.trim() || !webIdentityToken.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await window.electronAPI.stsAssumeRoleWithWebIdentity(roleArn.trim(), sessionName.trim(), webIdentityToken.trim(), duration ? parseInt(duration) : undefined)
      if (res.success && res.data) setResult(res.data)
      else setError(res.error || 'Failed to assume role with web identity')
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-theme bg-base flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-500/10">
            <Globe size={16} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-1">Web Identity</h2>
            <p className="text-xs text-3 mt-0.5">Returns credentials for a role assumed via a web identity token (OIDC/JWT).</p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading || !roleArn.trim() || !sessionName.trim() || !webIdentityToken.trim()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          Assume Role
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Role ARN <span className="text-red-400">*</span></label>
            <input value={roleArn} onChange={e => setRoleArn(e.target.value)} placeholder="arn:aws:iam::000000000000:role/MyWebIdentityRole" className="input-base w-full text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Session Name <span className="text-red-400">*</span></label>
            <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="my-web-session" className="input-base w-full text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Web Identity Token <span className="text-red-400">*</span></label>
            <textarea value={webIdentityToken} onChange={e => setWebIdentityToken(e.target.value)} placeholder="Paste your OIDC/JWT token here..." className="input-base w-full text-xs font-mono h-28 resize-y" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-2 mb-1.5">Duration (seconds)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="900" max="43200" placeholder="3600" className="input-base w-40 text-sm" />
            <p className="text-[10px] text-4 mt-1">Range: 900–43200</p>
          </div>

          {error && <ErrorCard error={error} />}

          {result && (
            <>
              <div className="rounded-xl border border-theme overflow-hidden bg-base">
                <div className="px-4 py-3 border-b border-theme bg-raised/50 flex items-center gap-2">
                  <Hash size={13} className="text-yellow-500" />
                  <span className="text-xs font-bold text-2 uppercase tracking-wider">Assumed Role User</span>
                </div>
                <div className="px-4">
                  <InfoRow label="Assumed Role ARN" value={result.assumedRoleArn} mono />
                  <InfoRow label="Assumed Role ID"  value={result.assumedRoleId}  mono />
                  <InfoRow label="Session Name"     value={result.sessionName} />
                </div>
              </div>
              <CredentialsCard credentials={result.credentials} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

interface Props {
  settings: AppSettings
}

export default function StsLayout({ settings: _settings }: Props) {
  const [activeOp, setActiveOp] = useState<StsOperation>('identity')
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 200, max: 360 })

  return (
    <div className="flex flex-col h-full bg-app text-1">
      <div className="flex flex-1 overflow-hidden relative">
        <div style={{ width: sidebarWidth }} className="flex shrink-0 z-10 transition-[width]">
          <StsSidebar active={activeOp} onSelect={setActiveOp} />
        </div>

        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none z-20 transition-colors"
          style={{ backgroundColor: 'rgb(var(--border))' }}
        />

        <main className="flex-1 overflow-hidden">
          {activeOp === 'identity'         && <IdentityPanel />}
          {activeOp === 'assume-role'      && <AssumeRolePanel />}
          {activeOp === 'session-token'    && <SessionTokenPanel />}
          {activeOp === 'federation-token' && <FederationTokenPanel />}
          {activeOp === 'web-identity'     && <WebIdentityPanel />}
        </main>
      </div>
    </div>
  )
}
