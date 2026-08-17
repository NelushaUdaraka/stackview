export interface Field {
  key: string
  value: string
  /** Overrides the value colour — pass a state colour for statuses. */
  color?: string
  /** Let the value wrap instead of truncating — policies, descriptions. */
  wrap?: boolean
  /** Span the full row: ARNs and templates need the width. */
  full?: boolean
}

export interface FieldGroup {
  title: string
  fields: Field[]
}

interface Props {
  groups: FieldGroup[]
  /** Cards per row. The design uses three. */
  columns?: number
}

/**
 * Grouped specification cards — the read-only face of a resource's
 * configuration. Each card is a letterspaced key over a monospace value.
 */
export default function FieldGrid({ groups, columns = 3 }: Props) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4.5" style={{ paddingTop: 18, paddingBottom: 18 }}>
      {groups.map(group => (
        <div key={group.title} className="mb-4.5" style={{ marginBottom: 18 }}>
          <div className="ui-label-dim mb-2.5">{group.title}</div>
          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {group.fields.map(field => (
              <div
                key={field.key}
                className="card min-w-0"
                style={{
                  padding: '11px 13px',
                  gridColumn: field.full ? '1 / -1' : undefined,
                }}
              >
                <div className="ui-key mb-1.5 truncate" title={field.key}>
                  {field.key}
                </div>
                <div
                  title={field.value}
                  className={field.wrap ? 'break-words' : 'truncate'}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    lineHeight: 1.45,
                    color: field.color ?? 'rgb(var(--text-1))',
                  }}
                >
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
