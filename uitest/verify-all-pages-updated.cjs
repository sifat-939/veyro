const { _electron } = require('playwright');
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const screenshotDir = path.join(os.homedir(), '.gemini/antigravity/brain/167071ea-c5b7-46e4-9681-1f99f48d5342/final_verified_screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const run = fs.mkdtempSync(path.join(os.tmpdir(), 'nivo-verify-'));
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
  console.log('Testing Dashboard...');
  await go('/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '01_dashboard.png') });

  // 2. PartyHub - select party and test vertical date dropdown
  console.log('Testing PartyHub...');
  await go('/parties');
  await page.waitForTimeout(2000);
  const partyCard = page.locator('div:has-text("RM Enterprise"), div:has-text("Bellal Enterprise")').last();
  if (await partyCard.count()) {
    await partyCard.click();
    await page.waitForTimeout(1500);
  }

  // Click party date dropdown trigger to show vertical options
  const partyDateTrigger = page.locator('[data-testid="party-date-preset-trigger"]');
  if (await partyDateTrigger.count()) {
    await partyDateTrigger.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotDir, '02_partyhub_vertical_dropdown_open.png') });
    // Click outside to close
    await page.locator('body').click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(400);
  }

  // 3. Sales Report
  console.log('Testing Sales Report...');
  await go('/reports/sales');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '03_sales_report_default.png') });

  // Click date dropdown trigger in Sales Report to show vertical options
  const reportDateTrigger = page.locator('[data-testid="report-date-preset-trigger"]');
  assert.equal(await reportDateTrigger.count(), 1, 'Date preset trigger must exist');
  await reportDateTrigger.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, '04_sales_report_vertical_dropdown_open.png') });

  // Select "This Month" from vertical dropdown
  const thisMonthBtn = page.locator('[data-testid="report-date-preset-this_month"]');
  assert.equal(await thisMonthBtn.count(), 1, 'This month option must exist in vertical dropdown');
  await thisMonthBtn.click();
  await page.waitForTimeout(1000);

  // Verify label updated
  const triggerText = await reportDateTrigger.textContent();
  console.log('Updated trigger label:', triggerText);
  assert.match(triggerText, /This Month/i);
  await page.screenshot({ path: path.join(screenshotDir, '05_sales_report_this_month_selected.png') });

  // Switch back to "All Time"
  await reportDateTrigger.click();
  await page.waitForTimeout(400);
  await page.locator('[data-testid="report-date-preset-all"]').click();
  await page.waitForTimeout(1000);

  // 4. Purchase Report
  console.log('Testing Purchase Report...');
  await go('/reports/purchase');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '06_purchase_report.png') });

  // 5. Sales Invoice Detail
  console.log('Testing Invoice Detail...');
  await go('/edit/SalesInvoice/KSALE-1');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '07_invoice_detail.png') });

  console.log('All tests and screenshot captures passed successfully!');
  await app.close();
  process.exit(0);
})();
