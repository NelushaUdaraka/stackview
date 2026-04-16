import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ToastProvider } from './contexts/ToastContext'
import ConnectionScreen from './components/common/ConnectionScreen'
import MainLayout from './components/sqs/MainLayout'
import ServiceSelector from './components/common/ServiceSelector'
import S3Layout from './components/s3/S3Layout'
import SecretsManagerLayout from './components/secretsmanager/SecretsManagerLayout'
import DynamoDbLayout from './components/dynamodb/DynamoDbLayout'
import CloudFormationLayout from './components/cloudformation/CloudFormationLayout'
import ParameterStoreLayout from './components/ssm/ParameterStoreLayout'
import SnsLayout from './components/sns/SnsLayout'
import EbLayout from './components/eventbridge/EbLayout'
import SchedulerLayout from './components/scheduler/SchedulerLayout'
import SesLayout from './components/ses/SesLayout'
import KmsLayout from './components/kms/KmsLayout'
import IamLayout from './components/iam/IamLayout'
import ApigwLayout from './components/apigw/ApigwLayout'
import FirehoseLayout from './components/firehose/FirehoseLayout'
import LambdaLayout from './components/lambda/LambdaLayout'
import CloudWatchLayout from './components/cloudwatch/CloudWatchLayout'
import RedshiftLayout from './components/redshift/RedshiftLayout'
import KinesisLayout from './components/kinesis/KinesisLayout'
import OpenSearchLayout from './components/opensearch/OpenSearchLayout'
import EC2Layout from './components/ec2/EC2Layout'
import TranscribeLayout from './components/transcribe/TranscribeLayout'
import Route53Layout from './components/route53/Route53Layout'
import AcmLayout from './components/acm/AcmLayout'
import StsLayout from './components/sts/StsLayout'
import SwfLayout from './components/swf/SwfLayout'
import SfnLayout from './components/sfn/SfnLayout'
import SupportLayout from './components/support/SupportLayout'
import ResourceGroupsLayout from './components/resourcegroups/ResourceGroupsLayout'
import AwsConfigLayout from './components/awsconfig/AwsConfigLayout'
import R53ResolverLayout from './components/r53resolver/R53ResolverLayout'
import S3ControlLayout from './components/s3control/S3ControlLayout'
import TitleBar from './components/common/TitleBar'
import NavRail from './components/common/NavRail'
import type { AppSettings, QueueInfo, AppScreen, Service, AppTab, IconMode, Theme, UpdaterStatus } from './types'
import { ALL_THEMES, THEME_CSS_VARS } from '../../shared/themes'

let themeStyleTag: HTMLStyleElement | null = null

function applyTheme(t: Theme) {
  const root = document.documentElement

  // Keep .dark class in sync for Tailwind's dark: variant utilities
  if (t === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')

  // Inject variables into a dedicated <style> tag that sits after all
  // other stylesheets — guaranteed to win the cascade regardless of @layer ordering.
  if (!themeStyleTag) {
    themeStyleTag = document.createElement('style')
    themeStyleTag.id = 'nexus-theme-vars'
    document.head.appendChild(themeStyleTag)
  }
  const vars = THEME_CSS_VARS[t]
  themeStyleTag.textContent =
    ':root{' + Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';') + '}'
}

function newTabId() { return crypto.randomUUID() }

