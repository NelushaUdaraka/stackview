import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LayoutGrid, Star, Eye, EyeOff, RotateCcw, Pencil, Check,
  ExternalLink, ArrowRight, Server, ChevronUp, ChevronDown,
} from 'lucide-react'
import type { AppSettings, Service, IconMode } from '../../types'
import { AwsServiceIcon } from './AwsServiceIcons'
import { SERVICE_CONFIG, ALL_SERVICES_ORDERED } from '../../services/serviceConfig'
import {
  ServiceShell, ResourceRail, DetailHeader, DataTable, Inspector, InspectorSection,
  type RailItem, type Column,
} from './ui'

interface Props {
  settings: AppSettings
  onSelectService: (service: Service) => void
  onOpenInNewTab: (service: Service) => void
  favouriteServices: Service[]
  onToggleFavourite: (svc: Service) => void
  iconMode: IconMode
}

const STORAGE_KEY = 'stackview:service_prefs'

interface ServicePrefs {
  order: Service[]
  hidden: Service[]
}

function loadPrefs(): ServicePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* corrupt or absent — fall through to defaults */
  }
  return { order: [...ALL_SERVICES_ORDERED], hidden: [] }
}

/**
 * The "All Services" overview: every service in one table, with the rail for
 * finding one by name and the inspector describing whichever row is highlighted.
 *
 * Customize mode surfaces ordering and hiding rather than keeping those controls
 * permanently on screen.
 */
