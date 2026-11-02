<div align="center">

  <br />
  <img src="src/assets/brand/veyro-logo-tagline.png" alt="VEYRO — Business, in Balance." width="360" />
  <br /><br />

  # VEYRO

  <p><strong>Business, in Balance.</strong></p>
  <p><em>The sovereign, offline-first desktop business and accounting suite crafted for velocity, elegance, and data privacy.</em></p>
  <p><em>Built on Electron & Vue 3 • Powered by Embedded SQLite • Zero Cloud Dependencies</em></p>

  <br />

  <p>
    <a href="https://github.com/sifat-939/veyro/releases/latest"><img src="https://img.shields.io/github/v/release/sifat-939/veyro?style=for-the-badge&color=0f172a&labelColor=1e293b&logo=github&label=RELEASE" alt="Release" /></a>
    &nbsp;
    <img src="https://img.shields.io/badge/PLATFORM-WINDOWS%20%7C%20LINUX-0f172a?style=for-the-badge&labelColor=1e293b&logo=windows" alt="Platform" />
    &nbsp;
    <a href="LICENSE"><img src="https://img.shields.io/badge/LICENSE-AGPL--3.0-0f172a?style=for-the-badge&labelColor=1e293b" alt="License" /></a>
    &nbsp;
    <img src="https://img.shields.io/badge/DATA-100%25%20OFFLINE%20SQLITE-0f172a?style=for-the-badge&labelColor=1e293b&logo=sqlite" alt="SQLite" />
  </p>

  <p>
    <a href="#-downloads"><strong>Get VEYRO</strong></a> &nbsp;•&nbsp;
    <a href="#-the-veyro-philosophy"><strong>Philosophy</strong></a> &nbsp;•&nbsp;
    <a href="#-core-modules"><strong>Features</strong></a> &nbsp;•&nbsp;
    <a href="#-bengali-user-guide"><strong>Documentation</strong></a> &nbsp;•&nbsp;
    <a href="#-engineering--architecture"><strong>Architecture</strong></a> &nbsp;•&nbsp;
    <a href="#-license--attribution"><strong>License</strong></a>
  </p>

  <br />

  <!-- Adaptive Light/Dark Mode Hero Showcase -->
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/nivo-dashboard-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/nivo-dashboard.png">
    <img alt="VEYRO Interactive Dashboard Preview" src="docs/assets/nivo-dashboard.png" width="94%" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 45px -15px rgba(0,0,0,0.5);">
  </picture>

  <p><sub><em>Interactive Financial Dashboard featuring real-time cash flow monitoring, invoice tracking, and expense analytics.</em></sub></p>

</div>

---

## ⚡ The VEYRO Philosophy

Most business accounting software today is slow, bloated with unused features, and locked behind recurring monthly subscriptions and invasive telemetry.

**VEYRO stands for modern business balance:**

<table width="100%">
  <tr>
    <td width="20%" align="center">
      <h3>💎 V</h3>
      <p><strong>Value</strong><br />Tangible, uninterrupted return for your time and commerce.</p>
    </td>
    <td width="20%" align="center">
      <h3>⚡ E</h3>
      <p><strong>Efficiency</strong><br />Zero-lag local processing and instant keyboard velocity.</p>
    </td>
    <td width="20%" align="center">
      <h3>🏢 Y</h3>
      <p><strong>Your Business</strong><br />100% private, sovereign data. Never shared with cloud servers.</p>
    </td>
    <td width="20%" align="center">
      <h3>📑 R</h3>
      <p><strong>Records</strong><br />Strict, audit-grade double-entry accounting integrity.</p>
    </td>
    <td width="20%" align="center">
      <h3>🔄 O</h3>
      <p><strong>Operations</strong><br />Effortless inventory, party ledger, and payroll workflows.</p>
    </td>
  </tr>
</table>

---

## 📥 Downloads

