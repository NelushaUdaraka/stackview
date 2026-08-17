import { useCallback, useEffect, useState } from 'react'
import { TerminalSquare } from 'lucide-react'
import type { AppSettings, LambdaFunction } from '../../types'
import LambdaFunctionDetail from './LambdaFunctionDetail'
import CreateLambdaFunctionModal from './CreateLambdaFunctionModal'
import {
  ServiceShell, ResourceRail, Inspector, EmptyState, formatBytes, statusColor, stateOf,
  type RailItem,
} from '../common/ui'

interface Props {
  settings: AppSettings
}

export default function LambdaLayout({ settings }: Props) {
  const [functions, setFunctions] = useState<LambdaFunction[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const loadFunctions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.lambdaListFunctions()
      if (res.success && res.data) {
        const list = res.data as LambdaFunction[]
        setFunctions(list)
        // Drop the selection if the function it pointed at is gone.
        setSelectedName(prev => (prev && list.some(f => f.FunctionName === prev) ? prev : null))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFunctions()
  }, [loadFunctions])

  const selected = functions.find(f => f.FunctionName === selectedName) ?? null

  const railItems: RailItem[] = functions.map(f => ({
    id: f.FunctionName,
    name: f.FunctionName,
    icon: TerminalSquare,
    state: stateOf(f.State) ?? 'ok',
    sub: (f.State ?? 'ACTIVE').toUpperCase(),
    meta: f.Runtime,
    keywords: `${f.Runtime} ${f.Handler}`,
  }))

  return (
    <>
      <ServiceShell
        rail={
          <ResourceRail
            title="FUNCTIONS"
            items={railItems}
            selectedId={selectedName}
            onSelect={item => setSelectedName(item.id)}
            icon={TerminalSquare}
            searchPlaceholder="Search functions..."
            onCreate={() => setShowCreate(true)}
            createLabel="Create Function"
            loading={loading}
            emptyLabel="No functions yet"
          />
        }
        inspector={
          selected ? (
            <Inspector
              kind="function"
              icon={TerminalSquare}
              iconColor="#8b5cf6"
              title={selected.FunctionName}
              subtitle={selected.Description || selected.Runtime}
              rows={[
                { key: 'Runtime', value: selected.Runtime, color: 'rgb(var(--accent))' },
                { key: 'Handler', value: selected.Handler, color: 'rgb(var(--text-2))' },
                { key: 'Memory', value: `${selected.MemorySize} MB` },
                { key: 'Timeout', value: `${selected.Timeout}s` },
                { key: 'Code size', value: formatBytes(selected.CodeSize) },
                { key: 'Version', value: selected.Version, color: 'rgb(var(--text-2))' },
                {
                  key: 'State',
                  value: selected.State ?? 'Active',
                  color: statusColor(selected.State ?? 'Active'),
                },
                { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
              ]}
            />
          ) : undefined
        }
      >
        {selected ? (
          <LambdaFunctionDetail
            key={selected.FunctionName}
            lambda={selected}
            onRefresh={loadFunctions}
            onDeleted={() => {
              setSelectedName(null)
              loadFunctions()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={TerminalSquare}
              title={loading ? 'Loading functions…' : 'Select a function'}
              hint={
                functions.length === 0 && !loading
                  ? 'Deploy a serverless function to get started.'
                  : 'Pick a function from the rail to invoke it or read its configuration.'
              }
              action={
                functions.length === 0 && !loading ? (
                  <button onClick={() => setShowCreate(true)} className="btn-primary">
                    Create Function
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </ServiceShell>

      {showCreate && (
        <CreateLambdaFunctionModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadFunctions()
          }}
        />
      )}
    </>
  )
}