// Module-level map — window.electronAPI is stable so no React dependency needed.
// Record<Service, ...> enforces exhaustiveness: missing entries are a tsc error.
const SERVICE_REINIT_MAP: Record<Service, (endpoint: string, region: string) => Promise<void>> = {
  sqs:            (ep, rg) => window.electronAPI.reinit(ep, rg),
  s3:             (ep, rg) => window.electronAPI.s3Reinit(ep, rg),
  secretsmanager: (ep, rg) => window.electronAPI.secretsManagerReinit(ep, rg),
  dynamodb:       (ep, rg) => window.electronAPI.dynamoDbReinit(ep, rg),
  cloudformation: (ep, rg) => window.electronAPI.cfnReinit(ep, rg),
  ssm:            (ep, rg) => window.electronAPI.ssmReinit(ep, rg),
  sns:            (ep, rg) => window.electronAPI.snsReinit(ep, rg),
  eventbridge:    (ep, rg) => window.electronAPI.ebReinit(ep, rg),
  scheduler:      (ep, rg) => window.electronAPI.schedulerReinit(ep, rg),
  ses:            (ep, rg) => window.electronAPI.sesReinit(ep, rg),
  kms:            (ep, rg) => window.electronAPI.kmsReinit(ep, rg),
  iam:            (ep, rg) => window.electronAPI.iamReinit(ep, rg),
  sts:            (ep, rg) => window.electronAPI.stsReinit(ep, rg),
  apigw:          (ep, rg) => window.electronAPI.apigwReinit(ep, rg),
  firehose:       (ep, rg) => window.electronAPI.firehoseReinit(ep, rg),
  lambda:         (ep, rg) => window.electronAPI.lambdaReinit(ep, rg),
  cloudwatch:     (ep, rg) => window.electronAPI.cloudwatchReinit(ep, rg),
  redshift:       (ep, rg) => window.electronAPI.redshiftReinit(ep, rg),
  kinesis:        (ep, rg) => window.electronAPI.kinesisReinit(ep, rg),
  opensearch:     (ep, rg) => window.electronAPI.opensearchReinit(ep, rg),
  ec2:            (ep, rg) => window.electronAPI.ec2Reinit(ep, rg),
  transcribe:     (ep, rg) => window.electronAPI.transcribeReinit(ep, rg),
  route53:        (ep, rg) => window.electronAPI.route53Reinit(ep, rg),
  acm:            (ep, rg) => window.electronAPI.acmReinit(ep, rg),
  swf:            (ep, rg) => window.electronAPI.swfReinit(ep, rg),
  sfn:            (ep, rg) => window.electronAPI.sfnReinit(ep, rg),
  support:        (ep, rg) => window.electronAPI.supportReinit(ep, rg),
  resourcegroups: (ep, rg) => window.electronAPI.rgReinit(ep, rg),
  awsconfig:      (ep, rg) => window.electronAPI.configReinit(ep, rg),
  r53resolver:    (ep, rg) => window.electronAPI.r53rReinit(ep, rg),
  s3control:      (ep, rg) => window.electronAPI.s3controlReinit(ep, rg),
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('connection')
  const [tabs, setTabs] = useState<AppTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>({
    endpoint: 'http://localhost:4566',
    region: 'ap-southeast-2'
  })
  const [queues, setQueues] = useState<QueueInfo[]>([])
  const [selectedQueue, setSelectedQueue] = useState<QueueInfo | null>(null)
  const [theme, setThemeState] = useState<Theme>('dark')
  const [iconMode, setIconModeState] = useState<IconMode>('lucide')
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [autoUpdate, setAutoUpdateState] = useState(true)
  const [updaterStatus, setUpdaterStatus] = useState<UpdaterStatus>({ status: 'idle' })
  const [favouriteServices, setFavouriteServices] = useState<Service[]>(() => {
    try {
      const raw = localStorage.getItem('stackview:favourites')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  useEffect(() => {
    const init = async () => {
      const [savedSettings, savedTheme, savedIconMode, version, savedAutoUpdate] = await Promise.all([
        window.electronAPI.getSettings(),
        window.electronAPI.getTheme(),
        window.electronAPI.getIconMode(),
        window.electronAPI.getAppVersion(),
        window.electronAPI.getAutoUpdate(),
      ])
      setSettings(savedSettings)
      const resolved: Theme = ALL_THEMES.includes(savedTheme as Theme) ? savedTheme as Theme : 'dark'
      setThemeState(resolved)
      applyTheme(resolved)
      setIconModeState(savedIconMode)
      setAppVersion(version)
      setAutoUpdateState(savedAutoUpdate)
    }
    init()

    const unsubscribe = window.electronAPI.onUpdaterStatus(setUpdaterStatus)
    return unsubscribe
  }, [])

  const handleSetTheme = useCallback(async (next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    await window.electronAPI.setTheme(next)
  }, [])

  const toggleIconMode = useCallback(async () => {
    const next: IconMode = iconMode === 'lucide' ? 'aws' : 'lucide'
    setIconModeState(next)
    await window.electronAPI.setIconMode(next)
  }, [iconMode])

  const toggleAutoUpdate = useCallback(async () => {
    const next = !autoUpdate
    setAutoUpdateState(next)
    await window.electronAPI.setAutoUpdate(next)
  }, [autoUpdate])

  const handleCheckForUpdates = useCallback(async () => {
    setUpdaterStatus({ status: 'checking' })
    await window.electronAPI.checkForUpdates()
  }, [])

  const handleConnected = useCallback(async (endpoint: string, region: string) => {
    setSettings({ endpoint, region })
    const id = newTabId()
    setTabs([{ id, service: null }])
    setActiveTabId(id)
    setScreen('main')
  }, [])

  const refreshQueues = useCallback(
    async (endpoint?: string, region?: string) => {
      const ep = endpoint ?? settings.endpoint
      const rg = region ?? settings.region
      await window.electronAPI.reinit(ep, rg)
      const result = await window.electronAPI.listQueues()
      if (result.success && result.data) {
        const infos: QueueInfo[] = result.data.map((url) => ({
          url,
          name: url.split('/').pop() ?? url
        }))
        setQueues(infos)
      }
    },
    [settings]
  )

  const reinitService = useCallback(async (svc: Service, endpoint: string, region: string) => {
    await SERVICE_REINIT_MAP[svc](endpoint, region)
  }, [])

  const toggleFavourite = useCallback((svc: Service) => {
    setFavouriteServices(prev => {
      const next = prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
      localStorage.setItem('stackview:favourites', JSON.stringify(next))
      return next
    })
  }, [])

  const reorderFavourites = useCallback((services: Service[]) => {
    setFavouriteServices(services)
    localStorage.setItem('stackview:favourites', JSON.stringify(services))
  }, [])

  const handleSelectService = useCallback(
    (svc: Service) => {
      reinitService(svc, settings.endpoint, settings.region)
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, service: svc } : t))
    },
    [settings, reinitService, activeTabId]
  )

  const handleOpenInNewTab = useCallback(
    (svc: Service) => {
      const existing = tabs.find(t => t.service === svc)
      if (existing) {
        setActiveTabId(existing.id)
        return
      }
      const id = newTabId()
      reinitService(svc, settings.endpoint, settings.region)
      setTabs(prev => [...prev, { id, service: svc }])
      setActiveTabId(id)
    },
    [settings, reinitService, tabs]
  )

  const handleNavRailSelect = useCallback(
    (svc: Service) => {
      const existing = tabs.find(t => t.service === svc)
      if (existing) {
        setActiveTabId(existing.id)
      } else {
        reinitService(svc, settings.endpoint, settings.region)
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, service: svc } : t))
      }
    },
    [settings, reinitService, tabs, activeTabId]
  )

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId)
      const next = prev.filter(t => t.id !== tabId)
      if (next.length === 0) {
        setActiveTabId(null)
        setScreen('connection')
      } else {
        setActiveTabId(current => {
          if (current !== tabId) return current
          const newIdx = idx > 0 ? idx - 1 : 0
          return next[newIdx]?.id ?? null
        })
      }
      return next
    })
  }, [])

  const handleNewTab = useCallback(() => {
    const id = newTabId()
    setTabs(prev => [...prev, { id, service: null }])
    setActiveTabId(id)
  }, [])

  const handleSwitchService = useCallback(() => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, service: null } : t))
  }, [activeTabId])

  const handleRegionChange = useCallback(
    async (region: string) => {
      const newSettings = { ...settings, region }
      setSettings(newSettings)
      await window.electronAPI.saveSettings(newSettings.endpoint, region)
      // Only reinit services that have open tabs — skip idle services
      const openServices = [...new Set(
        tabs.map(t => t.service).filter((s): s is Service => s !== null)
      )]
      await Promise.all(
        openServices.map(svc => SERVICE_REINIT_MAP[svc](newSettings.endpoint, region))
      )
      await refreshQueues(newSettings.endpoint, region)
      setRefreshKey(k => k + 1)
    },
    [settings, tabs, refreshQueues]
  )

  const handleRefreshActiveTab = useCallback(async () => {
    const activeTab = tabs.find(t => t.id === activeTabId)
    if (!activeTab?.service) return
    setRefreshing(true)
    try {
      await reinitService(activeTab.service, settings.endpoint, settings.region)
      if (activeTab.service === 'sqs') await refreshQueues()
      setRefreshKey(k => k + 1)
    } finally {
      setRefreshing(false)
    }
  }, [tabs, activeTabId, settings, reinitService, refreshQueues])

  const handleReorderTabs = useCallback((newTabs: AppTab[]) => {
    setTabs(newTabs)
  }, [])

  const handleDisconnect = useCallback(() => {
    setScreen('connection')
    setTabs([])
    setActiveTabId(null)
    setQueues([])
    setSelectedQueue(null)
  }, [])

  // Map keyed by Service — Record<Service, ...> enforces exhaustiveness at compile time.
  // useMemo recreates on refreshKey/settings/queues changes, which is correct: the key
  // prop inside each renderer changes, triggering the expected layout remount.
  const LAYOUT_RENDERERS = useMemo<Record<Service, (tab: AppTab) => React.ReactElement>>(
    () => ({
      sqs: (tab) => (
        <MainLayout
          key={`${tab.id}-${refreshKey}`}
          settings={settings}
          queues={queues}
          selectedQueue={selectedQueue}
          onSelectQueue={setSelectedQueue}
          onQueuesChanged={() => refreshQueues()}
        />
      ),
      s3:             (tab) => <S3Layout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      secretsmanager: (tab) => <SecretsManagerLayout key={`${tab.id}-${refreshKey}`} settings={settings} />,
      dynamodb:       (tab) => <DynamoDbLayout        key={`${tab.id}-${refreshKey}`} settings={settings} />,
      cloudformation: (tab) => <CloudFormationLayout  key={`${tab.id}-${refreshKey}`} settings={settings} />,
      ssm:            (tab) => <ParameterStoreLayout  key={`${tab.id}-${refreshKey}`} settings={settings} />,
      sns:            (tab) => <SnsLayout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      eventbridge:    (tab) => <EbLayout              key={`${tab.id}-${refreshKey}`} settings={settings} />,
      scheduler:      (tab) => <SchedulerLayout       key={`${tab.id}-${refreshKey}`} settings={settings} />,
      ses:            (tab) => <SesLayout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      kms:            (tab) => <KmsLayout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      iam:            (tab) => <IamLayout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      sts:            (tab) => <StsLayout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      apigw:          (tab) => <ApigwLayout           key={`${tab.id}-${refreshKey}`} settings={settings} />,
      firehose:       (tab) => <FirehoseLayout        key={`${tab.id}-${refreshKey}`} settings={settings} />,
      lambda:         (tab) => <LambdaLayout          key={`${tab.id}-${refreshKey}`} settings={settings} />,
      cloudwatch:     (tab) => <CloudWatchLayout      key={`${tab.id}-${refreshKey}`} settings={settings} />,
      redshift:       (tab) => <RedshiftLayout        key={`${tab.id}-${refreshKey}`} settings={settings} />,
      kinesis:        (tab) => (
        <KinesisLayout
          key={`${tab.id}-${refreshKey}`}
          settings={settings}
          showToast={(type, text) => console.log(`${type}: ${text}`)}
        />
      ),
      opensearch:     (tab) => <OpenSearchLayout      key={`${tab.id}-${refreshKey}`} settings={settings} />,
      ec2:            (tab) => <EC2Layout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      transcribe:     (tab) => <TranscribeLayout      key={`${tab.id}-${refreshKey}`} settings={settings} />,
      route53:        (tab) => <Route53Layout         key={`${tab.id}-${refreshKey}`} settings={settings} />,
      acm:            (tab) => <AcmLayout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      swf:            (tab) => <SwfLayout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      sfn:            (tab) => <SfnLayout             key={`${tab.id}-${refreshKey}`} settings={settings} />,
      support:        (tab) => <SupportLayout         key={`${tab.id}-${refreshKey}`} settings={settings} />,
      resourcegroups: (tab) => <ResourceGroupsLayout key={`${tab.id}-${refreshKey}`} settings={settings} />,
      awsconfig:      (tab) => <AwsConfigLayout      key={`${tab.id}-${refreshKey}`} settings={settings} />,
      r53resolver:    (tab) => <R53ResolverLayout    key={`${tab.id}-${refreshKey}`} settings={settings} />,
      s3control:      (tab) => <S3ControlLayout      key={`${tab.id}-${refreshKey}`} settings={settings} />,
    }),
    [settings, queues, selectedQueue, refreshQueues, refreshKey]
  )

  const renderLayout = (tab: AppTab): React.ReactElement | null => {
    if (tab.service === null) {
      return (
        <ServiceSelector
          settings={settings}
          onSelectService={handleSelectService}
          onOpenInNewTab={handleOpenInNewTab}
          favouriteServices={favouriteServices}
          onToggleFavourite={toggleFavourite}
          iconMode={iconMode}
        />
      )
    }
    return LAYOUT_RENDERERS[tab.service](tab)
  }

  return (
    <ToastProvider>
    <div className="h-full bg-app text-1 flex flex-col">
      {screen === 'connection' && (
        <ConnectionScreen
          initialSettings={settings}
          onConnected={handleConnected}
          theme={theme}
          onSetTheme={handleSetTheme}
          appVersion={appVersion}
          autoUpdate={autoUpdate}
          onToggleAutoUpdate={toggleAutoUpdate}
          updaterStatus={updaterStatus}
          onCheckForUpdates={handleCheckForUpdates}
          onInstallUpdate={() => window.electronAPI.installUpdate()}
        />
      )}
      {screen === 'main' && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          <NavRail
            favouriteServices={favouriteServices}
            activeService={tabs.find(t => t.id === activeTabId)?.service ?? null}
            onSelectService={handleNavRailSelect}
            onOpenInNewTab={handleOpenInNewTab}
            onToggleFavourite={toggleFavourite}
            onReorderFavourites={reorderFavourites}
            settings={settings}
            theme={theme}
            onSetTheme={handleSetTheme}
            iconMode={iconMode}
            onToggleIconMode={toggleIconMode}
            onRefresh={handleRefreshActiveTab}
            refreshing={refreshing}
            onSwitchService={handleSwitchService}
            onDisconnect={handleDisconnect}
            onRegionChange={handleRegionChange}
            appVersion={appVersion}
            autoUpdate={autoUpdate}
            onToggleAutoUpdate={toggleAutoUpdate}
            updaterStatus={updaterStatus}
            onCheckForUpdates={handleCheckForUpdates}
            onInstallUpdate={() => window.electronAPI.installUpdate()}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <TitleBar
              tabs={tabs}
              activeTabId={activeTabId}
              onSwitch={setActiveTabId}
              onClose={handleCloseTab}
              onNew={handleNewTab}
              onOpenInNewTab={handleOpenInNewTab}
              onReorder={handleReorderTabs}
            />
            <div className="flex-1 relative overflow-hidden min-h-0">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className="absolute inset-0"
                  style={{ display: activeTabId === tab.id ? 'flex' : 'none', flexDirection: 'column' }}
                >
                  {renderLayout(tab)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </ToastProvider>
  )
}
