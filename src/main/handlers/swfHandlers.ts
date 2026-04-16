import { IpcMain } from 'electron'
import {
  initSwfClient,
  listDomains,
  registerDomain,
  describeDomain,
  deprecateDomain,
  listWorkflowTypes,
  registerWorkflowType,
  deprecateWorkflowType,
  listActivityTypes,
  registerActivityType,
  deprecateActivityType,
  listOpenExecutions,
  listClosedExecutions,
  describeExecution,
  startExecution,
  terminateExecution,
  signalExecution,
  getExecutionHistory,
  requestCancelExecution,
} from '../services/swfService'

export function registerSwfHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('swf:reinit', async (_event, endpoint: string, region: string) => {
    initSwfClient(endpoint, region)
  })

  // ── Domains ──────────────────────────────────────────────────────────────

  ipcMain.handle(
    'swf:listDomains',
    async (_event, registrationStatus: 'REGISTERED' | 'DEPRECATED' = 'REGISTERED') => {
      try {
        const data = await listDomains(registrationStatus)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:registerDomain',
    async (_event, name: string, description: string, retentionDays: string) => {
      try {
        await registerDomain(name, description, retentionDays)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('swf:describeDomain', async (_event, name: string) => {
    try {
      const data = await describeDomain(name)
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('swf:deprecateDomain', async (_event, name: string) => {
    try {
      await deprecateDomain(name)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  // ── Workflow Types ────────────────────────────────────────────────────────

  ipcMain.handle(
    'swf:listWorkflowTypes',
    async (
      _event,
      domain: string,
      registrationStatus: 'REGISTERED' | 'DEPRECATED' = 'REGISTERED'
    ) => {
      try {
        const data = await listWorkflowTypes(domain, registrationStatus)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:registerWorkflowType',
    async (
      _event,
      domain: string,
      name: string,
      version: string,
      description?: string,
      defaultTaskList?: string,
      defaultExecutionStartToCloseTimeout?: string,
      defaultTaskStartToCloseTimeout?: string
    ) => {
      try {
        await registerWorkflowType(
          domain,
          name,
          version,
          description,
          defaultTaskList,
          defaultExecutionStartToCloseTimeout,
          defaultTaskStartToCloseTimeout
        )
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:deprecateWorkflowType',
    async (_event, domain: string, name: string, version: string) => {
      try {
        await deprecateWorkflowType(domain, name, version)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  // ── Activity Types ────────────────────────────────────────────────────────

  ipcMain.handle(
    'swf:listActivityTypes',
    async (
      _event,
      domain: string,
      registrationStatus: 'REGISTERED' | 'DEPRECATED' = 'REGISTERED'
    ) => {
      try {
        const data = await listActivityTypes(domain, registrationStatus)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:registerActivityType',
    async (
      _event,
      domain: string,
      name: string,
      version: string,
      description?: string,
      defaultTaskList?: string,
      defaultScheduleToCloseTimeout?: string,
      defaultScheduleToStartTimeout?: string,
      defaultStartToCloseTimeout?: string,
      defaultHeartbeatTimeout?: string
    ) => {
      try {
        await registerActivityType(
          domain,
          name,
          version,
          description,
          defaultTaskList,
          defaultScheduleToCloseTimeout,
          defaultScheduleToStartTimeout,
          defaultStartToCloseTimeout,
          defaultHeartbeatTimeout
        )
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:deprecateActivityType',
    async (_event, domain: string, name: string, version: string) => {
      try {
        await deprecateActivityType(domain, name, version)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  // ── Executions ────────────────────────────────────────────────────────────

  ipcMain.handle('swf:listOpenExecutions', async (_event, domain: string) => {
    try {
      const data = await listOpenExecutions(domain)
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('swf:listClosedExecutions', async (_event, domain: string) => {
    try {
      const data = await listClosedExecutions(domain)
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'swf:describeExecution',
    async (_event, domain: string, workflowId: string, runId: string) => {
      try {
        const data = await describeExecution(domain, workflowId, runId)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:startExecution',
    async (
      _event,
      domain: string,
      workflowId: string,
      workflowName: string,
      workflowVersion: string,
      input?: string,
      tagList?: string[],
      executionStartToCloseTimeout?: string,
      taskStartToCloseTimeout?: string
    ) => {
      try {
        const data = await startExecution(
          domain,
          workflowId,
          workflowName,
          workflowVersion,
          input,
          tagList,
          executionStartToCloseTimeout,
          taskStartToCloseTimeout
        )
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:terminateExecution',
    async (_event, domain: string, workflowId: string, runId: string, reason?: string) => {
      try {
        await terminateExecution(domain, workflowId, runId, reason)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:signalExecution',
    async (
      _event,
      domain: string,
      workflowId: string,
      runId: string,
      signalName: string,
      input?: string
    ) => {
      try {
        await signalExecution(domain, workflowId, runId, signalName, input)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:getExecutionHistory',
    async (_event, domain: string, workflowId: string, runId: string) => {
      try {
        const data = await getExecutionHistory(domain, workflowId, runId)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'swf:requestCancelExecution',
    async (_event, domain: string, workflowId: string, runId: string) => {
      try {
        await requestCancelExecution(domain, workflowId, runId)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )
}
