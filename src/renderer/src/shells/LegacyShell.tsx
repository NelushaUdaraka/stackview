import NavRail from '../components/common/NavRail'
import TitleBar from '../components/common/TitleBar'
import ServiceBand from '../components/common/ServiceBand'
import type { ShellProps } from './types'

/**
 * The app's original composition — icon NavRail, chrome tabs, ServiceBand — kept as
 * the shell for the default theme so an upgrade changes nothing until the user picks
 * one of the eight directions.
 */
export default function LegacyShell(p: ShellProps) {
  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      <NavRail
        favouriteServices={p.pinnedServices}
        activeService={p.activeService}
        onSelectService={p.onSelectService}
        onOpenInNewTab={p.onOpenInNewTab}
        onToggleFavourite={p.onToggleFavourite}
        onReorderFavourites={p.onReorderFavourites}
        settings={p.settings}
        theme={p.theme}
        onSetTheme={p.onSetTheme}
        iconMode={p.iconMode}
        onToggleIconMode={p.onToggleIconMode}
        onRefresh={p.onRefresh}
        refreshing={p.refreshing}
        onSwitchService={p.onSwitchService}
        onDisconnect={p.onDisconnect}
        onRegionChange={p.onRegionChange}
        appVersion={p.appVersion}
        autoUpdate={p.autoUpdate}
        onToggleAutoUpdate={p.onToggleAutoUpdate}
        updaterStatus={p.updaterStatus}
        onCheckForUpdates={p.onCheckForUpdates}
        onInstallUpdate={p.onInstallUpdate}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TitleBar
          tabs={p.tabs}
          activeTabId={p.activeTabId}
          onSwitch={p.onSwitchTab}
          onClose={p.onCloseTab}
          onNew={p.onNewTab}
          onOpenInNewTab={p.onOpenInNewTab}
          onReorder={p.onReorderTabs}
        />
        <div className="flex-1 relative overflow-hidden min-h-0">
          {p.tabs.map(tab => (
            <div
              key={tab.id}
              className="absolute inset-0"
              style={{ display: p.activeTabId === tab.id ? 'flex' : 'none', flexDirection: 'column' }}
            >
              {tab.service && (
                <ServiceBand
                  service={tab.service}
                  settings={p.settings}
                  effectiveRegion={p.effectiveRegion(tab.service)}
                  iconMode={p.iconMode}
                  onRefresh={p.onRefresh}
                  refreshing={p.refreshing}
                  onChangeRegion={rg => p.onServiceRegionChange(tab.service!, rg)}
                />
              )}
              <div className="flex-1 min-h-0 flex flex-col">
                {tab.service ? p.renderService(tab) : p.renderLauncher(tab)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
