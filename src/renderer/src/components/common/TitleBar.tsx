import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import {
  Plus, X, Minus, Square,
  Layers, HardDrive, Shield, Database, LayoutTemplate, SlidersHorizontal,
  MessageSquare, Workflow, CalendarClock, Mail, Key, UserCheck, Network,
  Flame, TerminalSquare, Activity, Server, Mic, LayoutGrid, Globe, GitBranch, Share2, LifeBuoy, Boxes, ClipboardList, Waypoints, Lock
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppTab, Service } from '../../types'

const TAB_LABELS: Record<Service, string> = {
  sqs:            'SQS',
  s3:             'S3',
  secretsmanager: 'Secrets',
  dynamodb:       'DynamoDB',
  cloudformation: 'CloudFormation',
  ssm:            'Parameters',
  sns:            'SNS',
  eventbridge:    'EventBridge',
  scheduler:      'Scheduler',
  ses:            'SES',
  kms:            'KMS',
  iam:            'IAM',
  sts:            'STS',
  apigw:          'API Gateway',
  firehose:       'Firehose',
  lambda:         'Lambda',
  cloudwatch:     'CloudWatch',
  redshift:       'Redshift',
  kinesis:        'Kinesis',
  opensearch:     'OpenSearch',
  ec2:            'EC2',
  transcribe:     'Transcribe',
  route53:        'Route 53',
  acm:            'ACM',
  swf:            'SWF',
  sfn:            'Step Functions',
  support:        'Support',
  resourcegroups: 'Resource Groups',
  awsconfig:      'Config',
  r53resolver:    'R53 Resolver',
  s3control:      'S3 Control',
}

const TAB_ICONS: Record<Service, LucideIcon> = {
  sqs:            Layers,
  s3:             HardDrive,
  secretsmanager: Shield,
  dynamodb:       Database,
  cloudformation: LayoutTemplate,
  ssm:            SlidersHorizontal,
  sns:            MessageSquare,
  eventbridge:    Workflow,
  scheduler:      CalendarClock,
  ses:            Mail,
  kms:            Key,
  iam:            UserCheck,
  sts:            Key,
  apigw:          Network,
  firehose:       Flame,
  lambda:         TerminalSquare,
  cloudwatch:     Activity,
  redshift:       Database,
  kinesis:        Activity,
  opensearch:     LayoutGrid,
  ec2:            Server,
  transcribe:     Mic,
  route53:        Globe,
  acm:            Shield,
  swf:            GitBranch,
  sfn:            Share2,
  support:        LifeBuoy,
  resourcegroups: Boxes,
  awsconfig:      ClipboardList,
  r53resolver:    Waypoints,
  s3control:      Lock,
}

const TAB_DOT: Record<Service, string> = {
  sqs:            'text-brand-500',
  s3:             'text-emerald-500',
  secretsmanager: 'text-indigo-500',
  dynamodb:       'text-violet-500',
  cloudformation: 'text-orange-500',
  ssm:            'text-teal-500',
  sns:            'text-pink-500',
  eventbridge:    'text-fuchsia-500',
  scheduler:      'text-amber-500',
  ses:            'text-sky-500',
  kms:            'text-violet-500',
  iam:            'text-rose-500',
  sts:            'text-yellow-500',
  apigw:          'text-violet-500',
  firehose:       'text-orange-500',
  lambda:         'text-violet-500',
  cloudwatch:     'text-cyan-500',
  redshift:       'text-red-500',
  kinesis:        'text-amber-500',
  opensearch:     'text-purple-500',
  ec2:            'text-orange-500',
  transcribe:     'text-blue-500',
  route53:        'text-blue-400',
  acm:            'text-teal-500',
  swf:            'text-green-500',
  sfn:            'text-lime-500',
  support:        'text-sky-500',
  resourcegroups: 'text-orange-500',
  awsconfig:      'text-amber-500',
  r53resolver:    'text-blue-400',
  s3control:      'text-teal-500',
}

const isWindows = window.electronAPI.platform === 'win32'

