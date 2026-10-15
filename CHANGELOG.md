# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### New Features
- Command palette — press `Ctrl+K` (`⌘K` on macOS) to jump to any service; `Ctrl+Enter` opens it in a new tab
- Press `/` on the services page to focus the search box

### Improvements
- Refreshed visual design: retuned Dark and Light palettes with higher text contrast and visible dividers, a shared elevation scale, and consistent focus rings for keyboard navigation
- Redesigned connection screen, services page, navigation rail, tab bar and service header
- Settings menu reorganised with a compact theme picker grouped by light and dark themes, and a Minimal/AWS icon switch
- Region chip in the service header now opens the region picker directly
- Sidebar dividers are now a single hairline with a wider drag area
- Dialogs, menus and toasts animate in consistently, and respect the system "reduce motion" setting
- Native controls (dropdowns, checkboxes, scrollbars) now follow dark themes, and dark-mode text colours apply to every dark theme, not only "Dark"
- Smallest text raised to 10px for readability
- Screen-reader labels for icon-only buttons; toasts are announced without stealing focus

### Fixes
- SQS opened with an empty queue list until Refresh was pressed
- SQS queue reloads ignored a per-service region override
- Connection screen ignored the saved endpoint and region
- Opening IAM crashed the window
- Selecting an SNS topic crashed the window

## [0.1.1] - 2026-05-12

### Improvements
- Update-ready notification surfaced as a floating card in the bottom-right corner — installing no longer requires opening the Settings dropdown
- Status badge dot on the NavRail Settings cog — amber while a new version is downloading, pulsing emerald when an update is ready to install
- Dismissed notification re-arms automatically when a different version becomes available later in the same session

## [0.1.0] - 2026-05-12

### New Features
- Service band on every service tab — shows the service icon, name, label, and active region above the sidebar and content
- Per-service region override — open the gear in the service band to change the region for one service without affecting others, with a small indicator dot and a "Reset to global" action
- Region picker popover with search, scoped to the active service

### Fixes
- Release notes no longer include the markdown reference-link footer from CHANGELOG.md

## [0.0.1] - 2025-01-01

### New Features
- Support for 24+ AWS services on LocalStack (S3, Lambda, DynamoDB, SQS, SNS, EC2, RDS, and more)
- Dark and light themes with per-window persistence
- Per-region configuration
- Windows NSIS installer with per-user install and directory picker
- Auto-update via GitHub Releases

[Unreleased]: https://github.com/NelushaUdaraka/stackview/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/NelushaUdaraka/stackview/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/NelushaUdaraka/stackview/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/NelushaUdaraka/stackview/releases/tag/v0.0.1
