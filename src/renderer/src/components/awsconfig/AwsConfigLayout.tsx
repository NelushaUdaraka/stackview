import { useState, useCallback, useEffect } from 'react'
import { useToastContext } from '../../contexts/ToastContext'
import type { AppSettings, ConfigRecorder, ConfigDeliveryChannel, ConfigRule } from '../../types'
import { ClipboardList, Radio, Send, Scale } from 'lucide-react'
import {
  ServiceShell, ResourceRail, SubviewTabs, Inspector, EmptyState, statusColor, stateOf,
  type RailItem, type Subview,
} from '../common/ui'
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

export default function AwsConfigLayout({ settings }: Props) {
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

  const TABS: Subview<ConfigTab>[] = [
    { id: 'recorders', label: 'Recorders', icon: Radio, count: recorders.length },
    { id: 'channels', label: 'Delivery Channels', icon: Send, count: channels.length },
    { id: 'rules', label: 'Rules', icon: Scale, count: rules.length },
  ]

  const railItems: RailItem[] =
    activeTab === 'recorders'
      ? recorders.map(r => ({
          id: r.name,
          name: r.name,
          icon: Radio,
          state: r.recording ? ('ok' as const) : ('idle' as const),
          sub: r.recording ? 'RECORDING' : 'STOPPED',
          meta: r.allSupported ? 'all types' : `${r.resourceTypes.length} types`,
        }))
      : activeTab === 'channels'
        ? channels.map(c => ({
            id: c.name,
            name: c.name,
            icon: Send,
            state: 'ok' as const,
            sub: c.deliveryFrequency?.toUpperCase() ?? 'CHANNEL',
            meta: c.s3BucketName,
          }))
        : rules.map(r => ({
            id: r.name,
            name: r.name,
            icon: Scale,
            state: stateOf(r.state) ?? 'ok',
            sub: r.state?.toUpperCase() ?? 'RULE',
            meta: r.sourceIdentifier,
            keywords: r.description,
          }))

  const selectedRailId =
    activeTab === 'recorders'
      ? (selectedRecorder?.name ?? null)
      : activeTab === 'channels'
        ? (selectedChannel?.name ?? null)
        : (selectedRule?.name ?? null)

  const inspector = (() => {
    if (activeTab === 'recorders' && selectedRecorder) {
      return (
        <Inspector
          kind="recorder"
          icon={Radio}
          iconColor="#f59e0b"
          title={selectedRecorder.name}
          subtitle={selectedRecorder.recording ? 'Recording' : 'Stopped'}
          rows={[
            {
              key: 'Recording',
              value: selectedRecorder.recording ? 'yes' : 'no',
              color: selectedRecorder.recording ? 'rgb(var(--ok))' : 'rgb(var(--text-3))',
            },
            { key: 'All types', value: selectedRecorder.allSupported ? 'yes' : 'no' },
            { key: 'Global types', value: selectedRecorder.includeGlobalResourceTypes ? 'yes' : 'no' },
            { key: 'Resource types', value: String(selectedRecorder.resourceTypes.length) },
            {
              key: 'Last status',
              value: selectedRecorder.lastStatus ?? '\u2014',
              color: statusColor(selectedRecorder.lastStatus),
            },
            { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
          ]}
        />
      )
    }
    if (activeTab === 'channels' && selectedChannel) {
      return (
        <Inspector
          kind="channel"
          icon={Send}
          iconColor="#f59e0b"
          title={selectedChannel.name}
          subtitle={selectedChannel.s3BucketName || 'Delivery channel'}
          rows={[
            { key: 'Bucket', value: selectedChannel.s3BucketName ?? '\u2014', color: 'rgb(var(--accent))' },
            { key: 'Prefix', value: selectedChannel.s3KeyPrefix ?? '\u2014', color: 'rgb(var(--text-2))' },
            { key: 'SNS topic', value: selectedChannel.snsTopicARN ?? '\u2014', color: 'rgb(var(--text-2))' },
            { key: 'Frequency', value: selectedChannel.deliveryFrequency ?? '\u2014' },
            { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
          ]}
        />
      )
    }
    if (activeTab === 'rules' && selectedRule) {
      return (
        <Inspector
          kind="rule"
          icon={Scale}
          iconColor="#f59e0b"
          title={selectedRule.name}
          subtitle={selectedRule.description || selectedRule.sourceIdentifier}
          rows={[
            { key: 'State', value: selectedRule.state ?? '\u2014', color: statusColor(selectedRule.state) },
            { key: 'Owner', value: selectedRule.sourceOwner, color: 'rgb(var(--text-2))' },
            { key: 'Source', value: selectedRule.sourceIdentifier, color: 'rgb(var(--text-2))' },
            { key: 'Region', value: settings.region, color: 'rgb(var(--text-2))' },
          ]}
        />
      )
    }
    return undefined
  })()

  const openCreate = () => {
    if (activeTab === 'recorders') setShowPutRecorder(true)
    else if (activeTab === 'channels') setShowPutChannel(true)
    else setShowPutRule(true)
  }

  return (
    <>
      <div className="shrink-0 px-5 pt-3 border-b border-theme bg-app">
        <SubviewTabs views={TABS} active={activeTab} onChange={handleTabChange} />
      </div>

      <ServiceShell
        rail={
          <ResourceRail
            title={activeTab.toUpperCase()}
            items={railItems}
            selectedId={selectedRailId}
            onSelect={item => {
              if (activeTab === 'recorders') setSelectedRecorder(recorders.find(r => r.name === item.id) ?? null)
              else if (activeTab === 'channels') setSelectedChannel(channels.find(c => c.name === item.id) ?? null)
              else setSelectedRule(rules.find(r => r.name === item.id) ?? null)
            }}
            icon={ClipboardList}
            searchPlaceholder={`Search ${activeTab}...`}
            onCreate={openCreate}
            createLabel={activeTab === 'rules' ? 'New Rule' : activeTab === 'channels' ? 'New Channel' : 'New Recorder'}
            loading={loading}
            emptyLabel={`No ${activeTab}`}
          />
        }
        inspector={inspector}
      >
        {activeTab === 'recorders' && selectedRecorder && (
          <RecorderDetail
            key={selectedRecorder.name}
            recorder={selectedRecorder}
            showToast={showToast}
            onDeleted={() => {
              setSelectedRecorder(null)
              loadRecorders()
            }}
            onChanged={loadRecorders}
          />
        )}
        {activeTab === 'channels' && selectedChannel && (
          <ChannelDetail
            key={selectedChannel.name}
            channel={selectedChannel}
            showToast={showToast}
            onDeleted={() => {
              setSelectedChannel(null)
              loadChannels()
            }}
          />
        )}
        {activeTab === 'rules' && selectedRule && (
          <RuleDetail
            key={selectedRule.name}
            rule={selectedRule}
            showToast={showToast}
            onDeleted={() => {
              setSelectedRule(null)
              loadRules()
            }}
          />
        )}
        {!selectedRailId && (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={ClipboardList}
              title={loading ? 'Loading\u2026' : `Select a ${activeTab.replace(/s$/, '')}`}
              hint={`Pick one from the rail, or create a new ${activeTab.replace(/s$/, '')}.`}
              action={
                <button onClick={openCreate} className="btn-primary">
                  New {activeTab.replace(/s$/, '')}
                </button>
              }
            />
          </div>
        )}
      </ServiceShell>

      {showPutRecorder && (
        <PutRecorderModal
          showToast={showToast}
          onSaved={() => {
            setShowPutRecorder(false)
            loadRecorders()
            showToast('success', 'Recorder saved')
          }}
          onClose={() => setShowPutRecorder(false)}
        />
      )}
      {showPutChannel && (
        <PutChannelModal
          showToast={showToast}
          onSaved={() => {
            setShowPutChannel(false)
            loadChannels()
            showToast('success', 'Delivery channel saved')
          }}
          onClose={() => setShowPutChannel(false)}
        />
      )}
      {showPutRule && (
        <PutRuleModal
          showToast={showToast}
          onSaved={() => {
            setShowPutRule(false)
            loadRules()
            showToast('success', 'Config rule saved')
          }}
          onClose={() => setShowPutRule(false)}
        />
      )}
    </>
  )
}
