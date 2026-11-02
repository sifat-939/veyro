const { _electron } = require('playwright');
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const screenshotDir = path.join(os.homedir(), '.gemini/antigravity/brain/167071ea-c5b7-46e4-9681-1f99f48d5342/minimized_settings');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const run = fs.mkdtempSync(path.join(os.tmpdir(), 'nivo-settings-verify-'));
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
    args: ['--user-data-dir=' + profile],
    env: { ...process.env, IS_TEST: '' },
  });

  const page = await app.firstWindow();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('Navigating to Settings via sidebar click...');
  await page.locator('.nivo-nav-item', { hasText: 'Settings' }).click();
  await page.waitForTimeout(1500);

  // Tab labels in Settings sidebar
  const tabLocator = page.locator('.sticky.bottom-0 .cursor-pointer');
  const tabTexts = await tabLocator.allInnerTexts();
  console.log('Detected settings tabs:', tabTexts);
  assert.deepEqual(tabTexts, ['General', 'Inventory', 'Defaults', 'Print', 'System']);

  // Screenshot Tab 1: General
  await page.screenshot({ path: path.join(screenshotDir, '01_settings_general.png') });
  console.log('Captured 01_settings_general.png');

  // Tab 2: Inventory
  await page.locator('.sticky.bottom-0 .cursor-pointer', { hasText: 'Inventory' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, '02_settings_inventory.png') });
  console.log('Captured 02_settings_inventory.png');

  // Tab 3: Defaults
  await page.locator('.sticky.bottom-0 .cursor-pointer', { hasText: 'Defaults' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, '03_settings_defaults.png') });
  console.log('Captured 03_settings_defaults.png');

  // Tab 4: Print
  await page.locator('.sticky.bottom-0 .cursor-pointer', { hasText: 'Print' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, '04_settings_print.png') });
  console.log('Captured 04_settings_print.png');

  // Tab 5: System
  await page.locator('.sticky.bottom-0 .cursor-pointer', { hasText: 'System' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, '05_settings_system.png') });
  console.log('Captured 05_settings_system.png');

  console.log('SUCCESS: All 5 settings tabs verified and captured cleanly!');
  await app.close();
  fs.rmSync(run, { recursive: true, force: true });
})();
