# NexusStack — Adding a New AWS Service

This document is the definitive checklist for adding any new AWS service to NexusStack.
Follow every step in order. Missing any step causes bugs like empty tab names, broken
region switching, or TypeScript errors.

---

## Checklist (copy this when starting a new service)

```
[ ]  1. Install AWS SDK package
[ ]  2. Create backend service module  (src/main/services/<svc>Service.ts)
[ ]  3. Create handler file  (src/main/handlers/<svc>Handlers.ts — export register<Svc>Handlers)
[ ]  4. Register handler in main/index.ts  (import + call register<Svc>Handlers(ipcMain))
[ ]  5. Add preload entries to preload/index.ts
[ ]  6. Add shared types to src/shared/types.ts (if needed); re-export from renderer/src/types.ts
[ ]  7. Add Service union entry + electronAPI methods to renderer/src/types.ts
[ ]  8. Create renderer components  (src/renderer/src/components/<svc>/)
[ ]  9. Add entry to SERVICE_CONFIG in src/renderer/src/services/serviceConfig.ts   ← most commonly forgotten
[ ] 10. Add entry to SERVICE_REINIT_MAP in App.tsx
[ ] 11. Add entry to LAYOUT_RENDERERS in App.tsx + import the Layout at the top of App.tsx
```

---

## Step-by-step Guide

### 1. Install AWS SDK package

```bash
npm install @aws-sdk/client-<service>
```

### 2. Create backend service module

**File:** `src/main/services/<service>Service.ts`

```ts
import { <Service>Client, ... } from '@aws-sdk/client-<service>'

let client: <Service>Client | null = null

export function init<Service>Client(endpoint: string, region: string) {
  client = new <Service>Client({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

function getClient() {
  if (!client) throw new Error('<Service> client not initialized')
  return client
}

// Export one function per operation
export async function list<Resources>() { ... }
export async function create<Resource>(...) { ... }
export async function delete<Resource>(...) { ... }
```

### 3. Create handler file

**File:** `src/main/handlers/<svc>Handlers.ts`

Create a new file that imports from the service module and exports a single `register` function. All IPC handler logic lives here — never inline handlers directly in `index.ts`.

```ts
import { IpcMain } from 'electron'
import {
  init<Service>Client,
  list<Resources>,
  create<Resource>,
  delete<Resource>,
} from '../services/<service>Service'

export function register<Svc>Handlers(ipcMain: IpcMain): void {
  ipcMain.handle('<svc>:reinit', (_event, endpoint: string, region: string) => {
    init<Service>Client(endpoint, region)
  })

  ipcMain.handle('<svc>:list<Resources>', async () => {
    try { return { success: true, data: await list<Resources>() } }
    catch (err: unknown) { return { success: false, error: String(err) } }
  })

  // ... additional handlers
}
```

### 4. Register handler in main/index.ts

**File:** `src/main/index.ts`

Add the import and call alongside the other 24 handler registrations:

```ts
import { register<Svc>Handlers } from './handlers/<svc>Handlers'

// At the bottom of the file, with all other register calls:
register<Svc>Handlers(ipcMain)
```

### 5. Add preload entries to preload/index.ts

**File:** `src/preload/index.ts`

Add entries inside the `electronAPI` object (before the closing `}`):

```ts
// <Service>
<svc>Reinit: (endpoint: string, region: string) =>
  ipcRenderer.invoke('<svc>:reinit', endpoint, region) as Promise<void>,
<svc>List<Resources>: () =>
  ipcRenderer.invoke('<svc>:list<Resources>') as Promise<IpcResult<any[]>>,
```

### 6. Add shared types (if needed)

**File:** `src/shared/types.ts`

If your new service needs interfaces that are used in both the preload bridge methods AND renderer components (e.g., a data shape returned by IPC and consumed by a component), add them to `src/shared/types.ts`:

```ts
export interface <Svc><Resource> {
  id?: string
  // ...
}
```

Then re-export from `src/renderer/src/types.ts` so existing renderer imports continue working:

```ts
export type { <Svc><Resource> } from '../../shared/types'
```

If the type is only needed by the renderer (not the preload bridge), add it directly to `renderer/src/types.ts` instead.

### 7. Add TypeScript types to types.ts

**File:** `src/renderer/src/types.ts`

**a) Add `'<svc>'` to the `Service` union type:**

```ts
export type Service =
  | 'sqs'
  | 's3'
  // ... existing services ...
  | '<svc>'   // ← add here
```

**b) Add resource interfaces** (above the `declare global` block):

```ts
export interface <Service><Resource> {
  <ResourceId>?: string
  // ...
}
```

**c) Add methods to `Window.electronAPI`** (inside the interface, before the closing `}`):

```ts
// <Service>
<svc>Reinit: (endpoint: string, region: string) => Promise<void>
<svc>List<Resources>: () => Promise<IpcResult<<Service><Resource>[]>>
```

### 8. Create renderer components

**Directory:** `src/renderer/src/components/<svc>/`

| File | Purpose |
|------|---------|
| `<Svc>Layout.tsx` | Container — manages state, renders topbar + sidebar + content |
| `<Svc>Topbar.tsx` | Wraps `ServiceTopbar` with service-specific icon/color/label |
| `<Svc>Sidebar.tsx` | Resizable left panel — searchable resource list + create button |
| `<Resource>Detail.tsx` | Content area — tabs for overview/properties/etc + action buttons |
| `Create<Resource>Modal.tsx` | Modal form for creating a resource |

#### Topbar template

