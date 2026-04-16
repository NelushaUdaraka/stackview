import { IpcMain } from 'electron'
import {
  initSQSClient,
  testConnection,
  listQueues,
  createQueue,
  deleteQueue,
  purgeQueue,
  getQueueAttributes,
  setQueueAttributes,
  sendMessage,
  receiveMessages,
  deleteMessage,
  getQueueTags,
} from '../services/sqsService'

export function registerSqsHandlers(
  ipcMain: IpcMain,
  onConnected: (endpoint: string, region: string) => void
): void {
  ipcMain.handle(
    'sqs:connect',
    async (_event, endpoint: string, region: string) => {
      try {
        const ok = await testConnection(endpoint, region)
        if (ok) {
          initSQSClient(endpoint, region)
          onConnected(endpoint, region)
        }
        return {
          success: ok,
          error: ok ? null : 'Could not connect to endpoint',
        }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle(
    'sqs:reinit',
    async (_event, endpoint: string, region: string) => {
      initSQSClient(endpoint, region)
    },
  )

  ipcMain.handle('sqs:listQueues', async () => {
    try {
      const urls = await listQueues()
      return { success: true, data: urls }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'sqs:createQueue',
    async (
      _event,
      queueName: string,
      isFifo: boolean,
      attributes: Record<string, string>,
    ) => {
      try {
        const url = await createQueue(queueName, isFifo, attributes)
        return { success: true, data: url }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle('sqs:deleteQueue', async (_event, queueUrl: string) => {
    try {
      await deleteQueue(queueUrl)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('sqs:purgeQueue', async (_event, queueUrl: string) => {
    try {
      await purgeQueue(queueUrl)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('sqs:getQueueAttributes', async (_event, queueUrl: string) => {
    try {
      const attrs = await getQueueAttributes(queueUrl)
      return { success: true, data: attrs }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'sqs:setQueueAttributes',
    async (_event, queueUrl: string, attributes: Record<string, string>) => {
      try {
        await setQueueAttributes(queueUrl, attributes)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle('sqs:getQueueTags', async (_event, queueUrl: string) => {
    try {
      const tags = await getQueueTags(queueUrl)
      return { success: true, data: tags }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'sqs:sendMessage',
    async (
      _event,
      queueUrl: string,
      body: string,
      delaySeconds?: number,
      messageGroupId?: string,
      messageDeduplicationId?: string,
      messageAttributes?: Record<
        string,
        { DataType: string; StringValue: string }
      >,
    ) => {
      try {
        const msgId = await sendMessage(
          queueUrl,
          body,
          delaySeconds,
          messageGroupId,
          messageDeduplicationId,
          messageAttributes,
        )
        return { success: true, data: msgId }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle(
    'sqs:receiveMessages',
    async (
      _event,
      queueUrl: string,
      maxMessages: number,
      visibilityTimeout: number,
      waitTimeSeconds: number,
    ) => {
      try {
        const messages = await receiveMessages(
          queueUrl,
          maxMessages,
          visibilityTimeout,
          waitTimeSeconds,
        )
        return { success: true, data: messages }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )

  ipcMain.handle(
    'sqs:deleteMessage',
    async (_event, queueUrl: string, receiptHandle: string) => {
      try {
        await deleteMessage(queueUrl, receiptHandle)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    },
  )
}
