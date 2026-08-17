import { useCallback, useEffect, useState } from 'react'
import { Workflow, AlertTriangle, Loader2 } from 'lucide-react'
import type { AppSettings, EbBus, IpcResult } from '../../types'
import BusDetail from './BusDetail'
import { ServiceShell, ResourceRail, Inspector, EmptyState, Modal, type RailItem } from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function EbLayout({ settings }: Props) {
  const [buses, setBuses] = useState<EbBus[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadBuses = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.ebListBuses()
      if (result.success && result.data) {
        const list: EbBus[] = result.data
        setBuses(list)
        setSelectedName(prev => {
          if (prev && list.some(b => b.name === prev)) return prev
          // Nothing selected yet — open on `default`, which always exists.
          return list.find(b => b.name === 'default')?.name ?? list[0]?.name ?? null
        })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBuses()
  }, [loadBuses])

  const selected = buses.find(b => b.name === selectedName) ?? null

  const railItems: RailItem[] = buses.map(b => ({
    id: b.name,
    name: b.name,
    icon: Workflow,
    state: 'ok',
    sub: b.name === 'default' ? 'MANAGED' : 'CUSTOM',
    keywords: b.arn,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="EVENT BUSES"
            items={railItems}
            selectedId={selectedName}
            onSelect={item => setSelectedName(item.id)}
            icon={Workflow}
            searchPlaceholder="Search buses..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="Create Bus"
            loading={loading}
            emptyLabel="No event buses"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="event bus"
              icon={Workflow}
              iconColor="#d946ef"
              title={selected.name}
              subtitle={selected.name === 'default' ? 'Managed default bus' : 'Custom event bus'}
              sectionTitle="BUS"
              rows={[
                {
                  key: 'Type',
                  value: selected.name === 'default' ? 'Managed' : 'Custom',
                  color: 'rgb(var(--accent))',
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
                { key: 'ARN', value: selected.arn, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selected ? (
          <BusDetail
            key={selected.arn}
            bus={selected}
            onRefresh={loadBuses}
            onDeleted={() => {
              setSelectedName(null)
              loadBuses()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Workflow}
              title="Select an event bus"
              hint="Pick a bus from the rail to manage its rules and send test events."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Event Bus
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateBusModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async name => {
            const res = await window.electronAPI.ebCreateBus(name)
            if (res.success) {
              setShowCreateModal(false)
              await loadBuses()
              setSelectedName(name)
            }
            return res
          }}
        />
      )}
    </>
  )
}

function CreateBusModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (name: string) => Promise<IpcResult<string>>
}) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const nameError =
    name && !/^[a-zA-Z0-9_.-]+$/.test(name)
      ? 'Only letters, numbers, hyphens, dots and underscores.'
      : ''
  const canSubmit = name.trim().length > 0 && !nameError

  const submit = async () => {
    setSubmitting(true)
    setError('')
    const res = await onCreated(name.trim())
    setSubmitting(false)
    if (!res.success) setError(res.error ?? 'Failed to create event bus')
  }

  return (
    <Modal
      title="Create Event Bus"
      onClose={onClose}
      width={420}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={!canSubmit || submitting} className="btn-primary">
            {submitting && <Loader2 size={13} className="animate-spin" />}
            Create Bus
          </button>
        </>
      }
    >
      <div className="p-4">
        <div className="ui-label mb-2">BUS NAME</div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canSubmit && submit()}
          placeholder="my-custom-event-bus"
          className="input-base"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
        />
        <p className="text-[11px] mt-1.5" style={{ color: nameError ? 'rgb(var(--danger))' : 'rgb(var(--text-4))' }}>
          {nameError || 'Alphanumeric characters, hyphens, dots and underscores only.'}
        </p>

        {error && (
          <div
            className="mt-3 flex items-center gap-2 rounded-[7px] px-2.5 py-2 text-[11.5px]"
            style={{
              backgroundColor: 'rgb(var(--danger) / 0.10)',
              border: '1px solid rgb(var(--danger) / 0.35)',
              color: 'rgb(var(--danger))',
            }}
          >
            <AlertTriangle size={13} className="shrink-0" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
