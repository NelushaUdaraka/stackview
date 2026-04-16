import { IpcMain } from 'electron'
import {
  initSfnClient,
  listStateMachines,
  createStateMachine,
  describeStateMachine,
  updateStateMachine,
  deleteStateMachine,
  startExecution,
  listExecutions,
  describeExecution,
  stopExecution,
  getExecutionHistory,
  listTagsForResource,
  tagResource,
  untagResource,
} from '../services/sfnService'

export function registerSfnHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('sfn:reinit', (_event, endpoint: string, region: string) => {
    initSfnClient(endpoint, region)
  })

  // ── State Machines ────────────────────────────────────────────────────────

  ipcMain.handle('sfn:listStateMachines', async () => {
    try {
      const data = await listStateMachines()
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'sfn:createStateMachine',
    async (
      _event,
      name: string,
      definition: string,
      roleArn: string,
      type: 'STANDARD' | 'EXPRESS',
      tags?: Record<string, string>
    ) => {
      try {
        const data = await createStateMachine(name, definition, roleArn, type, tags)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'sfn:describeStateMachine',
    async (_event, stateMachineArn: string) => {
      try {
        const data = await describeStateMachine(stateMachineArn)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'sfn:updateStateMachine',
    async (
      _event,
      stateMachineArn: string,
      definition?: string,
      roleArn?: string
    ) => {
      try {
        await updateStateMachine(stateMachineArn, definition, roleArn)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'sfn:deleteStateMachine',
    async (_event, stateMachineArn: string) => {
      try {
        await deleteStateMachine(stateMachineArn)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  // ── Executions ────────────────────────────────────────────────────────────

  ipcMain.handle(
    'sfn:startExecution',
    async (_event, stateMachineArn: string, name?: string, input?: string) => {
      try {
        const data = await startExecution(stateMachineArn, name, input)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'sfn:listExecutions',
    async (
      _event,
      stateMachineArn: string,
      statusFilter?: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED'
    ) => {
      try {
        const data = await listExecutions(stateMachineArn, statusFilter)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'sfn:describeExecution',
    async (_event, executionArn: string) => {
      try {
        const data = await describeExecution(executionArn)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'sfn:stopExecution',
    async (_event, executionArn: string, error?: string, cause?: string) => {
      try {
        await stopExecution(executionArn, error, cause)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'sfn:getExecutionHistory',
    async (_event, executionArn: string) => {
      try {
        const data = await getExecutionHistory(executionArn)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  // ── Tags ──────────────────────────────────────────────────────────────────

  ipcMain.handle(
    'sfn:listTagsForResource',
    async (_event, resourceArn: string) => {
      try {
        const data = await listTagsForResource(resourceArn)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'sfn:tagResource',
    async (_event, resourceArn: string, tags: Record<string, string>) => {
      try {
        await tagResource(resourceArn, tags)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'sfn:untagResource',
    async (_event, resourceArn: string, tagKeys: string[]) => {
      try {
        await untagResource(resourceArn, tagKeys)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )
}
