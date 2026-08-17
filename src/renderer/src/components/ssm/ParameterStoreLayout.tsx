import { useCallback, useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import type { AppSettings, SsmParameter } from '../../types'
import ParameterDetail from './ParameterDetail'
import CreateParameterModal from './CreateParameterModal'
import { ServiceShell, ResourceRail, Inspector, EmptyState, type RailItem } from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function ParameterStoreLayout({ settings }: Props) {
  const [parameters, setParameters] = useState<SsmParameter[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadParams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.ssmListParameters()
      if (res.success && res.data) {
        const sorted = [...res.data].sort((a, b) => a.name.localeCompare(b.name))
        setParameters(sorted)
        // Keep the selection only while the parameter still exists.
        setSelectedName(prev => (prev && sorted.some(p => p.name === prev) ? prev : null))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadParams()
  }, [loadParams])

  const selected = parameters.find(p => p.name === selectedName) ?? null

  const railItems: RailItem[] = parameters.map(p => ({
    id: p.name,
    name: p.name,
    icon: SlidersHorizontal,
    state: p.type === 'SecureString' ? 'warn' : 'ok',
    sub: p.type.toUpperCase(),
    meta: p.version != null ? `v${p.version}` : undefined,
    keywords: p.description,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="PARAMETERS"
            items={railItems}
            selectedId={selectedName}
            onSelect={item => setSelectedName(item.id)}
            icon={SlidersHorizontal}
            searchPlaceholder="Search by path..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="Create Parameter"
            loading={loading}
            emptyLabel="No parameters yet"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="parameter"
              icon={SlidersHorizontal}
              iconColor="#14b8a6"
              title={selected.name}
              subtitle={selected.description || selected.type}
              rows={[
                {
                  key: 'Type',
                  value: selected.type,
                  color: selected.type === 'SecureString' ? 'rgb(var(--accent))' : 'rgb(var(--text-1))',
                },
                { key: 'Version', value: selected.version != null ? `v${selected.version}` : '—' },
                { key: 'Tier', value: selected.tier ?? 'Standard', color: 'rgb(var(--text-2))' },
                { key: 'Data type', value: selected.dataType ?? 'text', color: 'rgb(var(--text-2))' },
                {
                  key: 'Modified',
                  value: selected.lastModifiedDate
                    ? new Date(selected.lastModifiedDate).toLocaleDateString()
                    : '—',
                  color: 'rgb(var(--text-2))',
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selected ? (
          <ParameterDetail
            key={selected.name}
            param={selected}
            onDeleted={async () => {
              setSelectedName(null)
              await loadParams()
            }}
            onUpdated={loadParams}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={SlidersHorizontal}
              title="Select a parameter"
              hint="Pick a parameter from the rail to read its value and version history."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Parameter
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateParameterModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async (name: string) => {
            setShowCreateModal(false)
            await loadParams()
            setSelectedName(name)
          }}
        />
      )}
    </>
  )
}
