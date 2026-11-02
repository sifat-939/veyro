const { _electron } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const screenshotDir = path.join(os.homedir(), '.gemini/antigravity/brain/167071ea-c5b7-46e4-9681-1f99f48d5342/audit_screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const run = fs.mkdtempSync(path.join(os.tmpdir(), 'nivo-audit-'));
  const srcDb = path.join(os.homedir(), '.local/share/nivo/data/Accurate_International_Karbar_20261028_run3.db');
  const testDb = path.join(run, 'test.db');
  fs.copyFileSync(srcDb, testDb);
  if (fs.existsSync(srcDb + '-wal')) fs.copyFileSync(srcDb + '-wal', testDb + '-wal');
  if (fs.existsSync(srcDb + '-shm')) fs.copyFileSync(srcDb + '-shm', testDb + '-shm');

  const profile = path.join(run, 'profile');
  fs.mkdirSync(profile, { recursive: true });
  fs.writeFileSync(
    path.join(profile, 'config.json'),
    JSON.stringify({
      lastSelectedFilePath: testDb,
      files: [
        {
          id: 'test-company',
          companyName: 'ACCURATE INTERNATIONAL — Karbar Import',
          dbPath: testDb,
          openCount: 1,
        },
      ],
    })
  );

  console.log('Launching Electron...');
  const app = await _electron.launch({
    executablePath: path.join(root, 'dist_electron/bundled/linux-unpacked/frappe-books'),
    args: [`--user-data-dir=${profile}`],
    env: { ...process.env, IS_TEST: '' },
    timeout: 60000,
  });

  const page = await app.firstWindow();
  page.setDefaultTimeout(30000);
  await page.getByTestId('company-name').waitFor({ timeout: 20000 });

  const go = (route) =>
    page.evaluate((r) => {
      const appEl = document.querySelector('[data-v-app]');
      const router = appEl.__vue_app__.config.globalProperties.$router;
      return router.push(r);
    }, route);

  // 1. Dashboard
  console.log('Capturing Dashboard...');
  await go('/dashboard');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '01_dashboard.png') });

  // 2. PartyHub
  console.log('Capturing PartyHub default...');
  await go('/parties');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(screenshotDir, '02_partyhub_default.png') });

  // Click on a party (e.g. Bellal Enterprise or RM Enterprise)
  const partyCard = page.locator('div:has-text("RM Enterprise"), div:has-text("Bellal Enterprise")').last();
  if (await partyCard.count()) {
    await partyCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '03_partyhub_selected_ledger.png') });
  }

  // 3. Sales Report
  console.log('Capturing Sales Report...');
  await go('/reports/sales');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(screenshotDir, '04_sales_report.png') });

  // 4. Purchase Report
  console.log('Capturing Purchase Report...');
  await go('/reports/purchase');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(screenshotDir, '05_purchase_report.png') });

  // 5. Sales Invoice Detail
  console.log('Capturing Invoice detail...');
  await go('/edit/SalesInvoice/KSALE-1');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(screenshotDir, '06_invoice_detail.png') });

  console.log('Done capturing screenshots!');
  await app.close();
  process.exit(0);
})();
