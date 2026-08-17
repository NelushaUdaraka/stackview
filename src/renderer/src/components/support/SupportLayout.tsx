import { useState, useCallback, useEffect } from 'react'
import { LifeBuoy, Gauge } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, SupportCase } from '../../types'
import CaseDetail from './CaseDetail'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, Toggle, statusColor, stateOf,
  type RailItem,
} from '../common/ui'
import TrustedAdvisorPanel from './TrustedAdvisorPanel'
import CreateCaseModal from './CreateCaseModal'

type SidebarMode = 'cases' | 'advisor'

interface Props {
  settings: AppSettings
}

export default function SupportLayout({ settings }: Props) {
  const [cases, setCases] = useState<SupportCase[]>([])
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('cases')
  const [includeResolved, setIncludeResolved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const { showToast } = useToastContext()

  const loadCases = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.supportDescribeCases(includeResolved)
    if (res.success && res.data) {
      setCases(res.data)
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load cases')
    }
    setLoading(false)
  }, [includeResolved, showToast])

  useEffect(() => { loadCases() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (sidebarMode === 'cases') loadCases() }, [includeResolved]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeChange = (mode: SidebarMode) => {
    setSidebarMode(mode)
    if (mode !== 'cases') setSelectedCase(null)
  }

  const handleResolved = () => {
    setSelectedCase((prev) =>
      prev ? { ...prev, status: 'resolved' } : null
    )
    loadCases()
  }

  const railItems: RailItem[] = [
    { id: '__advisor__', name: 'Trusted Advisor', icon: Gauge, sub: 'CHECKS' },
    ...cases.map(c => ({
      id: c.caseId,
      name: c.subject,
      icon: LifeBuoy,
      state: stateOf(c.status) ?? 'warn',
      sub: c.status?.toUpperCase(),
      meta: c.displayId,
      keywords: `${c.serviceCode ?? ''} ${c.categoryCode ?? ''}`,
    })),
  ]

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="SUPPORT"
            items={railItems}
            selectedId={sidebarMode === 'advisor' ? '__advisor__' : (selectedCase?.caseId ?? null)}
            onSelect={item => {
              if (item.id === '__advisor__') {
                handleModeChange('advisor')
              } else {
                handleModeChange('cases')
                setSelectedCase(cases.find(c => c.caseId === item.id) ?? null)
              }
            }}
            icon={LifeBuoy}
            searchPlaceholder="Search cases..."
            onCreate={() => setShowCreate(true)}
            createLabel="Create Case"
            loading={loading}
            emptyLabel="No support cases"
          >
            <div className="shrink-0 px-1.5 py-1 border-b border-theme surface-wash">
              <Toggle
                checked={includeResolved}
                onChange={() => setIncludeResolved(v => !v)}
                label="Include resolved"
              />
            </div>
          </ResourceRail>
        }
        inspector={
          selectedCase && sidebarMode === 'cases' ? (
            <Inspector
              kind="case"
              icon={LifeBuoy}
              iconColor="#0ea5e9"
              title={selectedCase.subject}
              subtitle={selectedCase.displayId ? `Case ${selectedCase.displayId}` : 'Support case'}
              rows={[
                { key: 'Status', value: selectedCase.status ?? '—', color: statusColor(selectedCase.status) },
                { key: 'Severity', value: selectedCase.severityCode ?? '—', color: 'rgb(var(--accent))' },
                { key: 'Service', value: selectedCase.serviceCode ?? '—', color: 'rgb(var(--text-2))' },
                { key: 'Category', value: selectedCase.categoryCode ?? '—', color: 'rgb(var(--text-2))' },
                {
                  key: 'Opened',
                  value: selectedCase.timeCreated
                    ? new Date(selectedCase.timeCreated).toLocaleDateString()
                    : '—',
                  color: 'rgb(var(--text-2))',
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {sidebarMode === 'advisor' ? (
          <TrustedAdvisorPanel showToast={showToast} />
        ) : selectedCase ? (
          <CaseDetail
            key={selectedCase.caseId}
            supportCase={selectedCase}
            showToast={showToast}
            onResolved={handleResolved}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={LifeBuoy}
              title={loading ? 'Loading cases\u2026' : 'Select a case'}
              hint="Pick a case from the rail, or open Trusted Advisor for account checks."
              action={
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                  Create Case
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreate && (
        <CreateCaseModal
          showToast={showToast}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadCases()
          }}
        />
      )}
    </>
  )
}
