# StackView

[![Release](https://img.shields.io/github/v/release/NelushaUdaraka/stackview)](https://github.com/NelushaUdaraka/stackview/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows-blue)](https://github.com/NelushaUdaraka/stackview/releases/latest)
[![License](https://img.shields.io/github/license/NelushaUdaraka/stackview)](LICENSE)

A desktop GUI for exploring and managing [LocalStack](https://localstack.cloud/) AWS services.

---

## Features

- Browse and manage 24+ AWS services running on LocalStack
- S3, Lambda, DynamoDB, SQS, SNS, EC2, RDS, and more
- Dark and light themes
- Per-region configuration
- Automatic updates via GitHub Releases

## Prerequisites

- [LocalStack](https://localstack.cloud/) running at `http://localhost:4566`
- Windows 10/11 (x64)

## Installation

Download the latest `StackView-Setup-*.exe` from the [Releases](https://github.com/NelushaUdaraka/stackview/releases/latest) page and run the installer.

## Development

```bash
# Clone
git clone https://github.com/NelushaUdaraka/stackview.git
cd stackview

# Install dependencies
npm install

# Start dev server (Electron + Vite HMR)
npm run dev

# Type-check
npx tsc --noEmit
```

## Building a release locally

```bash
# Produces the NSIS installer in /dist
npm run dist
```

## Releasing a new version

1. Bump `version` in `package.json`
2. Commit and tag:
   ```bash
   git commit -am "chore: bump version to x.y.z"
   git tag vx.y.z
   git push && git push --tags
   ```
3. GitHub Actions builds the NSIS installer and publishes it to the [Releases](https://github.com/NelushaUdaraka/stackview/releases) tab automatically.

## Tech stack

| Layer | Technology |
|-------|------------|
| Shell | Electron 31 |
| UI | React 18 + TypeScript |
| Build | electron-vite + Vite |
| Styling | Tailwind CSS |
| Packaging | electron-builder (NSIS) |
| Updates | electron-updater |
| AWS SDK | AWS SDK for JavaScript v3 |

## License

[MIT](LICENSE)
