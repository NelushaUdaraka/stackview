import { IpcMain } from 'electron'
import {
  initSupportClient,
  describeCases,
  createCase,
  resolveCase,
  describeTrustedAdvisorChecks,
  refreshTrustedAdvisorCheck,
} from '../services/supportService'

export function registerSupportHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(
    'support:reinit',
    (_event, endpoint: string, region: string) => {
      initSupportClient(endpoint, region)
    }
  )

  ipcMain.handle(
    'support:describeCases',
    async (_event, includeResolvedCases?: boolean) => {
      try {
        const data = await describeCases(includeResolvedCases ?? false)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'support:createCase',
    async (
      _event,
      subject: string,
      communicationBody: string,
      serviceCode?: string,
      severityCode?: string,
      categoryCode?: string,
      language?: string
    ) => {
      try {
        const data = await createCase(
          subject,
          communicationBody,
          serviceCode,
          severityCode,
          categoryCode,
          language
        )
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('support:resolveCase', async (_event, caseId: string) => {
    try {
      const data = await resolveCase(caseId)
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'support:describeTrustedAdvisorChecks',
    async (_event, language?: string) => {
      try {
        const data = await describeTrustedAdvisorChecks(language)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'support:refreshTrustedAdvisorCheck',
    async (_event, checkId: string) => {
      try {
        const data = await refreshTrustedAdvisorCheck(checkId)
        return { success: true, data }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )
}
