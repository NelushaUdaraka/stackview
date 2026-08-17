import { useCallback, useEffect, useRef, useState } from 'react'
import { LayoutTemplate, ArrowUpRight, Filter } from 'lucide-react'
import type { AppSettings } from '../../types'
import StackDetail from './StackDetail'
import CreateStackModal from './CreateStackModal'
import CloudFormationExportsView from './CloudFormationExportsView'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, SubviewTabs, statusColor, stateOf,
  type RailItem, type Subview,
} from '../common/ui'

type MainView = 'stacks' | 'exports'

const VIEWS: Subview<MainView>[] = [
  { id: 'stacks', label: 'Stacks', icon: LayoutTemplate },
  { id: 'exports', label: 'Exports', icon: ArrowUpRight },
]

/** Statuses worth filtering to — the rest are transient or rare. */
const FILTERS = [
  'CREATE_COMPLETE',
  'UPDATE_COMPLETE',
  'ROLLBACK_COMPLETE',
  'CREATE_FAILED',
  'DELETE_FAILED',
]

interface Props {
  settings: AppSettings
}

interface Stack {
  StackName: string
  StackStatus?: string
  CreationTime?: string
  Description?: string
  [key: string]: unknown
}

export default function CloudFormationLayout({ settings }: Props) {
  const [mainView, setMainView] = useState<MainView>('stacks')
  const [stacks, setStacks] = useState<Stack[]>([])
  const [selectedStack, setSelectedStack] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)

  // The poll below reads the filter without re-subscribing when it changes.
  const statusFilterRef = useRef<string[]>([])
  useEffect(() => {
    statusFilterRef.current = statusFilter
  }, [statusFilter])

  const loadStacks = useCallback(async (filter?: string[]) => {
    setLoading(true)
    try {
      const result = await window.electronAPI.cfnListStacks(filter ?? statusFilterRef.current)
      if (result.success && result.data) setStacks(result.data as Stack[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStacks()
  }, [loadStacks])

  // Poll while anything is mid-deploy so the rail reflects progress.
  useEffect(() => {
    const hasInProgress = stacks.some(s => s.StackStatus?.includes('IN_PROGRESS'))
    if (!hasInProgress) return
    const timer = setInterval(async () => {
      const result = await window.electronAPI.cfnListStacks(statusFilterRef.current)
      if (result.success && result.data) setStacks(result.data as Stack[])
    }, 5000)
    return () => clearInterval(timer)
  }, [stacks])

  const selected = stacks.find(s => s.StackName === selectedStack) ?? null

  const railItems: RailItem[] = stacks.map(s => ({
    id: s.StackName,
    name: s.StackName,
    icon: LayoutTemplate,
    state: stateOf(s.StackStatus) ?? 'idle',
    sub: s.StackStatus ?? 'UNKNOWN',
    meta: s.CreationTime ? new Date(s.CreationTime).toLocaleDateString() : undefined,
    keywords: s.Description,
  }))

  if (mainView === 'exports') {
    return (
      <div className="flex-1 min-h-0 flex flex-col bg-app">
        <div className="shrink-0 px-5 pt-3 border-b border-theme">
          <SubviewTabs views={VIEWS} active={mainView} onChange={setMainView} />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CloudFormationExportsView />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="shrink-0 px-5 pt-3 border-b border-theme bg-app">
        <SubviewTabs views={VIEWS} active={mainView} onChange={setMainView} />
      </div>

      <ServiceShell
        rail={
          <ResourceRail
            title="STACKS"
            items={railItems}
            selectedId={selectedStack}
            onSelect={item => setSelectedStack(item.id)}
            icon={LayoutTemplate}
            searchPlaceholder="Search stacks..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="Create Stack"
            loading={loading}
            emptyLabel="No stacks yet"
            headerAction={
              <button
                onClick={() => setFilterOpen(o => !o)}
                className="transition-colors"
                style={{ color: statusFilter.length ? 'rgb(var(--accent))' : 'rgb(var(--text-3))' }}
                title="Filter by status"
              >
                <Filter size={13} />
              </button>
            }
          >
            {filterOpen && (
              <div className="shrink-0 px-3 py-2.5 border-b border-theme surface-wash">
                <div className="ui-label-dim mb-2">STATUS</div>
                <div className="flex flex-wrap gap-1">
                  {FILTERS.map(f => {
                    const on = statusFilter.includes(f)
                    return (
                      <button
                        key={f}
                        onClick={() => {
                          const next = on ? statusFilter.filter(s => s !== f) : [...statusFilter, f]
                          setStatusFilter(next)
                          loadStacks(next)
                        }}
                        className={`chip h-[22px] text-[10px] ${on ? 'chip-active' : ''}`}
                      >
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </ResourceRail>
        }
        inspector={
          selected ? (
            <Inspector
              kind="stack"
              icon={LayoutTemplate}
              iconColor="#f97316"
              title={selected.StackName}
              subtitle={selected.Description || 'CloudFormation stack'}
              rows={[
                {
                  key: 'Status',
                  value: selected.StackStatus ?? '—',
                  color: statusColor(selected.StackStatus),
                },
                {
                  key: 'Created',
                  value: selected.CreationTime ? new Date(selected.CreationTime).toLocaleDateString() : '—',
                  color: 'rgb(var(--text-2))',
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selectedStack ? (
          <StackDetail
            key={selectedStack}
            stackName={selectedStack}
            onDeleted={async () => {
              setSelectedStack(null)
              await loadStacks()
            }}
            onUpdated={loadStacks}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={LayoutTemplate}
              title="Select a stack"
              hint="Pick a stack from the rail to review its resources, events and template."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Stack
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateStackModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async () => {
            setShowCreateModal(false)
            await loadStacks()
          }}
        />
      )}
    </>
  )
}
