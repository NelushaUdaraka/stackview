import { IpcMain } from 'electron'
import {
  initSnsClient,
  listTopics,
  createTopic as snsCreateTopic,
  deleteTopic as snsDeleteTopic,
  listSubscriptionsByTopic,
  subscribe,
  unsubscribe,
  publish,
} from '../services/snsService'

export function registerSnsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('sns:reinit', (_event, endpoint: string, region: string) => {
    initSnsClient(endpoint, region)
    return { success: true }
  })

  ipcMain.handle('sns:listTopics', async () => {
    try { return { success: true, data: await listTopics() }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sns:createTopic', async (_event, name: string) => {
    try { return { success: true, data: await snsCreateTopic(name) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sns:deleteTopic', async (_event, topicArn: string) => {
    try { await snsDeleteTopic(topicArn); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sns:listSubscriptionsByTopic', async (_event, topicArn: string) => {
    try { return { success: true, data: await listSubscriptionsByTopic(topicArn) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sns:subscribe', async (_event, topicArn: string, protocol: string, endpoint: string) => {
    try { return { success: true, data: await subscribe(topicArn, protocol, endpoint) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sns:unsubscribe', async (_event, subscriptionArn: string) => {
    try { await unsubscribe(subscriptionArn); return { success: true }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })

  ipcMain.handle('sns:publish', async (_event, topicArn: string, message: string, subject?: string) => {
    try { return { success: true, data: await publish(topicArn, message, subject) }; }
    catch (err: unknown) { return { success: false, error: String(err) }; }
  })
}
