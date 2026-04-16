import { IpcMain } from 'electron'
import {
  initDynamoDbClient,
  listTables,
  describeTable,
  createTable,
  deleteTable,
  scanItems,
  queryItems,
  putItem,
  deleteItem,
  listStreams,
  describeStream,
  getShardIterator,
  getRecords,
  updateTableStream,
} from '../services/dynamoDbService'

export function registerDynamoDbHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('dynamodb:reinit', (_event, endpoint: string, region: string) => {
    initDynamoDbClient(endpoint, region)
  })

  ipcMain.handle('dynamodb:listTables', async () => {
    try {
      const tables = await listTables()
      return { success: true, data: tables }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dynamodb:describeTable', async (_event, tableName: string) => {
    try {
      const desc = await describeTable(tableName)
      return { success: true, data: desc }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'dynamodb:createTable',
    async (
      _event,
      tableName: string,
      attributeDefinitions: any[],
      keySchema: any[],
      gsiList?: any[],
      lsiList?: any[]
    ) => {
      try {
        await createTable(tableName, attributeDefinitions, keySchema, gsiList, lsiList)
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('dynamodb:deleteTable', async (_event, tableName: string) => {
    try {
      await deleteTable(tableName)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dynamodb:scanItems', async (_event, tableName: string, limit?: number, exclusiveStartKey?: Record<string, any>) => {
    try {
      const data = await scanItems(tableName, limit, exclusiveStartKey)
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dynamodb:queryItems', async (_event, tableName: string, options: any) => {
    try {
      const items = await queryItems(tableName, options)
      return { success: true, data: items }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dynamodb:putItem', async (_event, tableName: string, item: Record<string, any>) => {
    try {
      await putItem(tableName, item)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dynamodb:deleteItem', async (_event, tableName: string, key: Record<string, any>) => {
    try {
      await deleteItem(tableName, key)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  // ── Streams ────────────────────────────────────────────────────────────────

  ipcMain.handle('dynamodb:listStreams', async (_event, tableName?: string) => {
    try {
      const data = await listStreams(tableName)
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dynamodb:describeStream', async (_event, streamArn: string) => {
    try {
      const data = await describeStream(streamArn)
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dynamodb:getShardIterator', async (
    _event,
    streamArn: string,
    shardId: string,
    iteratorType: 'TRIM_HORIZON' | 'LATEST' | 'AT_SEQUENCE_NUMBER' | 'AFTER_SEQUENCE_NUMBER',
    sequenceNumber?: string
  ) => {
    try {
      const data = await getShardIterator(streamArn, shardId, iteratorType, sequenceNumber)
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dynamodb:getRecords', async (_event, shardIterator: string, limit?: number) => {
    try {
      const data = await getRecords(shardIterator, limit)
      return { success: true, data }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dynamodb:updateTableStream', async (
    _event,
    tableName: string,
    enabled: boolean,
    viewType?: 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY'
  ) => {
    try {
      await updateTableStream(tableName, enabled, viewType)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })
}
