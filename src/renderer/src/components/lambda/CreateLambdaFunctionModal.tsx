import { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, X, Loader2, Link2, UploadCloud, FileJson } from 'lucide-react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-ruby'
import 'prismjs/themes/prism-tomorrow.css'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateLambdaFunctionModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [roleArn, setRoleArn] = useState('arn:aws:iam::000000000000:role/lambda-role')
  const [handler, setHandler] = useState('index.handler')
  const [runtime, setRuntime] = useState('nodejs18.x')
  const [deployType, setDeployType] = useState<'zip' | 's3' | 'inline'>('zip')
  const [zipFilePath, setZipFilePath] = useState('')
  const [s3Bucket, setS3Bucket] = useState('')
  const [s3Key, setS3Key] = useState('')
  const [inlineCode, setInlineCode] = useState('')
  const [envVars, setEnvVars] = useState<{ key: string, value: string }[]>([])
  const [description, setDescription] = useState('')
  const [timeout, setTimeoutVal] = useState(3)
  const [memorySize, setMemorySize] = useState(128)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePickFile = async () => {
    const res = await window.electronAPI.openFiles()
    if (!res.canceled && res.filePaths.length > 0) {
      setZipFilePath(res.filePaths[0])
    }
  }

  const getTemplateForRuntime = (rt: string) => {
    if (rt.startsWith('python')) {
      return `import json\n\ndef handler(event, context):\n    return {\n        'statusCode': 200,\n        'body': json.dumps('Hello from StackView!')\n    }`
    } else if (rt.startsWith('nodejs')) {
      return `exports.handler = async (event) => {\n  return {\n    statusCode: 200,\n    body: JSON.stringify('Hello from StackView!'),\n  };\n};`
    } else if (rt.startsWith('ruby')) {
      return `require 'json'\n\ndef handler(event:, context:)\n    {\n        statusCode: 200,\n        body: JSON.generate('Hello from StackView!')\n    }\nend`
    }
    return `// Automatically generated boilerplate for ${rt}`
  }

  const isInlineSupported = useMemo(() => {
    return runtime.startsWith('nodejs') || runtime.startsWith('python') || runtime.startsWith('ruby')
  }, [runtime])

  useEffect(() => {
    if (!isInlineSupported && deployType === 'inline') {
      setDeployType('zip')
    }
  }, [runtime, deployType, isInlineSupported])

  useEffect(() => {
    if (deployType === 'inline') {
      const isContentEmpty = !inlineCode.trim()
      const isStandardNode = inlineCode === getTemplateForRuntime('nodejs18.x') || inlineCode === getTemplateForRuntime('nodejs20.x')
      const isStandardPython = inlineCode === getTemplateForRuntime('python3.9') || inlineCode === getTemplateForRuntime('python3.10') || inlineCode === getTemplateForRuntime('python3.11') || inlineCode === getTemplateForRuntime('python3.12')
      const isDefaultGeneric = inlineCode.startsWith('// Automatically generated boilerplate')

      if (isContentEmpty || isStandardNode || isStandardPython || isDefaultGeneric) {
        setInlineCode(getTemplateForRuntime(runtime))
      }
    }
  }, [deployType, runtime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (deployType === 'zip' && !zipFilePath) return
    if (deployType === 's3' && (!s3Bucket.trim() || !s3Key.trim())) return
    if (deployType === 'inline' && !inlineCode.trim()) return

    const envMap: Record<string, string> = {}
    envVars.forEach(v => {
      if (v.key.trim()) envMap[v.key.trim()] = v.value
    })

    const s3Config = deployType === 's3' ? { bucket: s3Bucket.trim(), key: s3Key.trim() } : undefined
    const zipPath = deployType === 'zip' ? zipFilePath : null
    const inlinePayload = deployType === 'inline' ? inlineCode : null

    setError(null)
    setLoading(true)

    const res = await window.electronAPI.lambdaCreateFunction(
      name.trim(), roleArn.trim(), zipPath, handler.trim(), runtime,
      description.trim() || undefined,
      Number(timeout) || 3,
      Number(memorySize) || 128,
      s3Config,
      envMap,
      inlinePayload
    )
    setLoading(false)

    if (res.success) {
      onCreated()
    } else {
      setError(res.error || 'Failed to create function')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-base border border-theme rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme bg-raised/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20">
              <Plus size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-1">Create Lambda Function</h2>
              <p className="text-[11px] text-3">Deploy a new serverless function</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-3 hover:text-1 hover:bg-raised rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col p-5 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
              <span className="font-bold shrink-0">Error:</span>
              <span className="break-all">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-2 mb-1.5 ml-1">Function Name <span className="text-red-500">*</span></label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="my-serverless-endpoint"
                className="input-base w-full group transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-2 mb-1.5 ml-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Handles payment webhooks..."
                className="input-base w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-2 mb-1.5 ml-1">Runtime</label>
                <select
                  value={runtime}
                  onChange={e => setRuntime(e.target.value)}
                  className="input-base w-full text-xs"
                >
                  <option value="nodejs18.x">Node.js 18.x</option>
                  <option value="nodejs16.x">Node.js 16.x</option>
                  <option value="nodejs14.x">Node.js 14.x</option>
                  <option value="python3.11">Python 3.11</option>
                  <option value="python3.10">Python 3.10</option>
                  <option value="python3.9">Python 3.9</option>
                  <option value="python3.8">Python 3.8</option>
                  <option value="python3.7">Python 3.7</option>
                  <option value="java17">Java 17</option>
                  <option value="java11">Java 11</option>
                  <option value="java8">Java 8</option>
                  <option value="java8.al2">Java 8 (al2)</option>
                  <option value="ruby3.2">Ruby 3.2</option>
                  <option value="ruby2.7">Ruby 2.7</option>
                  <option value="dotnet6">.NET 6</option>
                  <option value="go1.x">Go 1.x</option>
                  <option value="provided.al2">Custom (provided.al2)</option>
                  <option value="provided">Custom (provided)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-2 mb-1.5 ml-1">Handler Definition</label>
                <input
                  type="text"
                  value={handler}
                  onChange={e => setHandler(e.target.value)}
                  placeholder="index.handler"
                  className="input-base w-full font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-2 mb-1.5 ml-1">Timeout (seconds)</label>
                <input
                  type="number"
                  min={1}
                  max={900}
                  value={timeout}
                  onChange={e => setTimeoutVal(Number(e.target.value))}
                  className="input-base w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-2 mb-1.5 ml-1">Memory (MB)</label>
                <input
                  type="number"
                  min={128}
                  max={10240}
                  step={1}
                  value={memorySize}
                  onChange={e => setMemorySize(Number(e.target.value))}
                  className="input-base w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-2 mb-1.5 ml-1">Execution Role ARN</label>
              <input
                type="text"
                value={roleArn}
                onChange={e => setRoleArn(e.target.value)}
                placeholder="arn:aws:iam::000000000000:role/..."
                className="input-base w-full font-mono text-xs"
              />
              <p className="text-[10px] text-4 ml-1 mt-1.5 leading-snug">
                The role that grants the function permissions to access AWS services and resources.
              </p>
            </div>

            <div className="pt-2 border-t border-theme">
              <div className="flex items-center justify-between mb-3 mt-2">
                <label className="block text-xs font-bold text-2 ml-1">Deployment Target <span className="text-red-500">*</span></label>
                <div className="flex bg-raised rounded-lg p-0.5 border border-theme">
                  <button
                    type="button"
                    onClick={() => setDeployType('zip')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${deployType === 'zip' ? 'bg-base text-1 shadow-sm' : 'text-3 hover:text-2'}`}
                  >
                    Local .zip File
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeployType('s3')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${deployType === 's3' ? 'bg-base text-1 shadow-sm' : 'text-3 hover:text-2'}`}
                  >
                    Amazon S3 URL
                  </button>
                  <button
                    type="button"
                    onClick={() => isInlineSupported && setDeployType('inline')}
                    disabled={!isInlineSupported}
                    title={!isInlineSupported ? "Inline editing is only supported for Node.js, Python, and Ruby runtimes." : ""}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${deployType === 'inline' ? 'bg-base text-1 shadow-sm' : 'text-3 hover:text-2'} ${!isInlineSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    Inline Code
                  </button>
                </div>
              </div>

              {deployType === 'zip' ? (
                <div>
                  <div className="w-full relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={zipFilePath}
                      placeholder="No file selected..."
                      className="input-base w-full pl-3 pr-24 font-mono text-[10px] truncate"
                      required={deployType === 'zip'}
                    />
                    <button
                      type="button"
                      onClick={handlePickFile}
                      className="absolute right-1 top-1 bottom-1 px-3 bg-raised hover:bg-theme rounded-md text-xs font-bold text-2 border border-theme/50 transition-colors flex items-center gap-1.5"
                    >
                      <UploadCloud size={13} />
                      Browse
                    </button>
                  </div>
                </div>
              ) : deployType === 'inline' ? (
                <div>
                  <div className="border border-theme rounded-xl overflow-hidden bg-[#1e1e1e] min-h-[140px]">
                    <Editor
                      value={inlineCode}
                      onValueChange={code => setInlineCode(code)}
                      highlight={code => {
                        let lang = 'javascript'
                        if (runtime.startsWith('python')) lang = 'python'
                        else if (runtime.startsWith('ruby')) lang = 'ruby'
                        
                        const grammar = Prism.languages[lang] || Prism.languages.javascript
                        return Prism.highlight(code, grammar, lang)
                      }}
                      padding={16}
                      style={{
                        fontFamily: '"Fira Code", "Consolas", monospace',
                        fontSize: 12,
                        color: '#d4d4d4',
                        minHeight: '140px',
                        outline: 'none'
                      }}
                      className="editor-container"
                    />
                  </div>
                  <p className="text-[10px] text-4 ml-1 mt-2 leading-snug">
                    Code defaults to the file indicated by your runtime (e.g., <code className="bg-raised px-1 rounded border border-theme">index.js</code> or <code className="bg-raised px-1 rounded border border-theme">index.py</code>). Make sure the Handler maps to your defined method.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-3 mb-1 ml-1">S3 Bucket Name</label>
                    <input
                      type="text"
                      value={s3Bucket}
                      onChange={e => setS3Bucket(e.target.value)}
                      placeholder="my-source-bucket"
                      className="input-base w-full text-xs"
                      required={deployType === 's3'}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-3 mb-1 ml-1">S3 Object Key</label>
                    <input
                      type="text"
                      value={s3Key}
                      onChange={e => setS3Key(e.target.value)}
                      placeholder="function.zip"
                      className="input-base w-full text-xs"
                      required={deployType === 's3'}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-theme">
              <div className="flex items-center justify-between mb-2 mt-2">
                <label className="block text-xs font-bold text-2 ml-1">Environment Variables</label>
                <button
                  type="button"
                  onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
                  className="px-2 py-1 bg-raised hover:bg-theme border border-theme rounded flex items-center gap-1 text-[10px] font-bold text-2 transition-colors"
                >
                  <Plus size={11} /> Add Variable
                </button>
              </div>
              {envVars.length === 0 ? (
                <p className="text-[10px] text-4 ml-1 italic">No environment variables defined.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {envVars.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={v.key}
                        onChange={e => {
                          const n = [...envVars]
                          n[i].key = e.target.value
                          setEnvVars(n)
                        }}
                        className="input-base text-xs py-1.5 flex-1 font-mono"
                      />
                      <span className="text-3 text-xs font-bold">=</span>
                      <input
                        type="text"
                        placeholder="Value"
                        value={v.value}
                        onChange={e => {
                          const n = [...envVars]
                          n[i].value = e.target.value
                          setEnvVars(n)
                        }}
                        className="input-base text-xs py-1.5 flex-1 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setEnvVars(envVars.filter((_, idx) => idx !== i))}
                        className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-theme">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-3 hover:text-1 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || (deployType === 'zip' && !zipFilePath) || (deployType === 's3' && (!s3Bucket.trim() || !s3Key.trim())) || (deployType === 'inline' && !inlineCode.trim())}
              className="btn-primary min-w-[120px] bg-violet-600 hover:bg-violet-500"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Create Function'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
