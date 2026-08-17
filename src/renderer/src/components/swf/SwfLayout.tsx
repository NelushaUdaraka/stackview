import { useState, useCallback, useEffect } from 'react'
import { GitBranch, Plus } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, SwfDomain } from '../../types'
import DomainDetail from './DomainDetail'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, statusColor, stateOf, type RailItem,
} from '../common/ui'
import RegisterDomainModal from './RegisterDomainModal'

interface Props {
  settings: AppSettings
}

export default function SwfLayout({ settings }: Props) {
  const [domains, setDomains] = useState<SwfDomain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<SwfDomain | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const { showToast } = useToastContext()

  const loadDomains = useCallback(async () => {
    setLoading(true)
    const [regRes, depRes] = await Promise.all([
      window.electronAPI.swfListDomains('REGISTERED'),
      window.electronAPI.swfListDomains('DEPRECATED'),
    ])
    const all: SwfDomain[] = [
      ...(regRes.success && regRes.data ? regRes.data : []),
      ...(depRes.success && depRes.data ? depRes.data : []),
    ]
    setDomains(all)
    if (!regRes.success && !depRes.success) {
      showToast('error', regRes.error || 'Failed to load domains')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => { loadDomains() }, [])

  const handleDomainDeprecated = useCallback(() => {
    loadDomains()
    setSelectedDomain((prev) =>
      prev ? { ...prev, status: 'DEPRECATED' } : null
    )
  }, [loadDomains])

  const railItems: RailItem[] = domains.map(d => ({
    id: d.name,
    name: d.name,
    icon: GitBranch,
    state: d.status === 'REGISTERED' ? 'ok' : 'idle',
    sub: d.status,
    meta: d.workflowExecutionRetentionPeriodInDays
      ? `${d.workflowExecutionRetentionPeriodInDays}d`
      : undefined,
    keywords: d.description,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="DOMAINS"
            items={railItems}
            selectedId={selectedDomain?.name ?? null}
            onSelect={item => setSelectedDomain(domains.find(d => d.name === item.id) ?? null)}
            icon={GitBranch}
            searchPlaceholder="Search domains..."
            onCreate={() => setShowRegister(true)}
            createLabel="Register Domain"
            loading={loading}
            emptyLabel="No domains yet"
          />
        }
        inspector={
          selectedDomain ? (
            <Inspector
              kind="domain"
              icon={GitBranch}
              iconColor="#22c55e"
              title={selectedDomain.name}
              subtitle={selectedDomain.description || 'Workflow domain'}
              rows={[
                { key: 'Status', value: selectedDomain.status, color: statusColor(selectedDomain.status) },
                {
                  key: 'Retention',
                  value: selectedDomain.workflowExecutionRetentionPeriodInDays
                    ? `${selectedDomain.workflowExecutionRetentionPeriodInDays} days`
                    : '\u2014',
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
                ...(selectedDomain.arn
                  ? [{ key: 'ARN', value: selectedDomain.arn, color: 'rgb(var(--text-2))' }]
                  : []),
              ]}
            />
          ) : undefined
        }
      >
        {selectedDomain ? (
          <DomainDetail
            key={selectedDomain.name}
            domain={selectedDomain}
            showToast={showToast}
            onDeprecated={handleDomainDeprecated}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={GitBranch}
              title={loading ? 'Loading domains\u2026' : 'Select a domain'}
              hint={
                domains.length === 0 && !loading
                  ? 'Register a domain to get started.'
                  : 'Pick a domain from the rail to manage workflow and activity types.'
              }
              action={
                domains.length === 0 && !loading ? (
                  <button onClick={() => setShowRegister(true)} className="btn-primary">
                    Register Domain
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </ServiceShell>

      {showRegister && (
        <RegisterDomainModal
          onClose={() => setShowRegister(false)}
          showToast={showToast}
          onCreated={() => {
            setShowRegister(false)
            loadDomains()
          }}
        />
      )}
    </>
  )
}
