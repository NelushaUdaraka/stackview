import { useCallback, useEffect, useState } from 'react'
import { Database } from 'lucide-react'
import type { AppSettings } from '../../types'
import TableDetail from './TableDetail'
import CreateTableModal from './CreateTableModal'
import { ServiceShell, ResourceRail, Inspector, EmptyState, type RailItem } from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function DynamoDbLayout({ settings }: Props) {
  const [tables, setTables] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadTables = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.dynamoDbListTables()
      if (result.success && result.data) setTables(result.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTables()
  }, [loadTables])

  const railItems: RailItem[] = tables.map(name => ({
    id: name,
    name,
    icon: Database,
    state: 'ok',
    sub: 'TABLE',
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="TABLES"
            items={railItems}
            selectedId={selected}
            onSelect={item => setSelected(item.id)}
            icon={Database}
            searchPlaceholder="Search tables..."
            onCreate={() => setShowCreateModal(true)}
            createLabel="New Table"
            loading={loading}
            emptyLabel="No tables yet"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="table"
              icon={Database}
              iconColor="#8b5cf6"
              title={selected}
              subtitle="Document table"
              sectionTitle="TABLE"
              rows={[
                { key: 'Region', value: settings.region, color: 'rgb(var(--accent))' },
                { key: 'Endpoint', value: settings.endpoint, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selected ? (
          <TableDetail
            key={selected}
            tableName={selected}
            onDeleted={async () => {
              setSelected(null)
              await loadTables()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Database}
              title="Select a table"
              hint="Pick a table from the rail to scan items or inspect its schema."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  New Table
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreateModal && (
        <CreateTableModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async (name: string) => {
            setShowCreateModal(false)
            await loadTables()
            setSelected(name)
          }}
        />
      )}
    </>
  )
}
