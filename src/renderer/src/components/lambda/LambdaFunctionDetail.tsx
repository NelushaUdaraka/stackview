import { useState, useEffect } from 'react'
import { Trash2, Loader2, Play, Settings, Code2, RefreshCw, Send, Check, AlertTriangle, TerminalSquare, Layers, Clock, Settings2, FileCode, File, Image as ImageIcon, Save } from 'lucide-react'
import type { LambdaFunction } from '../../types'
import { useToastContext } from '../../contexts/ToastContext'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-java'
import 'prismjs/themes/prism-tomorrow.css'

interface Props {
  lambda: LambdaFunction
  onRefresh: () => void
  onDeleted: () => void
}

type Tab = 'overview' | 'test' | 'code'

export default function LambdaFunctionDetail({ lambda, onRefresh, onDeleted }: Props) {
  const { showToast } = useToastContext()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [payload, setPayload] = useState('{\n  "key1": "value1",\n  "key2": "value2"\n}')
  const [invoking, setInvoking] = useState(false)
  const [invokeResult, setInvokeResult] = useState<any>(null)

  const [codeData, setCodeData] = useState<any>(null)
  const [loadingCode, setLoadingCode] = useState(false)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({})
  const [updatingCode, setUpdatingCode] = useState(false)

  useEffect(() => {
    setActiveTab('overview')
    setCodeData(null)
    setActiveFile(null)
    setLocalEdits({})
    setInvokeResult(null)
    setConfirmDelete(false)
  }, [lambda.FunctionName])

  useEffect(() => {
    if (activeTab === 'code' && !codeData && !loadingCode) {
      const fetchCode = async () => {
        setLoadingCode(true)
        const res = await window.electronAPI.lambdaGetFunctionCode(lambda.FunctionName)
        setCodeData(res)
        if (res?.success && res.files?.length > 0) {
          const indexFile = res.files.find((f: any) => f.path.startsWith('index') && !f.isBinary)
          setActiveFile(indexFile ? indexFile.path : res.files[0].path)
        }
        setLoadingCode(false)
      }
      fetchCode()
    }
  }, [activeTab, lambda.FunctionName, codeData, loadingCode])

  const handleUpdateCode = async () => {
    setUpdatingCode(true)
    const filesArray = Object.entries(localEdits).map(([path, content]) => ({ path, content }))
    const res = await window.electronAPI.lambdaUpdateFunctionCode(lambda.FunctionName, filesArray)
    if (res.success) {
      showToast('success', 'Function code updated successfully!')
      setLocalEdits({})
      setCodeData(null) // trigger re-fetch to confirm
    } else {
      showToast('error', res.error || 'Failed to update code.')
    }
    setUpdatingCode(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return }
    setDeleting(true)
    const res = await window.electronAPI.lambdaDeleteFunction(lambda.FunctionName)
    setDeleting(false)
    if (res.success) onDeleted()
    else showToast('error', res.error ?? 'Failed to delete function')
  }

  const handleInvoke = async () => {
    try {
      if (payload.trim()) JSON.parse(payload)
    } catch {
      showToast('error', 'Payload must be valid JSON.')
      return
    }

    setInvoking(true)
    setInvokeResult(null)
    const res = await window.electronAPI.lambdaInvokeFunction(lambda.FunctionName, payload.trim())
    if (res.success && res.data) {
      setInvokeResult(res.data)
      if (res.data.FunctionError) {
        showToast('error', `Execution failed: ${res.data.FunctionError}`)
      } else {
        showToast('success', 'Execution succeeded')
      }
    } else {
      showToast('error', res.error || 'Failed to invoke function')
    }
    setInvoking(false)
  }

  return (
    <div className="flex flex-col h-full relative bg-app animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-6 border-b border-theme bg-base shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
             <div className="p-3 rounded-2xl border bg-violet-500/10 border-violet-500/20 text-violet-500">
               <TerminalSquare size={24} />
             </div>
             <div>
               <h1 className="text-xl font-bold text-1 mb-1 truncate tracking-tight">{lambda.FunctionName}</h1>
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider
                   bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   {lambda.State || 'Active'}
                 </div>
                 <span className="text-[11px] text-4 font-mono select-all truncate max-w-[400px]">
                   {lambda.FunctionArn}
                 </span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-colors
                ${confirmDelete
                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 shadow-sm shadow-red-500/5'
                  : 'btn-danger bg-red-500/5 hover:bg-red-500/10 border-red-500/20'
                }`}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {confirmDelete ? 'Confirm Delete' : 'Delete Function'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 pt-6 -mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-semibold transition-colors
              ${activeTab === 'overview' ? 'border-violet-500 text-violet-500' : 'border-transparent text-3 hover:text-2'}`}
          >
            <Settings size={13} />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-semibold transition-colors
              ${activeTab === 'code' ? 'border-violet-500 text-violet-500' : 'border-transparent text-3 hover:text-2'}`}
          >
            <Code2 size={13} />
            Code Source
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-semibold transition-colors
              ${activeTab === 'test' ? 'border-violet-500 text-violet-500' : 'border-transparent text-3 hover:text-2'}`}
          >
            <Play size={13} />
            Test Event
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-app">
         <div className="w-full">
           {activeTab === 'overview' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <div className="bg-base rounded-2xl border border-theme p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <Layers size={64} />
                  </div>
                  <h3 className="text-xs font-bold text-2 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Settings2 size={14} className="text-violet-500" />
                     Function Details
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                     <div>
                       <label className="text-[10px] font-bold text-4 uppercase tracking-widest block mb-1">Runtime</label>
                       <div className="text-sm font-medium text-1 capitalize">
                         {lambda.Runtime}
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-4 uppercase tracking-widest block mb-1">Handler</label>
                       <div className="font-mono text-xs text-1 mt-0.5">
                         {lambda.Handler}
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-4 uppercase tracking-widest block mb-1">Code Size</label>
                       <div className="text-sm font-medium text-1">
                         {(lambda.CodeSize / 1024 / 1024).toFixed(2)} MB
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-4 uppercase tracking-widest block mb-1">Timeout</label>
                       <div className="text-sm font-medium text-1 flex items-center gap-1.5">
                         <Clock size={12} className="text-4" />
                         {lambda.Timeout} seconds
                       </div>
                     </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-theme">
                     <label className="text-[10px] font-bold text-4 uppercase tracking-widest block mb-2">IAM Role ARN</label>
                     <div className="p-3 rounded-lg bg-raised/30 border border-theme/50 font-mono text-xs text-2 break-all inline-block w-full">
                        {lambda.Role}
                     </div>
                  </div>
               </div>
             </div>
           )}

           {activeTab === 'test' && (
             <div className="space-y-4 animate-in fade-in duration-300 w-full">
               <div className="bg-base rounded-2xl border border-theme p-6 shadow-sm">
                 <h3 className="text-xs font-bold text-2 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Send size={14} className="text-violet-500" />
                   Invoke Function
                 </h3>
                 <p className="text-xs text-3 mb-4 leading-relaxed max-w-2xl">
                   Simulate an API Gateway proxy, an S3 event, or run an ad-hoc test payload through your Lambda function.
                 </p>

                 <div className="mb-4">
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-[10px] font-bold text-4 uppercase tracking-widest ml-1">Event JSON JSON</label>
                     <button
                       onClick={() => {
                         try {
                           const formatted = JSON.stringify(JSON.parse(payload), null, 2)
                           setPayload(formatted)
                         } catch {
                           showToast('error', 'Invalid JSON - Cannot format')
                         }
                       }}
                       className="text-[10px] text-violet-500 hover:text-violet-400 font-bold uppercase transition-colors"
                     >
                       Format JSON
                     </button>
                   </div>
                   <textarea
                     value={payload}
                     onChange={e => setPayload(e.target.value)}
                     className="input-base w-full h-48 font-mono text-xs leading-relaxed resize-y"
                     spellCheck={false}
                   />
                 </div>

                 <div className="flex justify-end mb-6">
                    <button
                      onClick={handleInvoke}
                      disabled={invoking || !payload.trim()}
                      className="btn-primary px-6 py-2 bg-violet-600 hover:bg-violet-500 font-bold text-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      {invoking ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                      Invoke
                    </button>
                 </div>

                 {invokeResult && (
                    <div className="mt-6 border-t border-theme pt-6 animate-in fade-in slide-in-from-top-2">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-1">
                          Execution Results
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${invokeResult.FunctionError ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {invokeResult.StatusCode}
                          </span>
                       </h4>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-4 uppercase tracking-widest block mb-2">Response Payload</label>
                            <div className="p-4 rounded-xl bg-app border border-theme font-mono text-xs overflow-auto text-2 whitespace-pre-wrap max-h-80">
                              {invokeResult.Payload || 'null'}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-4 uppercase tracking-widest block mb-2">Execution Logs</label>
                            <div className="p-4 rounded-xl bg-black border border-theme/50 font-mono text-[10px] overflow-auto text-green-400 whitespace-pre max-h-80">
                              {invokeResult.LogResult || 'No logs generated.'}
                            </div>
                          </div>
                       </div>
                    </div>
                 )}
               </div>
             </div>
           )}

           {activeTab === 'code' && (
             <div className="h-full animate-in fade-in duration-300">
               {loadingCode ? (
                 <div className="flex flex-col items-center justify-center p-12 text-3">
                   <Loader2 size={24} className="animate-spin mb-3 text-violet-500" />
                   <p className="text-xs font-medium">Fetching deployment package...</p>
                 </div>
               ) : codeData?.limited || codeData?.error ? (
                 <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl max-w-2xl">
                   <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                     <AlertTriangle size={16} />
                     Unable to View Code
                   </h3>
                   <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed">
                     {codeData.error}
                   </p>
                 </div>
               ) : codeData?.success && codeData.files ? (
                 <div className="flex h-full border border-theme rounded-xl overflow-hidden bg-base">
                   {/* Sidebar tree */}
                   <div className="w-64 shrink-0 bg-raised/30 border-r border-theme overflow-y-auto hidden md:block">
                     <div className="px-3 py-2.5 bg-raised/50 border-b border-theme text-[10px] font-bold text-3 uppercase tracking-widest flex items-center gap-2 sticky top-0">
                       <Layers size={12} />
                       Deployment Package
                     </div>
                     <div className="p-2 space-y-0.5">
                       {codeData.files.map((file: any) => (
                         <button
                           key={file.path}
                           onClick={() => setActiveFile(file.path)}
                           className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors
                             ${activeFile === file.path ? 'bg-violet-500/10 text-violet-500 font-medium' : 'text-2 hover:bg-theme'}`}
                           title={file.path}
                         >
                           {file.isBinary ? <ImageIcon size={13} className="shrink-0 text-4" /> : <FileCode size={13} className="shrink-0 text-amber-500" />}
                           <span className="truncate">{file.path}</span>
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* Editor pane */}
                   <div className="flex-1 bg-[#1e1e1e] flex flex-col min-h-[500px] overflow-hidden">
                     <div className="px-4 py-3 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between shadow-sm z-10">
                       <div className="flex items-center gap-2 text-xs font-mono">
                         {activeFile && (codeData.files.find((x: any) => x.path === activeFile)?.isBinary ? (
                           <ImageIcon size={14} className="text-gray-400" />
                         ) : (
                           <FileCode size={14} className="text-amber-500" />
                         ))}
                         <span className="text-gray-300 font-medium">{activeFile || 'No file selected'}</span>
                         {localEdits[activeFile!] !== undefined && <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2" title="Unsaved changes"></span>}
                       </div>
                       
                       <div className="flex items-center gap-2">
                         {Object.keys(localEdits).length > 0 && (
                           <button
                             onClick={handleUpdateCode}
                             disabled={updatingCode}
                             className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                           >
                             {updatingCode ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                             Deploy Changes ({Object.keys(localEdits).length})
                           </button>
                         )}
                       </div>
                     </div>
                     <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                       {activeFile ? (() => {
                         const f = codeData.files.find((x: any) => x.path === activeFile)
                         if (!f) return null
                         if (f.isBinary) {
                           return (
                             <div className="flex flex-col items-center justify-center p-12 text-gray-500 h-full">
                               <File size={32} className="mb-3 opacity-50" />
                               <p className="text-xs">Binary files cannot be displayed inline.</p>
                             </div>
                           )
                         }
                         
                         const contentToDisplay = localEdits[activeFile] !== undefined ? localEdits[activeFile] : f.content
                         
                         return (
                           <div className="min-w-max p-4" style={{ backgroundColor: '#1e1e1e' }}>
                             <Editor
                               value={contentToDisplay}
                               onValueChange={code => setLocalEdits(prev => ({ ...prev, [activeFile]: code }))}
                               highlight={code => {
                                 let lang = 'javascript'
                                 if (activeFile.endsWith('.py')) lang = 'python'
                                 else if (activeFile.endsWith('.json')) lang = 'json'
                                 else if (activeFile.endsWith('.ts')) lang = 'typescript'
                                 else if (activeFile.endsWith('.java')) lang = 'java'
                                 
                                 const grammar = Prism.languages[lang] || Prism.languages.javascript
                                 return Prism.highlight(code, grammar, lang)
                               }}
                               padding={10}
                               style={{
                                 fontFamily: '"Fira Code", "Consolas", monospace',
                                 fontSize: 12,
                                 color: '#d4d4d4',
                                 minHeight: '100%',
                                 outline: 'none'
                               }}
                               className="editor-container"
                             />
                           </div>
                         )
                       })() : (
                         <div className="flex items-center justify-center h-full text-xs text-gray-500 italic">
                           Select a file to view or edit its contents.
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               ) : null}
             </div>
           )}

         </div>
      </div>
    </div>
  )
}
