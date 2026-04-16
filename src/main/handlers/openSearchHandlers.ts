import { IpcMain } from 'electron'
import {
  opensearchReinit,
  opensearchListDomains,
  opensearchDescribeDomain,
  opensearchCreateDomain,
  opensearchDeleteDomain,
  opensearchGetClusterHealth,
  opensearchListIndices,
  opensearchCreateIndex,
  opensearchDeleteIndex,
  opensearchGetMapping,
  opensearchSearchDocuments,
  opensearchIndexDocument,
  opensearchDeleteDocument,
} from '../services/opensearchService'

export function registerOpenSearchHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('opensearch:reinit', (_event, endpoint, region) => opensearchReinit(endpoint, region))
  ipcMain.handle('opensearch:listDomains', (_event, endpoint, region) => opensearchListDomains(endpoint, region))
  ipcMain.handle('opensearch:describeDomain', (_event, endpoint, region, domainName) => opensearchDescribeDomain(endpoint, region, domainName))
  ipcMain.handle('opensearch:createDomain', (_event, endpoint, region, params) => opensearchCreateDomain(endpoint, region, params))
  ipcMain.handle('opensearch:deleteDomain', (_event, endpoint, region, domainName) => opensearchDeleteDomain(endpoint, region, domainName))
  ipcMain.handle('opensearch:getClusterHealth', (_event, domainEndpoint) => opensearchGetClusterHealth(domainEndpoint))
  ipcMain.handle('opensearch:listIndices', (_event, domainEndpoint) => opensearchListIndices(domainEndpoint))
  ipcMain.handle('opensearch:createIndex', (_event, domainEndpoint, indexName, settings) => opensearchCreateIndex(domainEndpoint, indexName, settings))
  ipcMain.handle('opensearch:deleteIndex', (_event, domainEndpoint, indexName) => opensearchDeleteIndex(domainEndpoint, indexName))
  ipcMain.handle('opensearch:getMapping', (_event, domainEndpoint, indexName) => opensearchGetMapping(domainEndpoint, indexName))
  ipcMain.handle('opensearch:searchDocuments', (_event, domainEndpoint, indexName, query, size) => opensearchSearchDocuments(domainEndpoint, indexName, query, size))
  ipcMain.handle('opensearch:indexDocument', (_event, domainEndpoint, indexName, document, docId) => opensearchIndexDocument(domainEndpoint, indexName, document, docId))
  ipcMain.handle('opensearch:deleteDocument', (_event, domainEndpoint, indexName, docId) => opensearchDeleteDocument(domainEndpoint, indexName, docId))
}
