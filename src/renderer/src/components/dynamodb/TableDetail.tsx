import { useState, useEffect, useRef, useCallback } from 'react'
import { Database, Settings, Trash2, Check, AlertTriangle, FileJson, Loader2, Play, Plus, Maximize2, Search, Filter, X, Copy, CheckCircle2, ChevronRight, ChevronLeft, Radio, RefreshCw, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'
import type { DynamoItem, DynamoQueryOptions, DynamoStreamShard, DynamoStreamRecord } from '../../types'
import PutItemModal from './PutItemModal'
import ViewItemModal from './ViewItemModal'

interface Props {
  tableName: string
  onDeleted: () => void
}

type Tab = 'items' | 'overview' | 'streams'

export default function TableDetail({ tableName, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setActiveTab('items')
    setConfirmDelete(false)
  }, [tableName])

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setDeleting(true)
    const result = await window.electronAPI.dynamoDbDeleteTable(tableName)
    setDeleting(false)
    if (result.success) {
      onDeleted()
    } else {
      showToast('error', result.error ?? 'Failed to delete table')
      setConfirmDelete(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'items', label: 'Items', icon: <FileJson size={13} /> },
    { id: 'overview', label: 'Overview', icon: <Settings size={13} /> },
    { id: 'streams', label: 'Streams', icon: <Radio size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full relative">
      <div
        className="px-5 pt-4 pb-0 border-b border-theme shrink-0"
        style={{ backgroundColor: 'rgb(var(--bg-base))' }}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(139 92 246 / 0.1)' }}>
              <Database size={18} style={{ color: 'rgb(139 92 246)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-1 truncate">{tableName}</h2>
              <p className="text-xs text-3 mt-0.5 font-mono">DynamoDB Table</p>
            </div>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors shrink-0
              ${confirmDelete
                ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                : 'btn-ghost text-red-600 dark:text-red-400 hover:bg-red-500/10'
              }`}
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {confirmDelete ? 'Confirm Delete' : 'Delete Table'}
          </button>
        </div>

        <div className="flex items-center -mb-px">
          {tabs.map((tab) => (
            <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                 ${activeTab === tab.id
                   ? 'border-violet-500 text-violet-600 dark:text-violet-300'
                   : 'border-transparent text-3 hover:text-1'
                 }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'items' && <ItemsTab tableName={tableName} showToast={showToast} />}
        {activeTab === 'overview' && <OverviewTab tableName={tableName} showToast={showToast} />}
        {activeTab === 'streams' && <StreamsTab tableName={tableName} showToast={showToast} />}
      </div>
    </div>
  )
}

function OverviewTab({ tableName, showToast }: { tableName: string, showToast: any }) {
  const [desc, setDesc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const res = await window.electronAPI.dynamoDbDescribeTable(tableName)
      if (active) {
        if (res.success) setDesc(res.data)
        else showToast('error', res.error || 'Failed to describe table')
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [tableName])

  if (loading) {
    return <div className="flex items-center justify-center p-8 h-full"><Loader2 size={24} className="animate-spin text-3" /></div>
  }

  if (!desc) return null

  return (
    <div className="p-5 overflow-y-auto h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4 space-y-3 border-theme">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Identity</p>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Table Name</p>
            <p className="text-sm font-mono text-1">{desc.TableName}</p>
          </div>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Status</p>
            <p className="text-xs font-semibold text-emerald-500">{desc.TableStatus}</p>
          </div>
          <div className="group relative">
            <p className="text-[10px] text-3 mb-0.5">ARN</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-mono text-2 break-all">{desc.TableArn}</p>
              <button 
                onClick={() => handleCopy(desc.TableArn)} 
                className="opacity-0 group-hover:opacity-100 p-1 text-3 hover:text-1 transition-colors bg-raised rounded"
              >
                {copied ? <CheckCircle2 size={12} className="text-emerald-500"/> : <Copy size={12}/>}
              </button>
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-4 border-theme">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Key Schema</p>
          {desc.KeySchema?.map((k: any) => {
            const attr = desc.AttributeDefinitions?.find((a: any) => a.AttributeName === k.AttributeName)
            return (
              <div key={k.AttributeName} className="flex flex-col">
                <span className="text-[10px] text-3 mb-0.5">{k.KeyType === 'HASH' ? 'Partition Key' : 'Sort Key'} ({attr?.AttributeType})</span>
                <span className="text-sm font-mono text-1">{k.AttributeName}</span>
              </div>
            )
          })}
        </div>

        <div className="card p-4 space-y-3 border-theme">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider">Metrics</p>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Item Count</p>
            <p className="text-sm text-1">{desc.ItemCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Table Size (Bytes)</p>
            <p className="text-sm text-1">{desc.TableSizeBytes}</p>
          </div>
          <div>
            <p className="text-[10px] text-3 mb-0.5">Billing Mode</p>
            <p className="text-sm text-1">{desc.BillingModeSummary?.BillingMode || 'PROVISIONED'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FilterCondition {
  id: string
  attribute: string
  type: 'String' | 'Number' | 'Boolean' | 'Null'
  operator: string
  value: string
}

function ItemsTab({ tableName, showToast }: { tableName: string, showToast: any }) {
  const [items, setItems] = useState<DynamoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showPut, setShowPut] = useState(false)
  const [viewItem, setViewItem] = useState<DynamoItem | null>(null)
  
  const [operation, setOperation] = useState<'SCAN'|'QUERY'>('SCAN')
  const [selectedIndex, setSelectedIndex] = useState<string>('')
  
  const [pkValue, setPkValue] = useState('')
  const [skActive, setSkActive] = useState(false)
  const [skOperator, setSkOperator] = useState('=')
  const [skValue, setSkValue] = useState('')
  const [skValue2, setSkValue2] = useState('')
  
  const [filters, setFilters] = useState<FilterCondition[]>([])
  
  const [indexes, setIndexes] = useState<{name: string, label: string, pk: string, pkType: string, sk?: string, skType?: string}[]>([])
  const [activeIdx, setActiveIdx] = useState<{name: string, label: string, pk: string, pkType: string, sk?: string, skType?: string} | null>(null)
  
  const [columns, setColumns] = useState<string[]>([])
  const [allExtractedCols, setAllExtractedCols] = useState<string[]>([])

  // Column resize state
  const [colWidths, setColWidths] = useState<Record<string, number>>({})
  const resizingCol = useRef<string | null>(null)
  const startX = useRef(0)
  const startW = useRef(0)

  const handleResizeStart = useCallback((col: string, e: React.MouseEvent) => {
    e.preventDefault()
    resizingCol.current = col
    startX.current = e.clientX
    startW.current = colWidths[col] || 150

    const onMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX.current
      const newW = Math.max(60, startW.current + diff)
      setColWidths(prev => ({ ...prev, [resizingCol.current!]: newW }))
    }
    const onUp = () => {
      resizingCol.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [colWidths])

  // Pagination Config
  const [limit, setLimit] = useState<number>(100)
  const [pageHistory, setPageHistory] = useState<(Record<string, any> | undefined)[]>([undefined])
  const [currentPage, setCurrentPage] = useState(0)
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<Record<string, any> | undefined>(undefined)

  const [copiedCell, setCopiedCell] = useState<{itemIdx: number, col: string} | null>(null)

  const handleCopyCell = (text: string, itemIdx: number, col: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCell({itemIdx, col})
    setTimeout(() => setCopiedCell(null), 2000)
  }

  useEffect(() => {
    setOperation('SCAN')
    setSelectedIndex('')
    setPkValue('')
    setSkActive(false)
    setSkValue('')
    setFilters([])
    setItems([])
    
    const fetchDesc = async () => {
      const res = await window.electronAPI.dynamoDbDescribeTable(tableName)
      if (res.success && res.data) {
        const idx: any[] = []
        const keys = res.data.KeySchema || []
        const pk = keys.find((k:any) => k.KeyType === 'HASH')?.AttributeName
        const sk = keys.find((k:any) => k.KeyType === 'RANGE')?.AttributeName
        const getAttrType = (name: string) => res.data.AttributeDefinitions?.find((a:any) => a.AttributeName === name)?.AttributeType || 'S'
        
        idx.push({ name: '', label: 'Table', pk, pkType: getAttrType(pk), sk, skType: sk ? getAttrType(sk) : undefined })
        
        res.data.GlobalSecondaryIndexes?.forEach((g: any) => {
           const gPk = g.KeySchema?.find((k:any) => k.KeyType === 'HASH')?.AttributeName
           const gSk = g.KeySchema?.find((k:any) => k.KeyType === 'RANGE')?.AttributeName
           idx.push({ name: g.IndexName, label: `GSI: ${g.IndexName}`, pk: gPk, pkType: getAttrType(gPk), sk: gSk, skType: gSk ? getAttrType(gSk) : undefined })
        })
        res.data.LocalSecondaryIndexes?.forEach((l: any) => {
           const lPk = l.KeySchema?.find((k:any) => k.KeyType === 'HASH')?.AttributeName
           const lSk = l.KeySchema?.find((k:any) => k.KeyType === 'RANGE')?.AttributeName
           idx.push({ name: l.IndexName, label: `LSI: ${l.IndexName}`, pk: lPk, pkType: getAttrType(lPk), sk: lSk, skType: lSk ? getAttrType(lSk) : undefined })
        })
        setIndexes(idx)
        setActiveIdx(idx[0])
        executeRun(idx[0], undefined, true)
      }
    }
    fetchDesc()
  }, [tableName])
  
  useEffect(() => {
     const i = indexes.find(x => x.name === selectedIndex)
     if (i) setActiveIdx(i)
  }, [selectedIndex, indexes])

  const executeRun = async (currentIdx = activeIdx, startKey?: Record<string, any>, resetPages = false) => {
    if (!currentIdx) return
    setLoading(true)
    
    let keyCondExp: string | undefined = undefined
    let filterExp: string | undefined = undefined
    let attrNames: Record<string, string> = {}
    let attrValues: Record<string, any> = {}

    if (resetPages) {
       setPageHistory([undefined])
       setCurrentPage(0)
    }

    const inferVal = (v: string, type: string) => {
      if (type === 'N' || type === 'Number') return Number(v)
      if (type === 'Boolean') return v === 'true'
      if (type === 'Null') return null
      return v
    }

    try {
      if (operation === 'QUERY') {
        if (!pkValue.trim()) throw new Error("Partition Key value is required for Query")

        attrNames['#pk'] = currentIdx.pk
        attrValues[':pk'] = inferVal(pkValue, currentIdx.pkType)
        const conds = ['#pk = :pk']

        if (currentIdx.sk && skActive && skValue.trim()) {
           attrNames['#sk'] = currentIdx.sk
           if (skOperator === 'between') {
             attrValues[':sk1'] = inferVal(skValue, currentIdx.skType!)
             attrValues[':sk2'] = inferVal(skValue2, currentIdx.skType!)
             conds.push(`#sk BETWEEN :sk1 AND :sk2`)
           } else if (skOperator === 'begins_with') {
             attrValues[':sk'] = inferVal(skValue, 'S')
             conds.push(`begins_with(#sk, :sk)`)
           } else {
             attrValues[':sk'] = inferVal(skValue, currentIdx.skType!)
             conds.push(`#sk ${skOperator} :sk`)
           }
        }
        keyCondExp = conds.join(' AND ')
      }

      if (filters.length > 0) {
        const fConds: string[] = []
        filters.forEach((f, i) => {
          if (!f.attribute.trim()) return
          const aKey = `#f${i}`
          const vKey = `:f${i}`
          attrNames[aKey] = f.attribute
          
          if (f.operator === 'exists') fConds.push(`attribute_exists(${aKey})`)
          else if (f.operator === 'not_exists') fConds.push(`attribute_not_exists(${aKey})`)
          else if (f.operator === 'begins_with') {
            attrValues[vKey] = f.value
            fConds.push(`begins_with(${aKey}, ${vKey})`)
          } else if (f.operator === 'contains') {
            attrValues[vKey] = f.value
            fConds.push(`contains(${aKey}, ${vKey})`)
          } else {
            attrValues[vKey] = inferVal(f.value, f.type)
            fConds.push(`${aKey} ${f.operator} ${vKey}`)
          }
        })
        if (fConds.length > 0) filterExp = fConds.join(' AND ')
      }

      const options: DynamoQueryOptions = {
        operation,
        indexName: selectedIndex || undefined,
        keyConditionExpression: keyCondExp,
        filterExpression: filterExp,
        expressionAttributeNames: Object.keys(attrNames).length > 0 ? attrNames : undefined,
        expressionAttributeValues: Object.keys(attrValues).length > 0 ? attrValues : undefined,
        limit: limit,
        exclusiveStartKey: startKey
      }

      const res = await window.electronAPI.dynamoDbQueryItems(tableName, options)
      if (res.success && res.data) {
        setItems(res.data.items)
        setLastEvaluatedKey(res.data.lastEvaluatedKey)

        const allKeys = new Set<string>(allExtractedCols)
        res.data.items.forEach(item => Object.keys(item).forEach(k => allKeys.add(k)))
        setAllExtractedCols(Array.from(allKeys))
        
        let pks: string[] = []
        if (currentIdx.pk) pks.push(currentIdx.pk)
        if (currentIdx.sk) pks.push(currentIdx.sk)
        
        const restKeys = Array.from(allKeys).filter(k => !pks.includes(k)).sort()
        setColumns([...pks, ...restKeys])
      } else {
        throw new Error(res.error || 'Failed to query items')
      }
    } catch(e: any) {
       showToast('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (item: DynamoItem) => {
    const tableIdx = indexes[0]
    if (!tableIdx || !tableIdx.pk) {
      showToast('error', 'Cannot determine table primary keys to delete item.')
      return
    }
    const keyPayload: Record<string, any> = { [tableIdx.pk]: item[tableIdx.pk] }
    if (tableIdx.sk && item[tableIdx.sk] !== undefined) {
       keyPayload[tableIdx.sk] = item[tableIdx.sk]
    }
    const res = await window.electronAPI.dynamoDbDeleteItem(tableName, keyPayload)
    if (res.success) {
      showToast('success', 'Item deleted')
      executeRun(activeIdx, pageHistory[currentPage])
      if (viewItem && viewItem[tableIdx.pk] === item[tableIdx.pk]) setViewItem(null)
    } else {
      showToast('error', res.error || 'Failed to delete item')
    }
  }

  const addFilter = () => {
    setFilters([...filters, {
      id: Math.random().toString(36).substr(2, 9),
      attribute: '',
      type: 'String',
      operator: '=',
      value: ''
    }])
  }

  return (
    <div className="flex flex-col h-full bg-app overflow-hidden relative">
      <datalist id="extractedCols">
        {allExtractedCols.map(c => <option key={c} value={c} />)}
      </datalist>

      {/* Visual Query Builder */}
      <div className="border-b border-theme shrink-0 flex flex-col bg-base z-10 shadow-sm relative">
         <div className="p-4 flex flex-col gap-4 max-h-[40vh] overflow-y-auto">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-raised rounded-lg p-1 border border-theme">
                 <button 
                  onClick={() => setOperation('SCAN')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${operation === 'SCAN' ? 'bg-base shadow-sm text-1' : 'text-3 hover:text-2'}`}
                 >
                   Scan
                 </button>
                 <button 
                  onClick={() => setOperation('QUERY')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${operation === 'QUERY' ? 'bg-base shadow-sm text-1' : 'text-3 hover:text-2'}`}
                 >
                   Query
                 </button>
              </div>
              
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-4 uppercase tracking-wider">Index</span>
                 <select className="input-base text-xs py-1.5 pl-3 pr-8 min-w-[200px]" value={selectedIndex} onChange={e => setSelectedIndex(e.target.value)}>
                   {indexes.map(idx => (
                     <option key={idx.name || 'table'} value={idx.name}>{idx.label}</option>
                   ))}
                 </select>
              </div>

              <div className="flex-1" />

              <button onClick={() => setShowPut(true)} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
                   <Plus size={13} className="text-violet-500"/> Create Item
              </button>
              <button 
                onClick={() => executeRun(activeIdx, undefined, true)} 
                disabled={loading} 
                className="btn-primary text-xs py-1.5 px-6 gap-2 text-white" 
                style={{ backgroundColor: 'rgb(139 92 246)' }}
              >
                   {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} className="fill-current" />}
                   Run
              </button>
            </div>

            {operation === 'QUERY' && activeIdx && (
              <div className="flex flex-col gap-3 p-3 rounded-xl border border-theme bg-raised/30">
                <span className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Key Condition (Required)</span>
                
                <div className="flex items-center gap-3 w-full max-w-2xl bg-base p-2 rounded-lg border border-theme">
                  <div className="text-xs font-semibold text-1 bg-raised px-2 py-1 rounded w-32 truncate" title={activeIdx.pk}>{activeIdx.pk}</div>
                  <span className="text-xs text-3 w-8 text-center">=</span>
                  <input type="text" className="input-base text-xs py-1 flex-1" placeholder={`Enter ${activeIdx.pkType} value...`} value={pkValue} onChange={e => setPkValue(e.target.value)} />
                </div>

                {activeIdx.sk && (
                  <div className="flex items-center gap-3 w-full max-w-2xl bg-base p-2 rounded-lg border border-theme">
                    <input type="checkbox" checked={skActive} onChange={e => setSkActive(e.target.checked)} className="rounded border-theme bg-base text-violet-500 focus:ring-violet-500"/>
                    <div className="text-xs font-semibold text-1 bg-raised px-2 py-1 rounded w-32 truncate" title={activeIdx.sk}>{activeIdx.sk}</div>
                    <select className="input-base text-xs py-1 w-28" value={skOperator} onChange={e => setSkOperator(e.target.value)} disabled={!skActive}>
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="<=">&lt;=</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&gt;=</option>
                      <option value="begins_with">begins_with</option>
                      <option value="between">between</option>
                    </select>
                    <input type="text" className="input-base text-xs py-1 flex-1 min-w-0" placeholder="Value..." value={skValue} onChange={e => setSkValue(e.target.value)} disabled={!skActive} />
                    {skOperator === 'between' && (
                       <>
                         <span className="text-xs text-3">and</span>
                         <input type="text" className="input-base text-xs py-1 flex-1 min-w-0" placeholder="Value 2..." value={skValue2} onChange={e => setSkValue2(e.target.value)} disabled={!skActive} />
                       </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold text-4 uppercase tracking-wider">Filters (Optional)</span>
                 <button onClick={addFilter} className="flex items-center gap-1 text-[10px] uppercase font-bold text-violet-500 hover:text-violet-400 border border-transparent hover:border-violet-500/30 px-2 py-1 rounded transition-all">
                   <Plus size={12}/> Add filter
                 </button>
              </div>
              
              {filters.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2 p-1.5 rounded-lg border border-theme bg-base w-full overflow-x-auto">
                  <div className="relative flex-1 min-w-[200px]">
                    <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3" />
                    <input type="text" list="extractedCols" className="input-base text-xs py-1.5 pl-7 w-full" placeholder="Attribute name" value={f.attribute} onChange={e => {
                      const newF = [...filters]; newF[i].attribute = e.target.value; setFilters(newF);
                    }}/>
                  </div>
                  <select className="input-base text-xs py-1.5 w-24 shrink-0" value={f.type} onChange={e => {
                      const newF = [...filters]; newF[i].type = e.target.value as any; setFilters(newF);
                  }}>
                    <option value="String">String</option>
                    <option value="Number">Number</option>
                    <option value="Boolean">Boolean</option>
                    <option value="Null">Null</option>
                  </select>
                  <select className="input-base text-xs py-1.5 w-32 shrink-0" value={f.operator} onChange={e => {
                      const newF = [...filters]; newF[i].operator = e.target.value; setFilters(newF);
                  }}>
                    <option value="=">=</option><option value="<>">&lt;&gt;</option>
                    <option value="<">&lt;</option><option value="<=">&lt;=</option>
                    <option value=">">&gt;</option><option value=">=">&gt;=</option>
                    <option value="begins_with">begins_with</option>
                    <option value="contains">contains</option>
                    <option value="exists">exists</option>
                    <option value="not_exists">not exists</option>
                  </select>
                  {f.operator !== 'exists' && f.operator !== 'not_exists' && (
                    <input type="text" className="input-base text-xs py-1.5 flex-1 min-w-[150px]" placeholder="Value..." value={f.value} onChange={e => {
                        const newF = [...filters]; newF[i].value = e.target.value; setFilters(newF);
                    }}/>
                  )}
                  <button onClick={() => setFilters(filters.filter(x => x.id !== f.id))} className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
         </div>
      </div>

      {/* Datagrid */}
      <div className="flex-1 overflow-auto bg-app relative z-0">
        {items.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-3 h-full">
            <Search size={32} className="mb-3 opacity-20" />
            <span className="text-sm font-semibold text-2">No items found</span>
            <span className="text-xs max-w-xs mt-1 leading-relaxed">Adjust your scan or query filters above and run again, or put a new item.</span>
          </div>
        ) : (
          <table className="text-left border-collapse pb-16" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
            <colgroup>
              {columns.map(k => (
                <col key={k} style={{ width: colWidths[k] || 150 }} />
              ))}
              <col style={{ width: 80 }} />
            </colgroup>
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.95)', backdropFilter: 'blur(4px)' }}>
              <tr>
                {columns.map(k => (
                  <th key={k} className="border-b border-theme relative select-none" style={{ width: colWidths[k] || 150 }}>
                    <div className="px-4 py-3 text-[10px] font-bold text-4 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                      {k} 
                      {activeIdx?.pk === k && <span className="text-violet-500">(PK)</span>} 
                      {activeIdx?.sk === k && <span className="text-violet-500">(SK)</span>}
                    </div>
                    {/* Drag resize handle */}
                    <div
                      onMouseDown={(e) => handleResizeStart(k, e)}
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-violet-500/40 transition-colors z-20"
                      style={{ touchAction: 'none' }}
                    />
                  </th>
                ))}
                <th className="px-4 py-3 text-[10px] font-bold text-4 uppercase tracking-wider border-b border-theme text-right sticky right-0" style={{ backgroundColor: 'rgb(var(--bg-raised))', width: 80 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-raised/30 transition-colors group/row">
                  {columns.map(k => {
                      const val = item[k]
                      let renderStr = '-'
                      if (val !== undefined && val !== null) {
                        renderStr = typeof val === 'object' ? JSON.stringify(val) : String(val)
                      }
                      return (
                        <td key={k} className="px-4 py-2 text-xs font-mono text-2 relative group/cell overflow-hidden" style={{ maxWidth: colWidths[k] || 150 }}>
                          <div className="flex items-center justify-between gap-2">
                             <span className="truncate" title={renderStr}>{renderStr}</span>
                             {renderStr !== '-' && (
                               <button 
                                 onClick={() => handleCopyCell(renderStr, idx, k)}
                                 className="opacity-0 group-hover/cell:opacity-100 p-1 rounded hover:bg-theme text-3 hover:text-1 transition-all shrink-0"
                                 title="Copy value"
                               >
                                 {copiedCell?.itemIdx === idx && copiedCell?.col === k ? <CheckCircle2 size={12} className="text-emerald-500"/> : <Copy size={12}/>}
                               </button>
                             )}
                          </div>
                        </td>
                      )
                  })}
                  <td className="px-4 py-2 text-right sticky right-0 flex items-center justify-end gap-1" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
                      <button onClick={() => setViewItem(item)} className="p-1.5 rounded-md text-3 hover:text-violet-500 hover:bg-violet-500/10 transition-colors opacity-0 group-hover/row:opacity-100" title="View Full Item">
                        <Maximize2 size={13} />
                      </button>
                      <button onClick={() => handleDeleteItem(item)} className="p-1.5 rounded-md text-3 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover/row:opacity-100" title="Delete Item">
                        <Trash2 size={13} />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-theme p-3 flex items-center justify-between z-20" style={{ backgroundColor: 'rgb(var(--bg-base) / 0.95)', backdropFilter: 'blur(8px)' }}>
         <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-2">Limit:</span>
            <select className="input-base text-xs py-1 pl-2 pr-6" value={limit} onChange={e => setLimit(Number(e.target.value))}>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
         </div>

         <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const prevPage = currentPage - 1
                setCurrentPage(prevPage)
                executeRun(activeIdx, pageHistory[prevPage])
              }} 
              disabled={currentPage === 0 || loading}
              className="btn-ghost flex items-center gap-1.5 text-xs py-1 px-3"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            <span className="text-xs font-mono text-3">Page {currentPage + 1}</span>
            <button 
              onClick={() => {
                 const nextPage = currentPage + 1
                 if (pageHistory.length <= nextPage) {
                   setPageHistory([...pageHistory, lastEvaluatedKey])
                 }
                 setCurrentPage(nextPage)
                 executeRun(activeIdx, lastEvaluatedKey)
              }} 
              disabled={!lastEvaluatedKey || loading}
              className="btn-ghost flex items-center gap-1.5 text-xs py-1 px-3"
            >
              Next <ChevronRight size={13} />
            </button>
         </div>
      </div>

      {showPut && (
        <PutItemModal 
          tableName={tableName} 
          onClose={() => setShowPut(false)} 
          onCreated={() => { setShowPut(false); executeRun(activeIdx, undefined, true); showToast('success', 'Item written successfully') }} 
        />
      )}

      {viewItem && (
        <ViewItemModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onDelete={() => handleDeleteItem(viewItem)}
        />
      )}
    </div>
  )
}

// ── Streams Tab ───────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  INSERT: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  MODIFY: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  REMOVE: 'text-red-500 bg-red-500/10 border-red-500/20',
}

function RecordRow({ record }: { record: DynamoStreamRecord }) {
  const [expanded, setExpanded] = useState(false)
  const color = EVENT_COLORS[record.eventName ?? ''] ?? 'text-3 bg-raised border-theme'
  return (
    <div className="border-b border-theme last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-raised transition-colors"
      >
        {expanded ? <ChevronDown size={12} className="text-4 shrink-0" /> : <ChevronRight size={12} className="text-4 shrink-0" />}
        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${color} shrink-0`}>
          {record.eventName ?? '—'}
        </span>
        <span className="text-[10px] font-mono text-3 truncate flex-1">{record.sequenceNumber ?? '—'}</span>
        <span className="text-[10px] text-4 shrink-0">{record.approximateCreationDateTime ? new Date(record.approximateCreationDateTime).toLocaleTimeString() : ''}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {record.keys && (
            <div>
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Keys</p>
              <pre className="text-[10px] font-mono text-2 bg-raised rounded p-2 overflow-x-auto border border-theme">{JSON.stringify(record.keys, null, 2)}</pre>
            </div>
          )}
          {record.newImage && (
            <div>
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">New Image</p>
              <pre className="text-[10px] font-mono text-2 bg-raised rounded p-2 overflow-x-auto border border-theme">{JSON.stringify(record.newImage, null, 2)}</pre>
            </div>
          )}
          {record.oldImage && (
            <div>
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider mb-1">Old Image</p>
              <pre className="text-[10px] font-mono text-2 bg-raised rounded p-2 overflow-x-auto border border-theme">{JSON.stringify(record.oldImage, null, 2)}</pre>
            </div>
          )}
          <p className="text-[10px] font-mono text-4">Event ID: {record.eventId ?? '—'} · Size: {record.sizeBytes ?? '—'} bytes</p>
        </div>
      )}
    </div>
  )
}

function StreamsTab({ tableName, showToast }: { tableName: string; showToast: (t: 'success' | 'error', m: string) => void }) {
  const [streamInfo, setStreamInfo] = useState<{
    streamArn: string; streamStatus?: string; streamViewType?: string; creationDateTime?: string; shards: DynamoStreamShard[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [viewType, setViewType] = useState<'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY'>('NEW_AND_OLD_IMAGES')

  const [selectedShard, setSelectedShard] = useState<DynamoStreamShard | null>(null)
  const [records, setRecords] = useState<DynamoStreamRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [iteratorType, setIteratorType] = useState<'TRIM_HORIZON' | 'LATEST'>('TRIM_HORIZON')

  const load = useCallback(async () => {
    setLoading(true)
    setSelectedShard(null)
    setRecords([])
    const streamsRes = await window.electronAPI.dynamoDbListStreams(tableName)
    if (!streamsRes.success) {
      showToast('error', streamsRes.error ?? 'Failed to list streams')
      setLoading(false)
      return
    }
    const match = (streamsRes.data ?? []).find((s) => s.tableName === tableName)
    if (!match) {
      setStreamInfo(null)
      setLoading(false)
      return
    }
    const descRes = await window.electronAPI.dynamoDbDescribeStream(match.streamArn)
    if (descRes.success && descRes.data) {
      setStreamInfo(descRes.data)
    } else {
      showToast('error', descRes.error ?? 'Failed to describe stream')
    }
    setLoading(false)
  }, [tableName, showToast])

  useEffect(() => { load() }, [tableName]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async () => {
    const enabled = !streamInfo
    setToggling(true)
    const res = await window.electronAPI.dynamoDbUpdateTableStream(tableName, enabled, enabled ? viewType : undefined)
    setToggling(false)
    if (res.success) {
      showToast('success', enabled ? 'Stream enabled' : 'Stream disabled')
      load()
    } else {
      showToast('error', res.error ?? 'Failed to update stream')
    }
  }

  const handleGetRecords = async (shard: DynamoStreamShard) => {
    if (!streamInfo) return
    setSelectedShard(shard)
    setLoadingRecords(true)
    setRecords([])
    const iterRes = await window.electronAPI.dynamoDbGetShardIterator(
      streamInfo.streamArn,
      shard.shardId,
      iteratorType
    )
    if (!iterRes.success || !iterRes.data) {
      showToast('error', iterRes.error ?? 'Failed to get shard iterator')
      setLoadingRecords(false)
      return
    }
    const recRes = await window.electronAPI.dynamoDbGetRecords(iterRes.data, 100)
    setLoadingRecords(false)
    if (recRes.success && recRes.data) {
      setRecords(recRes.data.records)
    } else {
      showToast('error', recRes.error ?? 'Failed to get records')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={20} className="animate-spin text-3" /></div>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stream header */}
      <div className="px-5 py-3 border-b border-theme shrink-0 flex items-center justify-between gap-4" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
            <Radio size={14} className="text-violet-500" />
          </div>
          <div className="min-w-0">
            {streamInfo ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-1">Stream Active</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{streamInfo.streamStatus}</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-theme bg-raised text-3">{streamInfo.streamViewType}</span>
                </div>
                <p className="text-[10px] font-mono text-4 truncate mt-0.5">{streamInfo.streamArn}</p>
              </>
            ) : (
              <p className="text-xs text-3">Streams not enabled for this table</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!streamInfo && (
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as typeof viewType)}
              className="input-base text-[10px] py-1"
            >
              <option value="NEW_AND_OLD_IMAGES">New & Old Images</option>
              <option value="NEW_IMAGE">New Image</option>
              <option value="OLD_IMAGE">Old Image</option>
              <option value="KEYS_ONLY">Keys Only</option>
            </select>
          )}
          <button onClick={() => load()} disabled={loading} className="btn-ghost !px-2 !py-1.5">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors
              ${streamInfo
                ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
              }`}
          >
            {toggling ? <Loader2 size={12} className="animate-spin" /> : streamInfo ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
            {streamInfo ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {streamInfo && (
        <div className="flex flex-1 overflow-hidden">
          {/* Shard list */}
          <div className="w-64 shrink-0 border-r border-theme flex flex-col" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
            <div className="px-3 py-2 border-b border-theme">
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider">
                Shards ({streamInfo.shards.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {streamInfo.shards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-3">
                  <p className="text-xs text-3">No shards</p>
                  <p className="text-[10px] text-4 mt-1">Write items to populate shards</p>
                </div>
              ) : (
                streamInfo.shards.map((shard) => {
                  const isSelected = selectedShard?.shardId === shard.shardId
                  const isClosed = !!shard.endingSequenceNumber
                  return (
                    <div
                      key={shard.shardId}
                      className={`border-b border-theme border-l-2 transition-colors
                        ${isSelected ? 'bg-violet-500/10 border-l-violet-500' : 'border-l-transparent hover:bg-raised'}`}
                    >
                      <div className="px-3 py-2">
                        <p className="text-[10px] font-mono text-2 truncate">{shard.shardId.slice(-16)}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[8px] font-bold uppercase ${isClosed ? 'text-4' : 'text-emerald-500'}`}>
                            {isClosed ? 'closed' : 'open'}
                          </span>
                          <button
                            onClick={() => handleGetRecords(shard)}
                            disabled={loadingRecords}
                            className="text-[9px] font-semibold text-violet-500 hover:text-violet-400 transition-colors"
                          >
                            Read
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {/* Iterator type selector */}
            <div className="p-2 border-t border-theme shrink-0">
              <p className="text-[9px] text-4 mb-1 font-bold uppercase tracking-wider">Iterator type</p>
              <select
                value={iteratorType}
                onChange={(e) => setIteratorType(e.target.value as typeof iteratorType)}
                className="input-base text-[10px] py-1 w-full"
              >
                <option value="TRIM_HORIZON">TRIM_HORIZON (oldest)</option>
                <option value="LATEST">LATEST (newest)</option>
              </select>
            </div>
          </div>

          {/* Records panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-theme shrink-0 flex items-center justify-between" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
              <p className="text-[10px] font-bold text-4 uppercase tracking-wider">
                {selectedShard
                  ? `Records — ${selectedShard.shardId.slice(-16)} (${records.length})`
                  : 'Records'}
              </p>
              {loadingRecords && <Loader2 size={13} className="animate-spin text-3" />}
            </div>
            <div className="flex-1 overflow-y-auto">
              {!selectedShard ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Radio size={24} className="text-4 opacity-20" />
                  <p className="text-xs text-3 font-medium">Select a shard</p>
                  <p className="text-[10px] text-4">Click "Read" on a shard to load records</p>
                </div>
              ) : loadingRecords ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={18} className="animate-spin text-3" />
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <p className="text-xs text-3 font-medium">No records</p>
                  <p className="text-[10px] text-4">Shard is empty or no changes since iterator position</p>
                </div>
              ) : (
                <div style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
                  {records.map((r, i) => <RecordRow key={r.eventId ?? i} record={r} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!streamInfo && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
            <Radio size={32} className="text-violet-500 opacity-50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-2">Streams not enabled</p>
            <p className="text-xs text-3 mt-1">Select a view type and click Enable to activate DynamoDB Streams</p>
          </div>
        </div>
      )}
    </div>
  )
}
