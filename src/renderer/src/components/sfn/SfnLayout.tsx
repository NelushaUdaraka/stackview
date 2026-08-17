import { useState, useCallback, useEffect } from 'react'
import { Share2, Plus } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, SfnStateMachine } from '../../types'
import StateMachineDetail from './StateMachineDetail'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, statusColor, stateOf, type RailItem,
} from '../common/ui'
import CreateStateMachineModal from './CreateStateMachineModal'

interface Props {
  settings: AppSettings
}

export default function SfnLayout({ settings }: Props) {
  const [stateMachines, setStateMachines] = useState<SfnStateMachine[]>([])
  const [selectedMachine, setSelectedMachine] = useState<SfnStateMachine | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const { showToast } = useToastContext()

  const loadStateMachines = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.sfnListStateMachines()
    if (res.success && res.data) {
      setStateMachines(res.data)
    } else if (!res.success) {
      showToast('error', res.error || 'Failed to load state machines')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => { loadStateMachines() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMachineDeleted = () => {
    setSelectedMachine(null)
    loadStateMachines()
  }

  const railItems: RailItem[] = stateMachines.map(m => ({
    id: m.stateMachineArn,
    name: m.name,
    icon: Share2,
    state: stateOf(m.status) ?? 'ok',
    sub: m.type,
    meta: m.creationDate ? new Date(m.creationDate).toLocaleDateString() : undefined,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="STATE MACHINES"
            items={railItems}
            selectedId={selectedMachine?.stateMachineArn ?? null}
            onSelect={item =>
              setSelectedMachine(stateMachines.find(m => m.stateMachineArn === item.id) ?? null)
            }
            icon={Share2}
            searchPlaceholder="Search state machines..."
            onCreate={() => setShowCreate(true)}
            createLabel="Create State Machine"
            loading={loading}
            emptyLabel="No state machines"
          />
        }
        inspector={
          selectedMachine ? (
            <Inspector
              kind="state machine"
              icon={Share2}
              iconColor="#84cc16"
              title={selectedMachine.name}
              subtitle={`${selectedMachine.type} workflow`}
              rows={[
                { key: 'Type', value: selectedMachine.type, color: 'rgb(var(--accent))' },
                {
                  key: 'Status',
                  value: selectedMachine.status ?? 'ACTIVE',
                  color: statusColor(selectedMachine.status ?? 'ACTIVE'),
                },
                {
                  key: 'Created',
                  value: selectedMachine.creationDate
                    ? new Date(selectedMachine.creationDate).toLocaleDateString()
                    : '\u2014',
                  color: 'rgb(var(--text-2))',
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
                { key: 'ARN', value: selectedMachine.stateMachineArn, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selectedMachine ? (
          <StateMachineDetail
            key={selectedMachine.stateMachineArn}
            machine={selectedMachine}
            onDeleted={handleMachineDeleted}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Share2}
              title={loading ? 'Loading state machines\u2026' : 'Select a state machine'}
              hint={
                stateMachines.length === 0 && !loading
                  ? 'Create a state machine to get started.'
                  : 'Pick a state machine from the rail to start and inspect executions.'
              }
              action={
                stateMachines.length === 0 && !loading ? (
                  <button onClick={() => setShowCreate(true)} className="btn-primary">
                    Create State Machine
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreate && (
        <CreateStateMachineModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadStateMachines()
          }}
        />
      )}
    </>
  )
}
