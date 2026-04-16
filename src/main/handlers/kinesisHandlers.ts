import { IpcMain } from 'electron'
import {
  kinesisListStreams,
  kinesisDescribeStream,
  kinesisCreateStream,
  kinesisDeleteStream,
  kinesisReinit,
} from '../services/kinesisService'

export function registerKinesisHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('kinesis:reinit', (_event, endpoint, region) => kinesisReinit(endpoint, region))
  ipcMain.handle('kinesis:listStreams', (_event, endpoint, region) => kinesisListStreams(endpoint, region))
  ipcMain.handle('kinesis:describeStream', (_event, endpoint, region, streamName) => kinesisDescribeStream(endpoint, region, streamName))
  ipcMain.handle('kinesis:createStream', (_event, endpoint, region, params) => kinesisCreateStream(endpoint, region, params))
  ipcMain.handle('kinesis:deleteStream', (_event, endpoint, region, streamName) => kinesisDeleteStream(endpoint, region, streamName))
}
