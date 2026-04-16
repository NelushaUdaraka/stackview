import { IpcMain } from 'electron'
import {
  reinitRedshift,
  redshiftListClusters,
  redshiftDescribeCluster,
  redshiftCreateCluster,
  redshiftDeleteCluster,
} from '../services/redshiftService'

export function registerRedshiftHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('redshift:reinit', (_event, endpoint, region) => reinitRedshift(endpoint, region))
  ipcMain.handle('redshift:listClusters', () => redshiftListClusters())
  ipcMain.handle('redshift:describeCluster', (_event, clusterId) => redshiftDescribeCluster(clusterId))
  ipcMain.handle('redshift:createCluster', (_event, params) => redshiftCreateCluster(params))
  ipcMain.handle('redshift:deleteCluster', (_event, clusterId) => redshiftDeleteCluster(clusterId))
}
