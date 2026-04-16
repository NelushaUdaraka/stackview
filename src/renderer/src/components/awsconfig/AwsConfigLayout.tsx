import { useState, useCallback, useEffect } from 'react'
import { useResizableSidebar } from '../../hooks/useResizableSidebar'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, ConfigRecorder, ConfigDeliveryChannel, ConfigRule } from '../../types'
import AwsConfigSidebar from './AwsConfigSidebar'
import RecorderDetail from './RecorderDetail'
import ChannelDetail from './ChannelDetail'
import RuleDetail from './RuleDetail'
import PutRecorderModal from './PutRecorderModal'
import PutChannelModal from './PutChannelModal'
import PutRuleModal from './PutRuleModal'

export type ConfigTab = 'recorders' | 'channels' | 'rules'

interface Props {
  settings: AppSettings
}

export default function AwsConfigLayout({ settings: _settings }: Props) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('recorders')
  const [recorders, setRecorders] = useState<ConfigRecorder[]>([])
  const [channels, setChannels] = useState<ConfigDeliveryChannel[]>([])
  const [rules, setRules] = useState<ConfigRule[]>([])
  const [selectedRecorder, setSelectedRecorder] = useState<ConfigRecorder | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<ConfigDeliveryChannel | null>(null)
  const [selectedRule, setSelectedRule] = useState<ConfigRule | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPutRecorder, setShowPutRecorder] = useState(false)
  const [showPutChannel, setShowPutChannel] = useState(false)
  const [showPutRule, setShowPutRule] = useState(false)

  const { sidebarWidth, handleResizeStart } = useResizableSidebar({ min: 220, max: 400 })
  const { showToast } = useToastContext()

  const loadRecorders = useCallback(async () => {
    const res = await window.electronAPI.configDescribeRecorders()
    if (res.success && res.data) setRecorders(res.data)
    else if (!res.success) showToast('error', res.error ?? 'Failed to load recorders')
  }, [showToast])

  const loadChannels = useCallback(async () => {
    const res = await window.electronAPI.configDescribeChannels()
    if (res.success && res.data) setChannels(res.data)
    else if (!res.success) showToast('error', res.error ?? 'Failed to load channels')
  }, [showToast])

  const loadRules = useCallback(async () => {
    const res = await window.electronAPI.configDescribeRules()
    if (res.success && res.data) setRules(res.data)
    else if (!res.success) showToast('error', res.error ?? 'Failed to load rules')
  }, [showToast])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadRecorders(), loadChannels(), loadRules()])
    setLoading(false)
  }, [loadRecorders, loadChannels, loadRules])

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: ConfigTab) => {
    setActiveTab(tab)
    setSelectedRecorder(null)
    setSelectedChannel(null)
    setSelectedRule(null)
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      <AwsConfigSidebar
        width={sidebarWidth}
        activeTab={activeTab}
        recorders={recorders}
        channels={channels}
        rules={rules}
        selectedRecorder={selectedRecorder}
        selectedChannel={selectedChannel}
        selectedRule={selectedRule}
        loading={loading}
        onTabChange={handleTabChange}
        onSelectRecorder={setSelectedRecorder}
        onSelectChannel={setSelectedChannel}
        onSelectRule={setSelectedRule}
        onRefresh={loadAll}
        onNew={() => {
          if (activeTab === 'recorders') setShowPutRecorder(true)
          else if (activeTab === 'channels') setShowPutChannel(true)
          else setShowPutRule(true)
        }}
      />

      <div
        className="w-1 cursor-col-resize bg-transparent hover:bg-brand-500/30 active:bg-brand-500/50 transition-colors flex-shrink-0"
        onMouseDown={handleResizeStart}
      />

      <div className="flex-1 overflow-auto min-w-0">
        {activeTab === 'recorders' && selectedRecorder && (
          <RecorderDetail
            recorder={selectedRecorder}
            onDeleted={() => { setSelectedRecorder(null); loadRecorders() }}
            onChanged={loadRecorders}
          />
        )}
        {activeTab === 'channels' && selectedChannel && (
          <ChannelDetail
            channel={selectedChannel}
            onDeleted={() => { setSelectedChannel(null); loadChannels() }}
          />
        )}
        {activeTab === 'rules' && selectedRule && (
          <RuleDetail
            rule={selectedRule}
            onDeleted={() => { setSelectedRule(null); loadRules() }}
          />
        )}
        {((activeTab === 'recorders' && !selectedRecorder) ||
          (activeTab === 'channels' && !selectedChannel) ||
          (activeTab === 'rules' && !selectedRule)) && (
          <div className="flex items-center justify-center h-full text-4 text-sm">
            {activeTab === 'recorders' && recorders.length === 0 && !loading ? 'No configuration recorders' :
             activeTab === 'channels' && channels.length === 0 && !loading ? 'No delivery channels' :
             activeTab === 'rules' && rules.length === 0 && !loading ? 'No config rules' :
             'Select an item'}
          </div>
        )}
      </div>

      {showPutRecorder && (
        <PutRecorderModal
          onSaved={() => { setShowPutRecorder(false); loadRecorders(); showToast('success', 'Recorder saved') }}
          onClose={() => setShowPutRecorder(false)}
        />
      )}
      {showPutChannel && (
        <PutChannelModal
          onSaved={() => { setShowPutChannel(false); loadChannels(); showToast('success', 'Delivery channel saved') }}
          onClose={() => setShowPutChannel(false)}
        />
      )}
      {showPutRule && (
        <PutRuleModal
          onSaved={() => { setShowPutRule(false); loadRules(); showToast('success', 'Config rule saved') }}
          onClose={() => setShowPutRule(false)}
        />
      )}
    </div>
  )
}
