# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

| Command | Purpose |
|---|---|
| `npm run dev` | electron-vite dev server with HMR across main, preload, and renderer |
| `npm run build` | Type-check + build all three processes to `out/` |
| `npx tsc --noEmit` | Type-check only — the primary quality gate |
| `npm run dist` | Build + NSIS installer to `dist/` (no signing, no publish) |
| `npm run release` | Build + installer + publish to GitHub Releases (drives `electron-updater`) |

There is **no test runner, no linter, and no formatter** configured. Type-checking is the only automated gate. Do not invent `npm test` / `npm run lint` commands. Verify behavior by running `npm run dev` and exercising the feature in the running Electron window.

## Architecture

StackView is a **three-process Electron app** wrapping the AWS SDK against a fixed LocalStack endpoint (`http://localhost:4566`). electron-vite splits each process into its own entry:

| Process | Entry | Responsibility |
|---|---|---|
| Main | [src/main/index.ts](src/main/index.ts) | Node.js — owns AWS SDK clients, registers all IPC handlers, manages auto-update |
| Preload | [src/preload/index.ts](src/preload/index.ts) | Context-bridge — exposes `window.electronAPI.<svc><Action>` methods to the renderer |
| Renderer | [src/renderer/src/App.tsx](src/renderer/src/App.tsx) | React 18 + Tailwind — tabs, NavRail, per-service Layout components |

### Per-Service Vertical Slice

Every AWS service (32 of them) follows the same shape. To add or modify a service, work across these files in lockstep:

```
src/main/services/<svc>Service.ts            ← AWS SDK client + operation functions
src/main/handlers/<svc>Handlers.ts           ← register<Svc>Handlers(ipcMain) — IPC wiring
src/preload/index.ts                         ← electronAPI.<svc>* bridge methods
src/shared/types.ts                          ← shared IPC data shapes
src/renderer/src/types.ts                    ← Service union + electronAPI interface
src/renderer/src/components/<svc>/           ← <Svc>Layout, Topbar, Sidebar, Detail, CreateModal
src/renderer/src/services/serviceConfig.ts   ← SERVICE_CONFIG metadata entry
src/renderer/src/App.tsx                     ← SERVICE_REINIT_MAP + LAYOUT_RENDERERS entries
```

`SERVICE_REINIT_MAP` and `LAYOUT_RENDERERS` in `App.tsx` are typed `Record<Service, ...>`, so missing entries are `tsc` errors. `SERVICE_CONFIG` is **not** exhaustiveness-checked — a missing entry silently removes the service from the nav rail, service picker, and metadata lookups. This is the most commonly missed step.

### Adding a New Service

Follow the 11-step checklist in [docs/adding-a-new-service.md](docs/adding-a-new-service.md). Every step exists because skipping it caused a real bug. Do not reinvent the pattern.

### IPC Naming Convention

| Layer | Pattern | Example |
|---|---|---|
| ipcMain channel | `'<svc>:<camelCaseAction>'` | `'ec2:listInstances'` |
| preload / electronAPI method | `<svc><PascalAction>` | `window.electronAPI.ec2ListInstances()` |
| reinit channel / preload | `'<svc>:reinit'` / `<svc>Reinit` | `'ec2:reinit'` / `ec2Reinit` |

All handlers wrap operations in `try/catch` and return `{ success: boolean, data?: T, error?: string }` (`IpcResult<T>`). Unhandled exceptions crash the main process — do not skip the `try/catch`.

### AWS SDK Client Initialization

Each service module keeps a single module-scoped client and exposes `init<Svc>Client(endpoint, region)`. The renderer fires the `<svc>:reinit` channel when the user changes region (orchestrated through `SERVICE_REINIT_MAP` in `App.tsx`). Hardcoded credentials are `test`/`test` — LocalStack accepts anything. The renderer never holds AWS credentials.

### Theming

CSS variables only. Themes live in [src/shared/themes.ts](src/shared/themes.ts) and are injected into a single `<style id="nexus-theme-vars">` tag at runtime by `applyTheme()` in `App.tsx` to win the cascade regardless of `@layer` ordering. Tailwind `dark:` utilities are only used by `App.tsx` to toggle the `.dark` class; component styles should reference CSS variables.

### Auto-Update

`electron-updater` publishes to GitHub Releases — config lives under `build.publish` in [package.json](package.json). The renderer subscribes to `UpdaterStatus` events; the install-and-restart action is triggered from the Settings menu.

## Gotchas

- **LocalStack-only.** The endpoint is fixed to `http://localhost:4566`. Do not generalize for real AWS — credentials, signing, and region semantics are not designed for it.
- **Windows-only build.** Only the NSIS target is wired. The macOS/Linux entries in `electron-builder` config are aspirational; building them is not part of the current workflow.
- **No tests.** Do not assume a test framework. Verify changes via `npm run dev` plus `npx tsc --noEmit`.
- **Internal name drift is intentional.** `StackView` (product), `stackview` (package), `nexus` (CSS prefix), and `NexusStack` (in `docs/adding-a-new-service.md`) coexist on purpose — do not "fix" these.
