import { useState, useEffect } from 'react'
import {
  Network, Loader2, Plus, Trash2, ArrowLeft, Settings2, Code, Zap, Globe, Save
} from 'lucide-react'
import type { ApigwRestApi, ApigwResource, ApigwStage } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  api: ApigwRestApi
  onBack: () => void
}

export default function ApigwApiDetail({ api, onBack }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<'Resources' | 'Stages'>('Resources')
  const [loading, setLoading] = useState(false)
  
  const [resources, setResources] = useState<ApigwResource[]>([])
  const [stages, setStages] = useState<ApigwStage[]>([])
  const [selectedResource, setSelectedResource] = useState<ApigwResource | null>(null)

  // Creation Modals
  const [showCreateResource, setShowCreateResource] = useState(false)
  const [showCreateMethod, setShowCreateMethod] = useState(false)
  const [showCreateIntegration, setShowCreateIntegration] = useState(false)
  const [showDeploy, setShowDeploy] = useState(false)

  // State for forms
  const [newPathPart, setNewPathPart] = useState('')
  const [newMethod, setNewMethod] = useState('GET')
  const [integrationType, setIntegrationType] = useState('MOCK')
  const [integrationMethod, setIntegrationMethod] = useState('POST')
  const [integrationUri, setIntegrationUri] = useState('')
  const [deployStageName, setDeployStageName] = useState('')
  const [deployDesc, setDeployDesc] = useState('')

  const loadData = async () => {
    setLoading(true)
    const [resRes, stageRes] = await Promise.all([
      window.electronAPI.apigwGetResources(api.id),
      window.electronAPI.apigwGetStages(api.id)
    ])
    if (resRes.success && resRes.data) {
      setResources(resRes.data)
      if (!selectedResource && resRes.data.length > 0) {
        // Automatically select the root resource if none selected
        const root = resRes.data.find((r: any) => r.path === '/') || resRes.data[0]
        setSelectedResource(root)
      } else if (selectedResource) {
        const updated = resRes.data.find((r: any) => r.id === selectedResource.id)
        if (updated) setSelectedResource(updated)
        else setSelectedResource(null)
      }
    }
    if (stageRes.success && stageRes.data) setStages(stageRes.data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [api.id])

  const handleCreateResource = async () => {
    if (!newPathPart || !selectedResource) return
    const res = await window.electronAPI.apigwCreateResource(api.id, selectedResource.id, newPathPart)
    if (res.success) {
      showToast('success', 'Resource created')
      setShowCreateResource(false)
      setNewPathPart('')
      loadData()
    } else {
      showToast('error', res.error || 'Failed to create resource')
    }
  }

  const handleDeleteResource = async (resId: string) => {
    const res = await window.electronAPI.apigwDeleteResource(api.id, resId)
    if (res.success) {
      showToast('success', 'Resource deleted')
      if (selectedResource?.id === resId) setSelectedResource(null)
      loadData()
    } else {
      showToast('error', res.error || 'Failed to delete')
    }
  }

  const handleCreateMethod = async () => {
    if (!selectedResource) return
    const res = await window.electronAPI.apigwPutMethod(api.id, selectedResource.id, newMethod)
    if (res.success) {
      showToast('success', `Method ${newMethod} created`)
      setShowCreateMethod(false)
      loadData()
    } else {
      showToast('error', res.error || 'Failed')
    }
  }

  const handlePutIntegration = async () => {
    if (!selectedResource || !newMethod) return
    const res = await window.electronAPI.apigwPutIntegration(api.id, selectedResource.id, newMethod, integrationType, integrationMethod, integrationUri)
    if (res.success) {
      showToast('success', 'Integration mapped')
      setShowCreateIntegration(false)
      loadData()
    } else {
      showToast('error', res.error || 'Failed')
    }
  }

  const handleDeleteMethod = async (method: string) => {
    if (!selectedResource) return
    const res = await window.electronAPI.apigwDeleteMethod(api.id, selectedResource.id, method)
    if (res.success) { showToast('success', 'Method deleted'); loadData() }
    else showToast('error', res.error || 'Failed')
  }

  const handleDeploy = async () => {
    if (!deployStageName) return
    const res = await window.electronAPI.apigwCreateDeployment(api.id, deployStageName, deployDesc)
    if (res.success) {
      showToast('success', 'API Deployed')
      setShowDeploy(false)
      setDeployStageName('')
      setDeployDesc('')
      loadData()
    } else { showToast('error', res.error || 'Deployment failed') }
  }

  // Very very rough tree structuring based on parentId
  const sortedResources = [...resources].sort((a, b) => (a.path || '').localeCompare(b.path || ''))

  return (
    <div className="flex flex-col h-full bg-app animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme bg-base flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-ghost !p-2 rounded-xl" title="Back to APIs"><ArrowLeft size={16} /></button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/15">
            <Network size={20} className="text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-1">{api.name}</h2>
            <p className="text-xs text-3 font-mono mt-0.5">{api.id}</p>
          </div>
        </div>
        
        <button onClick={() => setShowDeploy(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors shadow-sm">
          <Zap size={14} /> Deploy API
        </button>
      </div>

      <div className="flex items-center px-6 border-b border-theme bg-raised/30">
        <button onClick={() => setActiveTab('Resources')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'Resources' ? 'text-violet-500 border-violet-500' : 'text-3 hover:text-2 border-transparent'}`}>Resources</button>
        <button onClick={() => setActiveTab('Stages')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'Stages' ? 'text-violet-500 border-violet-500' : 'text-3 hover:text-2 border-transparent'}`}>Stages ({stages.length})</button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {loading && resources.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 size={24} className="animate-spin text-violet-500 mb-2" />
            <p className="text-sm font-semibold text-2">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'Resources' && (
              <div className="flex flex-1 overflow-hidden">
                {/* Resource Tree Left Pane */}
                <div className="w-1/3 border-r border-theme bg-base/30 overflow-y-auto p-4 flex flex-col">
                  <h3 className="text-xs font-bold text-2 mb-3 px-2">Resource Tree</h3>
                  <div className="flex flex-col gap-1">
                    {sortedResources.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedResource(r)}
                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${selectedResource?.id === r.id ? 'bg-violet-500/10 border-violet-500/20 text-violet-600 font-semibold dark:text-violet-400' : 'hover:bg-raised text-2 border-transparent'}`}
                      >
                        <span className="font-mono">{r.path}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resource Detail Right Pane */}
                <div className="w-2/3 bg-app overflow-y-auto p-6 flex flex-col gap-6">
                  {selectedResource ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-1 font-mono">{selectedResource.path}</h3>
                          <p className="text-xs text-3 mt-1">Resource ID: {selectedResource.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setShowCreateMethod(true)} className="btn-ghost flex items-center gap-2"><Plus size={14} /> Method</button>
                          <button onClick={() => setShowCreateResource(true)} className="btn-ghost flex items-center gap-2"><Plus size={14} /> Child</button>
                          {selectedResource.path !== '/' && (
                            <button onClick={() => handleDeleteResource(selectedResource.id)} className="btn-ghost text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </div>

                      {/* Methods Grid */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-2">Methods</h4>
                        {Object.keys(selectedResource.resourceMethods || {}).length === 0 ? (
                          <div className="p-8 border border-theme border-dashed rounded-xl flex flex-col items-center justify-center text-3 gap-2">
                            <Code size={24} className="opacity-50" />
                            <p className="text-sm font-medium">No methods defined on this resource</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {Object.entries(selectedResource.resourceMethods || {}).map(([method, details]: [string, any]) => (
                               <div key={method} className="border border-theme rounded-xl bg-base p-4">
                                 <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-3">
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${method === 'GET' ? 'bg-blue-500/10 text-blue-500' : method === 'POST' ? 'bg-emerald-500/10 text-emerald-500' : method === 'DELETE' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>{method}</span>
                                     <span className="text-xs text-3">Auth: {details.authorizationType}</span>
                                   </div>
                                   <button onClick={() => handleDeleteMethod(method)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                 </div>
                                 <div className="bg-raised/50 rounded-lg p-3 text-xs flex items-center justify-between border border-theme">
                                    <div className="flex items-center gap-2">
                                      <Settings2 size={14} className="text-violet-500" />
                                      <span className="font-semibold text-2">Integration:</span>
                                      <span className="font-mono text-3">
                                        {details.methodIntegration ? `${details.methodIntegration.type} (${details.methodIntegration.httpMethod})` : 'None'}
                                      </span>
                                    </div>
                                    <button onClick={() => { setNewMethod(method); setShowCreateIntegration(true) }} className="btn-ghost !py-1 text-[10px] uppercase font-bold tracking-wider">Configure Integration</button>
                                 </div>
                               </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-3 h-full gap-3">
                      <Network size={32} className="opacity-20" />
                      <p>Select a resource from the tree to edit</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Stages' && (
              <div className="p-6 overflow-y-auto w-full">
                {stages.length === 0 ? (
                  <div className="p-12 border border-theme border-dashed rounded-xl flex flex-col items-center justify-center text-3 gap-3">
                    <Globe size={32} className="opacity-50" />
                    <p className="text-sm font-medium">No stages deployed yet. Click "Deploy API" at the top.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stages.map(s => (
                      <div key={s.stageName} className="border border-theme bg-base rounded-xl p-5 hover:border-violet-500/50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <Globe size={18} className="text-violet-500" />
                          <h3 className="text-lg font-bold text-1">{s.stageName}</h3>
                        </div>
                        <p className="text-xs text-3 mb-4 font-mono truncate">Deployment: {s.deploymentId}</p>
                        <div className="text-[10px] text-4 uppercase tracking-wider font-semibold">
                          Created: {s.createdDate ? new Date(s.createdDate).toLocaleString() : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      {showCreateResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="w-full max-w-sm bg-base rounded-2xl border border-theme shadow-2xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-1">Create Child Resource</h3>
              <p className="text-xs text-3">Parent: <span className="font-mono">{selectedResource?.path}</span></p>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Path Part</label>
                <input value={newPathPart} onChange={e=>setNewPathPart(e.target.value)} placeholder="e.g. users or {id}" className="input-base w-full text-sm font-mono" autoFocus/>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                 <button onClick={() => setShowCreateResource(false)} className="btn-ghost">Cancel</button>
                 <button onClick={handleCreateResource} disabled={!newPathPart} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-colors">Create Resource</button>
              </div>
           </div>
        </div>
      )}

      {showCreateMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="w-full max-w-sm bg-base rounded-2xl border border-theme shadow-2xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-1">Create Method</h3>
              <p className="text-xs text-3">Resource: <span className="font-mono">{selectedResource?.path}</span></p>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">HTTP Method</label>
                <select value={newMethod} onChange={e=>setNewMethod(e.target.value)} className="input-base w-full text-sm">
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                  <option>OPTIONS</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                 <button onClick={() => setShowCreateMethod(false)} className="btn-ghost">Cancel</button>
                 <button onClick={handleCreateMethod} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-colors">Save</button>
              </div>
           </div>
        </div>
      )}

      {showCreateIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="w-full max-w-md bg-base rounded-2xl border border-theme shadow-2xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-1">Method Integration</h3>
              <p className="text-xs text-3">Method: <span className="font-bold text-1">{newMethod}</span> on <span className="font-mono">{selectedResource?.path}</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-2 mb-1.5">Integration Type</label>
                  <select value={integrationType} onChange={e=>setIntegrationType(e.target.value)} className="input-base w-full text-sm">
                    <option value="MOCK">MOCK</option>
                    <option value="HTTP">HTTP</option>
                    <option value="HTTP_PROXY">HTTP_PROXY</option>
                    <option value="AWS">AWS</option>
                    <option value="AWS_PROXY">AWS_PROXY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-2 mb-1.5">Integration Method</label>
                  <select value={integrationMethod} onChange={e=>setIntegrationMethod(e.target.value)} className="input-base w-full text-sm">
                    <option>POST</option>
                    <option>GET</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Endpoint URI (Optional for MOCK)</label>
                <input value={integrationUri} onChange={e=>setIntegrationUri(e.target.value)} placeholder="e.g. arn:aws:lambda:..." className="input-base w-full text-sm font-mono" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                 <button onClick={() => setShowCreateIntegration(false)} className="btn-ghost">Cancel</button>
                 <button onClick={handlePutIntegration} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-colors"><Save size={14}/> Save Integration</button>
              </div>
           </div>
        </div>
      )}

      {showDeploy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="w-full max-w-sm bg-base rounded-2xl border border-theme shadow-2xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-1 flex items-center gap-2"><Zap size={16} className="text-amber-500"/> Deploy API</h3>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Stage Name</label>
                <input value={deployStageName} onChange={e=>setDeployStageName(e.target.value)} placeholder="e.g. dev, prod" className="input-base w-full text-sm font-mono" autoFocus/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-2 mb-1.5">Description</label>
                <input value={deployDesc} onChange={e=>setDeployDesc(e.target.value)} placeholder="e.g. Initial deployment" className="input-base w-full text-sm" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                 <button onClick={() => setShowDeploy(false)} className="btn-ghost">Cancel</button>
                 <button onClick={handleDeploy} disabled={!deployStageName} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-colors">Deploy</button>
              </div>
           </div>
        </div>
      )}

    </div>
  )
}