Ready-to-run release packages for 64-bit systems are available on the [**GitHub Releases Portal**](https://github.com/sifat-939/veyro/releases/latest).

| Platform / Edition | Target OS | Description | Download |
|:---|:---:|:---|:---:|
| **Windows Setup** | Windows 10 / 11 (64-bit) | Standard installer with Desktop icon and Start Menu shortcuts | [**`VEYRO-Setup.exe`**](https://github.com/sifat-939/veyro/releases/download/v0.40.5/VEYRO-v0.40.5-windows-x64-setup.exe) |
| **Windows Portable** | Windows 10 / 11 (64-bit) | Zero-install portable executable; ideal for USB sticks or isolated workflows | [**`VEYRO-Portable.exe`**](https://github.com/sifat-939/veyro/releases/download/v0.40.5/VEYRO-v0.40.5-windows-x64-portable.exe) |
| **Linux AppImage** | Modern 64-bit Linux | Self-contained executable for Ubuntu, Debian, Fedora, Arch, and more | [**`VEYRO.AppImage`**](https://github.com/sifat-939/veyro/releases/download/v0.40.5/VEYRO-v0.40.5-linux-x86_64.AppImage) |
| **Integrity Check** | All Platforms | Cryptographic SHA-256 hashes to verify download authenticity | [**`SHA256SUMS.txt`**](https://github.com/sifat-939/veyro/releases/download/v0.40.5/SHA256SUMS.txt) |

> 💡 **Windows SmartScreen Tip:**  
> Because VEYRO is an open-source, community-distributed build without an enterprise code-signing certificate, Windows SmartScreen may show an *"Unknown Publisher"* warning. Click **"More info"** and then **"Run anyway"** on initial launch.

### Linux Quick Start
```bash
chmod +x VEYRO-v0.40.5-linux-x86_64.AppImage
APPIMAGE_EXTRACT_AND_RUN=1 ./VEYRO-v0.40.5-linux-x86_64.AppImage
```

---

## 📖 Bengali User Guide & Visual Walkthrough

For business owners, accountants, and operators in Bangladesh, we maintain an extensive, illustrated reference manual:

<div align="center">
  <table width="100%">
    <tr>
      <td align="center" style="padding: 20px;">
        <h3>📘 VEYRO Bangla Practical User Guide (PDF)</h3>
        <p><strong>58 comprehensive pages • 52 real-world operational workflows • Complete synthetic screenshot walkthroughs</strong></p>
        <p>Covers opening balances, sales/purchase voucher creation, payment allocations, salary processing, inventory reconciliation, daily accounting checklists, and automated backup management.</p>
        <br />
        <a href="output/pdf/Nivo-Bangla-Guide.pdf"><strong>Download Bengali User Guide (PDF) →</strong></a>
      </td>
    </tr>
  </table>
</div>

---

## ✨ Core Modules

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h3>🧾 Invoicing & Receivables</h3>
      <ul>
        <li><b>Sales & Purchase Invoices:</b> Multi-item billing with discounts, payment tracking, and optional inventory ledger posting.</li>
        <li><b>Payment Allocations:</b> Accurate party ledger settlements, partial payment support, and advance allocations.</li>
        <li><b>Customer & Supplier Ledgers:</b> Complete transaction histories, balances, and print-ready statement generation.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>📊 Financial Intelligence</h3>
      <ul>
        <li><b>Double-Entry General Ledger:</b> Strict debit/credit balance integrity for every posted transaction.</li>
        <li><b>Bank & Cash Management:</b> Real-time cash registers, bank account reconciliation, and fluid liquidity tracking.</li>
        <li><b>Standard Financial Statements:</b> Instant Profit & Loss reports, Balance Sheets, Trial Balances, and Cash Flow charts.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>👥 HR & Payroll Engine</h3>
      <ul>
        <li><b>Employee Directory:</b> Staff records, designations, department classifications, and compensation profiles.</li>
        <li><b>Salary Processing:</b> Monthly salary disbursements with unique period-locking to eliminate duplicate payments.</li>
        <li><b>Salary Vouchers:</b> Audit-compliant expense vouchers and salary distribution slips.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>⚙️ Customization & Control</h3>
      <ul>
        <li><b>Modular Toggles:</b> Adapt the application to your workflow by enabling/disabling modules via <code>Settings → Features</code>.</li>
        <li><b>Print Layout Designer:</b> Clean standard templates with custom logos, branding headers, signatures, and payment terms.</li>
        <li><b>Adaptive UI:</b> Refined dark and light themes crafted for focus and eye comfort during demanding sessions.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🛠️ Engineering & Architecture

VEYRO is engineered using a robust, clean desktop stack:

```
┌────────────────────────────────────────────────────────┐
│                     VEYRO Desktop                      │
│             (Electron Multi-Process Bridge)            │
├──────────────────────────┬─────────────────────────────┤
│      Frontend Layer      │        Backend Layer        │
│   • Vue 3 Composition    │   • Node.js Main Process    │
│   • Tailwind CSS Design  │   • Native IPC Action Demux │
│   • Reactive Stores      │   • Document State Engine   │
├──────────────────────────┴─────────────────────────────┤
│                   Storage & Core Data                  │
│              • Native SQLite3 Engine                   │
│              • Strict Double-Entry Schema              │
│              • Automated Snapshot Backups              │
└────────────────────────────────────────────────────────┘
```

- **Runtime:** [Electron](https://www.electronjs.org/)
- **UI Framework:** [Vue.js 3](https://vuejs.org/) with [Tailwind CSS](https://tailwindcss.com/)
- **Programming Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database Engine:** Embedded [SQLite](https://www.sqlite.org/) via native bindings
- **Testing Suites:** Automated UI regression with Playwright and Tape

---

## 💻 Local Development

### Prerequisites
- **Node.js:** `^22.0.0`
- **Yarn:** Classic `1.22.22`

```bash
# Clone the repository
git clone https://github.com/sifat-939/veyro.git
cd veyro

# Enable Yarn and install frozen dependencies
corepack enable
yarn install --frozen-lockfile --ignore-scripts
node node_modules/electron/install.js
node node_modules/esbuild/install.js
yarn postinstall

# Start VEYRO in local development mode
yarn dev
```

### Verification & Testing
```bash
# Verify TypeScript typing
yarn typecheck

# Run test suite
yarn test:nivo

# Run security and repository privacy checks
python3 scripts/check-repository.py
```

### Packaging & Builds
- **Windows:** `yarn build:windows`
- **Linux:** `yarn build --linux AppImage --x64 --nosign --publish never`

---

## 🔐 Data Privacy Architecture

VEYRO strictly separates application binaries from user company data:
- **Linux Storage:** `~/.local/share/nivo/data/` (preserved for seamless continuity)
- **Windows Storage:** `%APPDATA%\nivo\data\`

All databases, logs, secrets, and private credentials are excluded from version control via `.gitignore`. Rebuilding the application or pushing changes never touches, transmits, or exposes your proprietary accounting records. See [Installation & Storage Specs](docs/installation.md) for details.

---

## 📜 License & Attribution

VEYRO is open-source software licensed under the **GNU Affero General Public License v3.0** ([AGPL-3.0-only](LICENSE)).

- **Upstream Project:** Derived from [Frappe Books](https://github.com/frappe/books) created by [Frappe Technologies Pvt. Ltd.](https://frappe.io).
- All upstream copyrights, trademarks, and the original [Upstream README](docs/upstream-readme.md) are fully acknowledged and preserved.
- Code audits, test coverage, and migration histories are documented in the [Final Audit Report](docs/final-audit-2026-10-29.md).