interface Props {
  tabs: AppTab[]
  activeTabId: string | null
  onSwitch: (id: string) => void
  onClose: (id: string) => void
  onNew: () => void
  onOpenInNewTab: (svc: Service) => void
  onReorder: (tabs: AppTab[]) => void
}

interface DragCloneInfo {
  y: number
  width: number
  height: number
  label: string
  iconColor: string
  IconComponent: LucideIcon
}

export default function TitleBar({ tabs, activeTabId, onSwitch, onClose, onNew, onOpenInNewTab, onReorder }: Props) {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null)
  const [dragTabId, setDragTabId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [dragMouseX, setDragMouseX] = useState(0)
  const [dragCloneInfo, setDragCloneInfo] = useState<DragCloneInfo | null>(null)

  // FLIP animation refs
  const cardElRefs = useRef<Map<string, HTMLElement>>(new Map())
  const prevPositions = useRef<Map<string, DOMRect>>(new Map())
  const tabsAreaRef = useRef<HTMLDivElement>(null)

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (!activeTabId) return
    const el = cardElRefs.current.get(activeTabId)
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeTabId])

  // Track mouse X globally while dragging so the clone stays inside the container
  useEffect(() => {
    if (!dragTabId) return
    const onMove = (e: DragEvent) => setDragMouseX(e.clientX)
    document.addEventListener('dragover', onMove)
    return () => document.removeEventListener('dragover', onMove)
  }, [dragTabId])

  // Preview order shown during drag
  const previewTabs = useMemo(() => {
    if (!dragTabId || dropIndex === null) return tabs
    const srcIdx = tabs.findIndex(t => t.id === dragTabId)
    if (srcIdx === -1 || dropIndex === srcIdx || dropIndex === srcIdx + 1) return tabs
    const next = [...tabs]
    const [moved] = next.splice(srcIdx, 1)
    const insertAt = dropIndex > srcIdx ? dropIndex - 1 : dropIndex
    next.splice(insertAt, 0, moved)
    return next
  }, [tabs, dragTabId, dropIndex])

  // FLIP: animate tabs from old positions to new when dropIndex changes
  useLayoutEffect(() => {
    if (!dragTabId || dropIndex === null) return

    const newPositions = new Map<string, DOMRect>()
    cardElRefs.current.forEach((el, id) => {
      if (el) newPositions.set(id, el.getBoundingClientRect())
    })

    cardElRefs.current.forEach((el, id) => {
      if (!el) return
      const oldPos = prevPositions.current.get(id)
      const newPos = newPositions.get(id)
      if (!oldPos || !newPos) return
      const dx = oldPos.left - newPos.left
      const dy = oldPos.top - newPos.top
      if (dx === 0 && dy === 0) return
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)'
          el.style.transform = ''
        })
      })
    })
  }, [dropIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const commitReorder = (srcId: string, target: number) => {
    const srcIdx = tabs.findIndex(t => t.id === srcId)
    if (srcIdx === -1 || target === srcIdx || target === srcIdx + 1) return
    const next = [...tabs]
    const [moved] = next.splice(srcIdx, 1)
    const insertAt = target > srcIdx ? target - 1 : target
    next.splice(insertAt, 0, moved)
    onReorder(next)
  }

  return (
    <div
      className="drag-region shrink-0 flex items-center"
      style={{ backgroundColor: 'rgb(var(--bg-app))', height: 44, position: 'relative', borderBottom: '1px solid rgb(var(--border))' }}
    >
      {/* Tabs area */}
      <div className="flex flex-1 items-center min-w-0 px-2">
        {/* Scrollable tab strip */}
        <div
          ref={tabsAreaRef}
          className="flex items-center"
          style={{ flex: '1 1 0', minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none', height: 44 }}
          onDragOver={e => {
            if (e.dataTransfer.types.includes('stackview/tab') || e.dataTransfer.types.includes('stackview/service')) {
              e.preventDefault()
            }
            if (!dragTabId || !dragCloneInfo) return
            // Find which tab the cursor is physically inside
            let hoveredIdx = -1
            for (let i = 0; i < previewTabs.length; i++) {
              const el = cardElRefs.current.get(previewTabs[i].id)
              if (!el) continue
              const { left, right } = el.getBoundingClientRect()
              if (e.clientX >= left && e.clientX < right) { hoveredIdx = i; break }
            }
            const previewSrcIdx = previewTabs.findIndex(t => t.id === dragTabId)
            if (hoveredIdx === previewSrcIdx) return  // over the dragged tab itself — no change
            let newDrop: number
            if (hoveredIdx === -1) {
              // Cursor outside all tabs — snap to nearest end
              const lastEl = cardElRefs.current.get(previewTabs[previewTabs.length - 1]?.id)
              newDrop = lastEl && e.clientX > lastEl.getBoundingClientRect().right
                ? previewTabs.length
                : 0
            } else if (hoveredIdx > previewSrcIdx) {
              newDrop = hoveredIdx + 1  // insert after the hovered tab
            } else {
              newDrop = hoveredIdx      // insert before the hovered tab
            }
            setDropIndex(prev => {
              if (prev === newDrop) return prev
              cardElRefs.current.forEach((el, id) => {
                if (el) prevPositions.current.set(id, el.getBoundingClientRect())
              })
              return newDrop
            })
          }}
          onDrop={e => {
            e.preventDefault()
            // Clean FLIP transforms before committing so re-render starts clean
            cardElRefs.current.forEach(el => {
              if (el) { el.style.transform = ''; el.style.transition = '' }
            })
            if (e.dataTransfer.types.includes('stackview/service')) {
              const svc = e.dataTransfer.getData('stackview/service') as Service
              if (svc) onOpenInNewTab(svc)
            } else if (e.dataTransfer.types.includes('stackview/tab') && dragTabId !== null && dropIndex !== null) {
              commitReorder(dragTabId, dropIndex)
            }
            setDragTabId(null)
            setDropIndex(null)
          }}
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDropIndex(null)
            }
          }}
        >
        {previewTabs.map((tab) => {
          const isActive  = tab.id === activeTabId
          const isHovered = hoveredTabId === tab.id
          const isDragging = dragTabId === tab.id
          const Icon      = tab.service ? TAB_ICONS[tab.service] : LayoutGrid
          const iconColor = tab.service ? TAB_DOT[tab.service]   : 'text-zinc-400'
          const label     = tab.service ? TAB_LABELS[tab.service] : 'New Tab'

          const dragHandlers = {
            draggable: true as const,
            onDragStart: (e: React.DragEvent) => {
              e.dataTransfer.setData('stackview/tab', tab.id)
              e.dataTransfer.effectAllowed = 'move' as const
              // Suppress the native ghost — we render our own constrained clone
              const ghost = new Image()
              ghost.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
              e.dataTransfer.setDragImage(ghost, 0, 0)
              // Capture positions before drag starts
              cardElRefs.current.forEach((el, id) => {
                if (el) prevPositions.current.set(id, el.getBoundingClientRect())
              })
              // Capture clone info so we can render a constrained preview
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              setDragCloneInfo({ y: rect.top, width: rect.width, height: rect.height, label, iconColor, IconComponent: Icon })
              setDragMouseX(e.clientX)
              setDragTabId(tab.id)
            },
            onDragEnd: () => {
              cardElRefs.current.forEach(el => {
                if (el) { el.style.transform = ''; el.style.transition = '' }
              })
setDragTabId(null)
              setDropIndex(null)
              setDragCloneInfo(null)
            },
          }

          if (isActive) {
            return (
              <button
                key={tab.id}
                {...dragHandlers}
                ref={el => { if (el) cardElRefs.current.set(tab.id, el); else cardElRefs.current.delete(tab.id) }}
                onClick={() => onSwitch(tab.id)}
                onMouseEnter={() => setHoveredTabId(tab.id)}
                onMouseLeave={() => setHoveredTabId(null)}
                className="no-drag group relative flex items-center gap-1.5 px-3 text-xs text-1 font-medium"
                style={{
                  flex: '1 1 160px',
                  minWidth: 64,
                  maxWidth: 200,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgb(var(--bg-raised))',
                  border: '1px solid rgb(var(--border))',
                  opacity: isDragging ? 0.25 : 1,
                  overflow: 'hidden',
                }}
              >
                <Icon size={12} className={`relative z-10 ${iconColor} shrink-0`} />
                <span className="relative z-10 truncate flex-1 text-left">{label}</span>
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); onClose(tab.id) }}
                  className="relative z-10 flex items-center justify-center w-4 h-4 rounded-full transition-all shrink-0 text-3 hover:text-1 hover:bg-overlay"
                >
                  <X size={10} />
                </span>
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              {...dragHandlers}
              ref={el => { if (el) cardElRefs.current.set(tab.id, el); else cardElRefs.current.delete(tab.id) }}
              onClick={() => onSwitch(tab.id)}
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onMouseLeave={() => setHoveredTabId(null)}
              className="no-drag group relative flex items-center gap-1.5 px-3 text-xs transition-colors"
              style={{
                flex: '1 1 160px',
                minWidth: 36,
                maxWidth: 200,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'transparent',
                color: isHovered ? 'rgb(var(--text-2))' : 'rgb(var(--text-3))',
                opacity: isDragging ? 0.25 : 1,
                overflow: 'hidden',
              }}
            >
              {/* Hover pill */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 8,
                background: isHovered ? 'rgb(var(--bg-raised))' : 'transparent',
                transition: 'background 0.15s',
                pointerEvents: 'none',
                zIndex: 0,
              }} />
              <Icon size={12} className={`relative z-10 ${iconColor} shrink-0 opacity-60`} />
              <span className="relative z-10 truncate flex-1 text-left">{label}</span>
              <span
                role="button"
                onClick={e => { e.stopPropagation(); onClose(tab.id) }}
                className="relative z-10 flex items-center justify-center w-4 h-4 rounded-full transition-all shrink-0 text-4 opacity-0 group-hover:opacity-100 hover:text-1 hover:bg-overlay"
              >
                <X size={10} />
              </span>
            </button>
          )
        })}

        {/* New tab button — inside scroll strip, right after tabs */}
        <button
          onClick={onNew}
          className="no-drag flex items-center justify-center w-7 h-7 text-3 hover:text-1 hover:bg-raised rounded-full transition-colors shrink-0"
          style={{ marginLeft: 4, alignSelf: 'center' }}
          title="New tab"
        >
          <Plus size={14} />
        </button>
        </div>
      </div>

      {/* Constrained drag clone — horizontal only, never exits tab bar */}
      {dragCloneInfo && dragTabId && (() => {
        const cr = tabsAreaRef.current?.getBoundingClientRect()
        const cloneLeft = cr
          ? Math.max(cr.left, Math.min(cr.right - dragCloneInfo.width, dragMouseX - dragCloneInfo.width / 2))
          : dragMouseX
        const CloneIcon = dragCloneInfo.IconComponent
        return (
          <div
            style={{
              position: 'fixed',
              left: cloneLeft,
              top: dragCloneInfo.y,
              width: dragCloneInfo.width,
              height: dragCloneInfo.height,
              zIndex: 9999,
              pointerEvents: 'none',
              borderRadius: 8,
              backgroundColor: 'rgb(var(--bg-raised))',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              opacity: 0.9,
            }}
          >
            <CloneIcon size={12} className={dragCloneInfo.iconColor} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgb(var(--text-1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {dragCloneInfo.label}
            </span>
          </div>
        )
      })()}

      {/* Windows controls */}
      {isWindows && (
        <div className="no-drag self-stretch flex items-stretch shrink-0">
          <button onClick={() => window.electronAPI.minimize()} className="flex items-center justify-center w-11 h-full text-2 hover:bg-raised transition-colors" title="Minimize"><Minus size={14} /></button>
          <button onClick={() => window.electronAPI.maximize()} className="flex items-center justify-center w-11 h-full text-2 hover:bg-raised transition-colors" title="Maximize"><Square size={12} /></button>
          <button onClick={() => window.electronAPI.close()} className="flex items-center justify-center w-12 h-full text-2 hover:bg-red-500 hover:text-white transition-colors" title="Close"><X size={15} /></button>
        </div>
      )}
    </div>
  )
}
