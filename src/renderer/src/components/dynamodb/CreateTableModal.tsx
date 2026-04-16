import { useState } from 'react'
import { X, Database, Loader2, Plus, Trash2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: (name: string) => void
}

interface IndexDef {
  id: string
  indexName: string
  pkName: string
  pkType: 'S' | 'N' | 'B'
  skName: string
  skType: 'S' | 'N' | 'B'
  projectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'
  projectionAttrs: string
}

function emptyIndex(): IndexDef {
  return {
    id: Math.random().toString(36).substr(2, 9),
    indexName: '',
    pkName: '',
    pkType: 'S',
    skName: '',
    skType: 'S',
    projectionType: 'ALL',
    projectionAttrs: '',
  }
}

export default function CreateTableModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [pkName, setPkName] = useState('')
  const [pkType, setPkType] = useState<'S' | 'N' | 'B'>('S')
  const [skName, setSkName] = useState('')
  const [skType, setSkType] = useState<'S' | 'N' | 'B'>('S')
  const [useSk, setUseSk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [gsiList, setGsiList] = useState<IndexDef[]>([])
  const [lsiList, setLsiList] = useState<IndexDef[]>([])

  const valid = name.trim().length >= 3 && pkName.trim().length >= 1 && (!useSk || skName.trim().length >= 1)

  const handleCreate = async () => {
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      // Build attribute definitions from all unique attribute names
      const attrMap = new Map<string, string>()
      attrMap.set(pkName.trim(), pkType)
      if (useSk && skName.trim()) attrMap.set(skName.trim(), skType)

      gsiList.forEach(g => {
        if (g.pkName.trim()) attrMap.set(g.pkName.trim(), g.pkType)
        if (g.skName.trim()) attrMap.set(g.skName.trim(), g.skType)
      })
      lsiList.forEach(l => {
        if (l.skName.trim()) attrMap.set(l.skName.trim(), l.skType)
      })

      const attributeDefinitions = Array.from(attrMap.entries()).map(([n, t]) => ({
        AttributeName: n,
        AttributeType: t
      }))

      const keySchema: any[] = [{ AttributeName: pkName.trim(), KeyType: 'HASH' }]
      if (useSk && skName.trim()) {
        keySchema.push({ AttributeName: skName.trim(), KeyType: 'RANGE' })
      }

      const gsis = gsiList
        .filter(g => g.indexName.trim() && g.pkName.trim())
        .map(g => {
          const ks: any[] = [{ AttributeName: g.pkName.trim(), KeyType: 'HASH' }]
          if (g.skName.trim()) ks.push({ AttributeName: g.skName.trim(), KeyType: 'RANGE' })
          const proj: any = { ProjectionType: g.projectionType }
          if (g.projectionType === 'INCLUDE' && g.projectionAttrs.trim()) {
            proj.NonKeyAttributes = g.projectionAttrs.split(',').map(s => s.trim()).filter(Boolean)
          }
          return { IndexName: g.indexName.trim(), KeySchema: ks, Projection: proj }
        })

      const lsis = lsiList
        .filter(l => l.indexName.trim() && l.skName.trim())
        .map(l => {
          const ks: any[] = [
            { AttributeName: pkName.trim(), KeyType: 'HASH' },
            { AttributeName: l.skName.trim(), KeyType: 'RANGE' },
          ]
          const proj: any = { ProjectionType: l.projectionType }
          if (l.projectionType === 'INCLUDE' && l.projectionAttrs.trim()) {
            proj.NonKeyAttributes = l.projectionAttrs.split(',').map(s => s.trim()).filter(Boolean)
          }
          return { IndexName: l.indexName.trim(), KeySchema: ks, Projection: proj }
        })

      const result = await window.electronAPI.dynamoDbCreateTable(
        name.trim(),
        attributeDefinitions,
        keySchema,
        gsis.length > 0 ? gsis : undefined,
        lsis.length > 0 ? lsis : undefined,
      )
      if (result.success) {
        onCreated(name)
      } else {
        setError(result.error ?? 'Failed to create table')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div
          className="relative w-full max-w-2xl rounded-2xl shadow-2xl border border-theme p-6 my-auto"
          style={{ backgroundColor: 'rgb(var(--bg-base))' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(139 92 246 / 0.1)' }}>
                <Database size={15} style={{ color: 'rgb(139 92 246)' }} />
              </div>
              <h2 className="text-sm font-bold text-1">Create Table</h2>
            </div>
            <button onClick={onClose} className="btn-ghost !px-2 !py-2">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-4 mb-5 max-h-[60vh] overflow-y-auto pr-2">
            {/* Table Name */}
            <div>
              <label className="block text-[10px] font-bold text-4 uppercase tracking-wider mb-1.5">
                Table Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                placeholder="Users"
                className="input-base w-full"
                autoFocus
              />
            </div>

            {/* Partition Key */}
            <div className="p-4 rounded-xl border border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
               <h3 className="text-xs font-semibold text-1 mb-3">Partition Key</h3>
               <div className="grid grid-cols-3 gap-3">
                 <div className="col-span-2">
                   <label className="block text-[10px] text-3 mb-1.5">Key Name <span className="text-red-500">*</span></label>
                   <input type="text" value={pkName} onChange={(e) => setPkName(e.target.value)} className="input-base w-full" placeholder="userId" />
                 </div>
                 <div>
                   <label className="block text-[10px] text-3 mb-1.5">Type</label>
                   <select value={pkType} onChange={(e) => setPkType(e.target.value as any)} className="input-base w-full">
                     <option value="S">String (S)</option>
                     <option value="N">Number (N)</option>
                     <option value="B">Binary (B)</option>
                   </select>
                 </div>
               </div>
            </div>

            {/* Sort Key Toggle */}
            <div className="flex items-center gap-2">
               <input type="checkbox" id="useSk" checked={useSk} onChange={(e) => setUseSk(e.target.checked)} className="rounded border-theme bg-base"/>
               <label htmlFor="useSk" className="text-xs text-2 cursor-pointer">Add Sort Key</label>
            </div>

            {useSk && (
              <div className="p-4 rounded-xl border border-theme" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
                 <h3 className="text-xs font-semibold text-1 mb-3">Sort Key</h3>
                 <div className="grid grid-cols-3 gap-3">
                   <div className="col-span-2">
                     <label className="block text-[10px] text-3 mb-1.5">Key Name <span className="text-red-500">*</span></label>
                     <input type="text" value={skName} onChange={(e) => setSkName(e.target.value)} className="input-base w-full" placeholder="createdAt" />
                   </div>
                   <div>
                     <label className="block text-[10px] text-3 mb-1.5">Type</label>
                     <select value={skType} onChange={(e) => setSkType(e.target.value as any)} className="input-base w-full">
                       <option value="S">String (S)</option>
                       <option value="N">Number (N)</option>
                       <option value="B">Binary (B)</option>
                     </select>
                   </div>
                 </div>
              </div>
            )}

            {/* Global Secondary Indexes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-4 uppercase tracking-wider">Global Secondary Indexes</span>
                <button onClick={() => setGsiList([...gsiList, emptyIndex()])} className="flex items-center gap-1 text-[10px] uppercase font-bold text-violet-500 hover:text-violet-400 border border-transparent hover:border-violet-500/30 px-2 py-1 rounded transition-all">
                  <Plus size={12} /> Add GSI
                </button>
              </div>
              {gsiList.map((g, i) => (
                <IndexForm
                  key={g.id}
                  index={g}
                  type="GSI"
                  onChange={upd => {
                    const copy = [...gsiList]; copy[i] = upd; setGsiList(copy)
                  }}
                  onRemove={() => setGsiList(gsiList.filter(x => x.id !== g.id))}
                />
              ))}
            </div>

            {/* Local Secondary Indexes */}
            {useSk && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-4 uppercase tracking-wider">Local Secondary Indexes</span>
                  <button onClick={() => setLsiList([...lsiList, emptyIndex()])} className="flex items-center gap-1 text-[10px] uppercase font-bold text-violet-500 hover:text-violet-400 border border-transparent hover:border-violet-500/30 px-2 py-1 rounded transition-all">
                    <Plus size={12} /> Add LSI
                  </button>
                </div>
                {lsiList.map((l, i) => (
                  <IndexForm
                    key={l.id}
                    index={l}
                    type="LSI"
                    onChange={upd => {
                      const copy = [...lsiList]; copy[i] = upd; setLsiList(copy)
                    }}
                    onRemove={() => setLsiList(lsiList.filter(x => x.id !== l.id))}
                    fixedPk={pkName}
                  />
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 break-all">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-theme">
            <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-4">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!valid || loading}
              className="btn-primary text-xs py-1.5 px-4 gap-1.5 text-white"
              style={valid && !loading ? { backgroundColor: 'rgb(139 92 246)' } : {}}
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              Create Table
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function IndexForm({
  index,
  type,
  onChange,
  onRemove,
  fixedPk,
}: {
  index: IndexDef
  type: 'GSI' | 'LSI'
  onChange: (idx: IndexDef) => void
  onRemove: () => void
  fixedPk?: string
}) {
  const update = (field: keyof IndexDef, val: any) => onChange({ ...index, [field]: val })

  return (
    <div className="p-4 rounded-xl border border-theme relative" style={{ backgroundColor: 'rgb(var(--bg-raised) / 0.5)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-1">{type}</span>
        <button onClick={onRemove} className="p-1 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-[10px] text-3 mb-1">Index Name <span className="text-red-500">*</span></label>
          <input type="text" value={index.indexName} onChange={e => update('indexName', e.target.value)} className="input-base w-full text-xs" placeholder="email-index" />
        </div>

        {type === 'GSI' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] text-3 mb-1">Partition Key <span className="text-red-500">*</span></label>
              <input type="text" value={index.pkName} onChange={e => update('pkName', e.target.value)} className="input-base w-full text-xs" placeholder="email" />
            </div>
            <div>
              <label className="block text-[10px] text-3 mb-1">Type</label>
              <select value={index.pkType} onChange={e => update('pkType', e.target.value)} className="input-base w-full text-xs">
                <option value="S">String</option><option value="N">Number</option><option value="B">Binary</option>
              </select>
            </div>
          </div>
        )}

        {type === 'LSI' && fixedPk && (
          <div>
            <label className="block text-[10px] text-3 mb-1">Partition Key (inherited)</label>
            <input type="text" value={fixedPk} disabled className="input-base w-full text-xs opacity-50" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-[10px] text-3 mb-1">Sort Key</label>
            <input type="text" value={index.skName} onChange={e => update('skName', e.target.value)} className="input-base w-full text-xs" placeholder="timestamp" />
          </div>
          <div>
            <label className="block text-[10px] text-3 mb-1">Type</label>
            <select value={index.skType} onChange={e => update('skType', e.target.value)} className="input-base w-full text-xs">
              <option value="S">String</option><option value="N">Number</option><option value="B">Binary</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-3 mb-1">Projection</label>
            <select value={index.projectionType} onChange={e => update('projectionType', e.target.value)} className="input-base w-full text-xs">
              <option value="ALL">ALL</option>
              <option value="KEYS_ONLY">KEYS_ONLY</option>
              <option value="INCLUDE">INCLUDE</option>
            </select>
          </div>
          {index.projectionType === 'INCLUDE' && (
            <div>
              <label className="block text-[10px] text-3 mb-1">Non-Key Attributes</label>
              <input type="text" value={index.projectionAttrs} onChange={e => update('projectionAttrs', e.target.value)} className="input-base w-full text-xs" placeholder="attr1, attr2" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