```tsx
import { <Icon> } from 'lucide-react'
import ServiceTopbar from '../common/ServiceTopbar'

export default function <Svc>Topbar(props) {
  return (
    <ServiceTopbar
      {...props}
      refreshing={props.refreshing ?? false}
      serviceIcon={<Icon>}
      serviceIconColor="text-<color>-500"
      serviceBadgeLabel="<LABEL>"
      serviceBadgeClass="bg-<color>-500/10 text-<color>-500 ring-1 ring-inset ring-<color>-500/20"
      switchServiceHoverClass="hover:text-<color>-500 hover:bg-<color>-500/10"
      regionActiveClass="bg-<color>-500/10 text-<color>-600 dark:text-<color>-300"
    />
  )
}
```

#### Layout template (minimal)

```tsx
export default function <Svc>Layout({ settings, theme, onToggleTheme, onDisconnect,
  onSwitchService, onRegionChange, tabBar }) {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 480 })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.<svc>List<Resources>()
    if (res.success && res.data) setItems(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  return (
    <div className="flex flex-col h-full bg-app text-1">
      <<Svc>Topbar ... onRefresh={load} refreshing={loading} />
      {tabBar}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex shrink-0">
          <<Svc>Sidebar items={items} selected={selected} onSelect={setSelected} loading={loading} />
        </div>

        {/* Resize handle */}
        <div onMouseDown={handleResizeStart} className="w-1 shrink-0 cursor-col-resize"
          style={{ backgroundColor: 'rgb(var(--border))' }} />

        {/* Content */}
        <main className="flex-1 overflow-hidden flex flex-col bg-app">
          {selected ? <Detail item={selected} /> : <EmptyState />}
        </main>
      </div>
    </div>
  )
}
```

### 9. ⚠️ Add to serviceConfig.ts — MOST COMMONLY FORGOTTEN

**File:** `src/renderer/src/services/serviceConfig.ts`

This is the single source of truth for all service metadata. Skipping it causes the service to be **missing from the nav rail, the service picker, and all metadata lookups**.

Add an entry to `SERVICE_CONFIG`:

```ts
<svc>: {
  label: '<Short Name>',          // NavRail tooltip and tab label
  name: '<Full Service Name>',    // ServiceSelector card heading
  description: 'One-line description of what the service does.',
  features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
  hex: '#<hexColor>',             // NavRail icon background hex
  icon: <Icon>,                   // LucideIcon component (not JSX — no size prop here)
  colors: {
    border: 'hover:border-<color>-500/50',
    icon:   'bg-<color>-500/10 text-<color>-500',
    dot:    'bg-<color>-500',
    text:   'text-<color>-500',
  },
  order: <number>,                // Position in the default service list (append at end)
},
```

Also import the icon at the top of `serviceConfig.ts` if it isn't already imported.

### 10. Add to SERVICE_REINIT_MAP in App.tsx

**File:** `src/renderer/src/App.tsx`

Add one entry to the module-level `SERVICE_REINIT_MAP` object:

```ts
<svc>: (ep, rg) => window.electronAPI.<svc>Reinit(ep, rg),
```

TypeScript will produce a compile error if this entry is missing (the `Record<Service, ...>` type enforces exhaustiveness).

### 11. Add to LAYOUT_RENDERERS in App.tsx

**File:** `src/renderer/src/App.tsx`

**a) Import at the top:**
```ts
import <Svc>Layout from './components/<svc>/<Svc>Layout'
```

**b) Add entry to the `LAYOUT_RENDERERS` useMemo map:**
```ts
<svc>: (tab) => <<Svc>Layout key={`${tab.id}-${refreshKey}`} settings={settings} />,
```

TypeScript will produce a compile error if this entry is missing.

---

## Service Brand Colors (existing services — avoid duplicates)

| Service | Color |
|---------|-------|
| sqs | brand (sky-blue) |
| s3 | emerald |
| secretsmanager | indigo |
| dynamodb | violet |
| cloudformation | orange |
| ssm | teal |
| sns | pink |
| eventbridge | fuchsia |
| scheduler | amber |
| ses | sky |
| kms | violet |
| iam | rose |
| sts | yellow |
| apigw | violet |
| firehose | orange |
| lambda | violet |
| cloudwatch | cyan |
| redshift | red |
| kinesis | amber |
| opensearch | purple |
| ec2 | orange |
| transcribe | blue |
| route53 | blue-400 |
| acm | teal |

> When choosing a color for a new service, prefer one not already in heavy use above.

---

## IPC Naming Convention

| Layer | Pattern | Example |
|-------|---------|---------|
| ipcMain channel | `'<svc>:<camelCaseAction>'` | `'ec2:listInstances'` |
| preload method | `<svc><PascalAction>` | `ec2ListInstances` |
| electronAPI method | same as preload | `window.electronAPI.ec2ListInstances()` |
| reinit channel | `'<svc>:reinit'` | `'ec2:reinit'` |
| reinit preload | `<svc>Reinit` | `ec2Reinit` |

---

## Frequently Made Mistakes

| Mistake | Where it shows |
|---------|---------------|
| Missing `SERVICE_CONFIG` entry (step 9) | Service absent from nav rail, service picker, and all metadata lookups |
| Missing `SERVICE_REINIT_MAP` entry (step 10) | TypeScript compile error (Record exhaustiveness) |
| Missing `LAYOUT_RENDERERS` entry (step 11) | TypeScript compile error (Record exhaustiveness) |
| Missing Layout import in `App.tsx` (step 11) | TypeScript / runtime error when opening the service tab |
| Missing `Service` union entry (step 7) | TypeScript errors throughout the codebase |
| Missing preload entries (step 5) | `window.electronAPI.<svc>*` calls throw at runtime |
| IPC handler not wrapped in try/catch | Unhandled exception crashes the main process |
| EC2 `forcePathStyle: true` not needed | (EC2 does not use path-style — S3 only) |