export default function ServiceSelector({
  settings,
  onSelectService,
  onOpenInNewTab,
  favouriteServices,
  onToggleFavourite,
  iconMode,
}: Props) {
  const [prefs, setPrefs] = useState<ServicePrefs>(loadPrefs)
  const [editMode, setEditMode] = useState(false)
  const [highlighted, setHighlighted] = useState<Service | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; service: Service } | null>(null)

  const updatePrefs = useCallback((next: ServicePrefs) => {
    setPrefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  useEffect(() => {
    if (!contextMenu) return
    const dismiss = () => setContextMenu(null)
    window.addEventListener('mousedown', dismiss)
    return () => window.removeEventListener('mousedown', dismiss)
  }, [contextMenu])

  // Services added since the prefs were saved still need a place in the order.
  const order = useMemo<Service[]>(
    () => [
      ...prefs.order.filter(id => ALL_SERVICES_ORDERED.includes(id)),
      ...ALL_SERVICES_ORDERED.filter(id => !prefs.order.includes(id)),
    ],
    [prefs.order]
  )

  /** Pinned first in normal use; edit mode shows the true stored order. */
  const listed = useMemo(() => {
    if (editMode) return order
    const visible = order.filter(id => !prefs.hidden.includes(id))
    return [
      ...visible.filter(id => favouriteServices.includes(id)),
      ...visible.filter(id => !favouriteServices.includes(id)),
    ]
  }, [order, prefs.hidden, favouriteServices, editMode])

  const railItems: RailItem[] = listed.map(id => {
    const meta = SERVICE_CONFIG[id]
    const pinned = favouriteServices.includes(id)
    return {
      id,
      name: meta.name,
      icon: meta.icon,
      state: pinned ? 'ok' : undefined,
      sub: pinned ? 'PINNED' : meta.label.toUpperCase(),
      keywords: `${meta.label} ${meta.description} ${meta.features.join(' ')}`,
    }
  })

  const move = (id: Service, delta: -1 | 1) => {
    const next = [...order]
    const from = next.indexOf(id)
    const to = from + delta
    if (from === -1 || to < 0 || to >= next.length) return
    next.splice(from, 1)
    next.splice(to, 0, id)
    updatePrefs({ ...prefs, order: next })
  }

  const toggleHidden = (id: Service) => {
    updatePrefs({
      ...prefs,
      hidden: prefs.hidden.includes(id) ? prefs.hidden.filter(h => h !== id) : [...prefs.hidden, id],
    })
  }

  const columns: Column<Service>[] = [
    {
      key: 'pin',
      label: '',
      width: '28px',
      render: id => {
        const isFav = favouriteServices.includes(id)
        return (
          <button
            onClick={e => {
              e.stopPropagation()
              onToggleFavourite(id)
            }}
            title={isFav ? 'Unpin' : 'Pin to the top of the list'}
            className="transition-colors hover:opacity-80"
            style={{ color: isFav ? 'rgb(var(--accent))' : 'rgb(var(--text-4))' }}
          >
            <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        )
      },
    },
    {
      key: 'name',
      label: 'SERVICE',
      width: '230px',
      sortable: true,
      value: id => SERVICE_CONFIG[id].name,
      render: id => {
        const meta = SERVICE_CONFIG[id]
        const Icon = meta.icon
        const hidden = prefs.hidden.includes(id)
        return (
          <>
            {iconMode === 'aws' ? (
              <AwsServiceIcon service={id} size={14} />
            ) : (
              <Icon size={13} className="shrink-0" style={{ color: meta.hex }} />
            )}
            <span
              className="truncate text-xs font-semibold"
              style={{ color: hidden ? 'rgb(var(--text-4))' : 'rgb(var(--text-1))' }}
              title={meta.name}
            >
              {meta.name}
            </span>
          </>
        )
      },
    },
    {
      key: 'description',
      label: 'SUMMARY',
      value: id => SERVICE_CONFIG[id].description,
    },
    {
      key: 'label',
      label: 'API',
      width: '150px',
      mono: true,
      value: id => SERVICE_CONFIG[id].label,
    },
    ...(editMode
      ? ([
          {
            key: 'order',
            label: 'ORDER',
            width: '74px',
            render: id => (
              <span className="flex items-center gap-1">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    move(id, -1)
                  }}
                  className="btn-icon w-[18px] h-[18px]"
                  title="Move up"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    move(id, 1)
                  }}
                  className="btn-icon w-[18px] h-[18px]"
                  title="Move down"
                >
                  <ChevronDown size={12} />
                </button>
              </span>
            ),
          },
          {
            key: 'visibility',
            label: 'SHOWN',
            width: '70px',
            align: 'right',
            render: id => {
              const isHidden = prefs.hidden.includes(id)
              return (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    toggleHidden(id)
                  }}
                  title={isHidden ? 'Show service' : 'Hide service'}
                  style={{ color: isHidden ? 'rgb(var(--text-4))' : 'rgb(var(--ok))' }}
                >
                  {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              )
            },
          },
        ] satisfies Column<Service>[])
      : []),
  ]

  const active = highlighted ?? listed[0] ?? null
  const activeMeta = active ? SERVICE_CONFIG[active] : null

  return (
    <ServiceShell
      rail={
        <ResourceRail
          title="SERVICES"
          items={railItems}
          selectedId={active}
          onSelect={item => setHighlighted(item.id as Service)}
          icon={LayoutGrid}
          searchPlaceholder="Search services..."
          emptyLabel="No services"
        />
      }
      inspector={
        activeMeta && active ? (
          <Inspector
            kind="service"
            icon={activeMeta.icon}
            iconColor={activeMeta.hex}
            title={activeMeta.name}
            subtitle={activeMeta.description}
            sectionTitle="ENDPOINT"
            rows={[
              { key: 'Endpoint', value: settings.endpoint, color: 'rgb(var(--text-2))' },
              { key: 'Region', value: settings.region, color: 'rgb(var(--accent))' },
              { key: 'API', value: activeMeta.label, color: 'rgb(var(--text-2))' },
              {
                key: 'Pinned',
                value: favouriteServices.includes(active) ? 'yes' : 'no',
                color: favouriteServices.includes(active) ? 'rgb(var(--ok))' : 'rgb(var(--text-3))',
              },
            ]}
          >
            <InspectorSection title="CAPABILITIES">
              {activeMeta.features.map(f => (
                <div key={f} className="flex items-start gap-2 mb-1.5 text-[11.5px] text-2">
                  <Check size={11} className="shrink-0 mt-0.5" style={{ color: 'rgb(var(--ok))' }} />
                  <span className="min-w-0">{f}</span>
                </div>
              ))}
            </InspectorSection>

            <InspectorSection title="OPEN">
              <button onClick={() => onSelectService(active)} className="btn-primary w-full mb-2">
                <ArrowRight size={12} />
                Open {activeMeta.label}
              </button>
              <button onClick={() => onOpenInNewTab(active)} className="btn-secondary w-full">
                <ExternalLink size={12} />
                Open in New Tab
              </button>
            </InspectorSection>
          </Inspector>
        ) : undefined
      }
    >
      <DetailHeader
        icon={LayoutGrid}
        title="Services"
        badge={`${order.filter(id => !prefs.hidden.includes(id)).length} AVAILABLE`}
        meta={`${settings.endpoint} · ${settings.region}`}
        copyValue={settings.endpoint}
        actions={
          editMode ? (
            <>
              <button
                onClick={() => updatePrefs({ order: [...ALL_SERVICES_ORDERED], hidden: [] })}
                className="btn-ghost"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <button onClick={() => setEditMode(false)} className="btn-primary">
                <Check size={12} />
                Done
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="btn-secondary">
              <Pencil size={12} />
              Customize
            </button>
          )
        }
      />

      {editMode && (
        <div
          className="shrink-0 px-5 py-2 border-b border-theme text-[11px] text-3"
          style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.35)' }}
        >
          Reorder with the arrows · use the eye to hide a service from the list
          {prefs.hidden.length > 0 && <span className="text-4"> · {prefs.hidden.length} hidden</span>}
        </div>
      )}

      <div
        className="flex-1 min-h-0 flex flex-col"
        onContextMenu={e => {
          const row = (e.target as HTMLElement).closest('[data-row-id]') as HTMLElement | null
          if (!row?.dataset.rowId) return
          e.preventDefault()
          setContextMenu({ x: e.clientX, y: e.clientY, service: row.dataset.rowId as Service })
        }}
      >
        <DataTable
          columns={columns}
          rows={listed}
          rowId={id => id}
          selectedId={active}
          onSelect={id => {
            setHighlighted(id)
            if (!editMode) onSelectService(id)
          }}
          emptyIcon={Server}
          emptyTitle="No services to show"
          emptyHint="Turn some back on from Customize."
        />
      </div>

      {contextMenu && (
        <div
          className="popover fixed z-50 min-w-[170px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onOpenInNewTab(contextMenu.service)
              setContextMenu(null)
            }}
            className="menu-item"
          >
            <ExternalLink size={13} className="shrink-0 text-3" />
            Open in new tab
          </button>
        </div>
      )}
    </ServiceShell>
  )
}
