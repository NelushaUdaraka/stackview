import React, { useState } from 'react'
import { Plus, X, Database, Shield, Lock, Box, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { useToastContext } from '../../contexts/ToastContext'

interface Props {
  onClose: () => void
  onCreated: () => void
}

const CreateRedshiftClusterModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { showToast } = useToastContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    ClusterIdentifier: '',
    NodeType: 'dc2.large',
    NumberOfNodes: 1,
    DBName: 'dev',
    MasterUsername: 'awsuser',
    MasterUserPassword: 'Password123!',
    PubliclyAccessible: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.ClusterIdentifier.trim()) {
      setError('Cluster Identifier is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await window.electronAPI.redshiftCreateCluster(formData)
      if (res.success) {
        showToast('success', `Cluster ${formData.ClusterIdentifier} created successfully`)
        onCreated()
      } else {
        setError(res.error || 'Failed to create cluster')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nodeTypes = ['dc2.large', 'dc2.8xlarge', 'ds2.xlarge', 'ds2.8xlarge', 'ra3.xlplus', 'ra3.4xlarge', 'ra3.16xlarge']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 shadow-2xl overflow-y-auto py-10" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl border border-theme shadow-2xl overflow-hidden animate-in zoom-in duration-200" style={{ backgroundColor: 'rgb(var(--bg-base))' }}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-theme bg-raised/10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/20">
              <Plus size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-1">Create Redshift Cluster</h2>
              <p className="text-[10px] text-4 uppercase tracking-widest font-bold">New Data Warehouse Instance</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-raised text-3 hover:text-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cluster Identifier */}
            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold text-2 uppercase tracking-tight">
                <Database size={12} className="text-red-500" />
                Cluster Identifier *
              </label>
              <input
                required
                type="text"
                value={formData.ClusterIdentifier}
                onChange={e => setFormData({...formData, ClusterIdentifier: e.target.value})}
                placeholder="e.g. my-data-warehouse"
                className="input-base w-full py-2.5"
                autoFocus
              />
              <p className="text-[10px] text-4">Must be unique within the AWS account and region.</p>
            </div>

            {/* Node Type */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold text-2 uppercase tracking-tight">
                <Box size={12} className="text-red-500" />
                Node Type *
              </label>
              <select
                value={formData.NodeType}
                onChange={e => setFormData({...formData, NodeType: e.target.value})}
                className="input-base w-full py-2.5 appearance-none"
              >
                {nodeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Number of Nodes */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold text-2 uppercase tracking-tight">
                <Plus size={12} className="text-red-500" />
                Number of Nodes *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.NumberOfNodes}
                onChange={e => setFormData({...formData, NumberOfNodes: parseInt(e.target.value)})}
                className="input-base w-full py-2.5"
              />
            </div>

            {/* DB Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold text-2 uppercase tracking-tight">
                <Database size={12} className="text-red-500" />
                Database Name
              </label>
              <input
                type="text"
                value={formData.DBName}
                onChange={e => setFormData({...formData, DBName: e.target.value})}
                placeholder="default: dev"
                className="input-base w-full py-2.5"
              />
            </div>

            {/* Publicly Accessible */}
            <label className="flex items-center gap-3 pt-6 cursor-pointer group/toggle">
              <div className="relative inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={formData.PubliclyAccessible}
                  onChange={e => setFormData({...formData, PubliclyAccessible: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-raised peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500 group-hover/toggle:ring-4 group-hover/toggle:ring-red-500/5"></div>
              </div>
              <span className="text-xs font-semibold text-2 select-none">Publicly Accessible</span>
            </label>
          </div>

          {/* Credentials Section */}
          <div className="pt-4 space-y-4 border-t border-theme">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-red-500" />
              <h3 className="text-xs font-bold text-1">Master Credentials</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-2 uppercase tracking-tight">Master Username</label>
                <input
                  type="text"
                  value={formData.MasterUsername}
                  onChange={e => setFormData({...formData, MasterUsername: e.target.value})}
                  className="input-base w-full py-2 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-2 uppercase tracking-tight">Master Password</label>
                <div className="relative group/pass">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.MasterUserPassword}
                    onChange={e => setFormData({...formData, MasterUserPassword: e.target.value})}
                    className="input-base w-full py-2 pl-8 pr-10 text-xs font-mono"
                  />
                  <Lock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-4" />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-4 hover:text-2 hover:bg-raised transition-colors"
                    title="Hold to show password"
                  >
                    {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-500 flex items-start gap-2.5 animate-in shake duration-300">
              <AlertCircle size={16} className="shrink-0" />
              <div className="flex-1">
                <p className="font-bold uppercase tracking-widest mb-0.5">Configuration Error</p>
                {error}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-theme">
            <button 
              type="button"
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-2 hover:bg-raised transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !formData.ClusterIdentifier}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white min-w-[120px] justify-center transition-all shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {loading ? 'Provisioning...' : 'Provision Cluster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRedshiftClusterModal
