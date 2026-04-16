import { useState, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { Database, Plus } from 'lucide-react'
import type { AppSettings } from '../../types'
import DynamoDbSidebar from './DynamoDbSidebar'
import TableDetail from './TableDetail'
import CreateTableModal from './CreateTableModal'

interface Props {
  settings: AppSettings
}

export default function DynamoDbLayout({
  settings,
}: Props) {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 180, max: 480 })

  const loadTables = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.dynamoDbListTables()
      if (result.success && result.data) {
        setTables(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTables()
  }, [])

  const handleTableCreated = async (name: string) => {
    setShowCreateModal(false)
    await loadTables()
    const found = tables.find((t) => t === name)
    if (found) setSelectedTable(found)
  }

  const handleTableDeleted = async () => {
    setSelectedTable(null)
    await loadTables()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex shrink-0" style={{ width: sidebarWidth }}>
          <DynamoDbSidebar
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
            onCreateTable={() => setShowCreateModal(true)}
            loading={loading}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 shrink-0 cursor-col-resize relative select-none"
          style={{ backgroundColor: 'rgb(var(--border))' }}
          title="Drag to resize"
        />

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-app">
          {selectedTable ? (
            <TableDetail
              key={selectedTable}
              tableName={selectedTable}
              onDeleted={handleTableDeleted}
            />
          ) : (
            <DynamoEmptyState onCreateTable={() => setShowCreateModal(true)} />
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateTableModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTableCreated}
        />
      )}
    </div>
  )
}

function DynamoEmptyState({ onCreateTable }: { onCreateTable: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div
        className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 border-theme"
        style={{ backgroundColor: 'rgb(var(--bg-raised))' }}
      >
        <Database size={32} className="text-4" />
      </div>
      <h3 className="text-base font-semibold text-2 mb-2">Select a table to get started</h3>
      <p className="text-sm text-3 mb-6 max-w-xs leading-relaxed">
        Choose a table from the sidebar to query items, view definitions, or manage schema.
      </p>
      <button
        onClick={onCreateTable}
        className="btn-primary gap-2 text-white"
        style={{ backgroundColor: 'rgb(139 92 246)' }}
      >
        <Plus size={15} />
        Create New Table
      </button>
    </div>
  )
}
