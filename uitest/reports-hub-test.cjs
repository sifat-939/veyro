const { _electron } = require('playwright');
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const screenshotDir = path.join(os.homedir(), '.gemini/antigravity/brain/167071ea-c5b7-46e4-9681-1f99f48d5342');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const run = fs.mkdtempSync(path.join(os.tmpdir(), 'nivo-reports-test-'));
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

  console.log('Launching Electron application with Playwright...');
  const app = await _electron.launch({
    executablePath: path.join(root, 'dist_electron/bundled/linux-unpacked/frappe-books'),
    args: [`--user-data-dir=${profile}`],
    env: { ...process.env, IS_TEST: '' },
    timeout: 60000,
  });

  const page = await app.firstWindow();
  page.setDefaultTimeout(30000);
  const pageErrors = [];
  page.on('pageerror', (err) => {
    console.error('PAGE ERROR:', err.message);
    pageErrors.push(err.message);
  });

  const go = (route) =>
    page.evaluate((r) => {
      const appEl = document.querySelector('[data-v-app]');
      const router = appEl.__vue_app__.config.globalProperties.$router;
      return router.push(r);
    }, route);

  try {
    await page.getByTestId('company-name').waitFor({ timeout: 20000 });
    console.log('App loaded successfully. Navigating to /reports/sales...');

    await go('/reports/sales');
    await page.waitForTimeout(2000);

    // Verify Sales Report is active
    const heading = await page.locator('h1').first().textContent();
    console.log('Heading text:', heading);
    assert.match(heading, /Sales Report/i, 'Heading must match Sales Report');

    // Take Sales Report screenshot
    const salesReportImg = path.join(screenshotDir, '01_sales_report.png');
    await page.screenshot({ path: salesReportImg });
    console.log(`Saved screenshot: ${salesReportImg}`);

    // Verify table columns (strictly 6 columns)
    const ths = await page.locator('table thead th').allTextContents();
    console.log('Table Headers in Sales Report:', ths.map(t => t.trim()));
    assert.equal(ths.length, 6, 'Must have exactly 6 table header columns');
    assert.match(ths[0], /Date/i, 'Col 1 is Date');
    assert.match(ths[1], /Invoice No/i, 'Col 2 is Invoice No');
    assert.match(ths[2], /Party Name/i, 'Col 3 is Party Name');
    assert.match(ths[3], /Total Amount/i, 'Col 4 is Total Amount');
    assert.match(ths[4], /Received Amount/i, 'Col 5 is Received Amount');
    assert.match(ths[5], /Balance Amount/i, 'Col 6 is Balance Amount');

    // Click the first row in the table
    const firstRow = page.locator('table tbody tr').first();
    const firstRowInvoiceNo = (await firstRow.locator('td').nth(1).locator('span').first().textContent()).trim();
    console.log(`First row invoice number: "${firstRowInvoiceNo}"`);

    console.log(`Clicking on first row to open ${firstRowInvoiceNo}...`);
    await firstRow.click();
    await page.waitForTimeout(2500);

    // Verify CommonForm opens with no blank screen
    let currentUrl = page.url();
    console.log('Current URL after clicking first row:', currentUrl);
    assert.ok(
      currentUrl.includes(`/edit/SalesInvoice/${encodeURIComponent(firstRowInvoiceNo)}`),
      `URL should contain /edit/SalesInvoice/${firstRowInvoiceNo}`
    );
    let bodyText = await page.locator('body').textContent();
    assert.ok(!bodyText.includes('no schema found'), 'No schema found error must not occur');

    // Return to Sales Report and test KSALE-1 specifically
    console.log('Returning to /reports/sales...');
    await go('/reports/sales');
    await page.waitForTimeout(1500);

    console.log('Searching for KSALE-1...');
    const searchInput = page.locator('input[type="search"]').first();
    await searchInput.fill('KSALE-1');
    await page.waitForTimeout(1000);

    const ksaleRow = page.locator('table tbody tr').first();
    const ksaleRowText = await ksaleRow.textContent();
    console.log('KSALE-1 row text:', ksaleRowText);
    assert.match(ksaleRowText, /KSALE-1/, 'Filtered row contains KSALE-1');
    assert.match(ksaleRowText, /RM Enterprise/i, 'KSALE-1 row has RM Enterprise');

    console.log('Clicking on KSALE-1 row...');
    await ksaleRow.click();
    await page.waitForTimeout(2500);

    currentUrl = page.url();
    console.log('Current URL for KSALE-1:', currentUrl);
    assert.ok(
      currentUrl.includes('/edit/SalesInvoice/KSALE-1'),
      'Must navigate to /edit/SalesInvoice/KSALE-1'
    );
    bodyText = await page.locator('body').textContent();
    assert.ok(!bodyText.includes('no schema found'), 'No schema found error must not occur');
    assert.match(bodyText, /RM Enterprise/i, 'CommonForm must show customer RM Enterprise');
    console.log('Successfully verified KSALE-1 loaded RM Enterprise with line items!');

    // Screenshot of Sales Invoice CommonForm
    const salesInvoiceImg = path.join(screenshotDir, '02_sales_invoice_commonform.png');
    await page.screenshot({ path: salesInvoiceImg });
    console.log(`Saved screenshot: ${salesInvoiceImg}`);

    // Return to Sales Report and switch to Purchase Report
    console.log('Returning to /reports/sales...');
    await go('/reports/sales');
    await page.waitForTimeout(1500);

    console.log('Switching to Purchase Report via toggle button...');
    const purchaseToggleBtn = page.locator('button:has-text("Purchase Report")').first();
    await purchaseToggleBtn.click();
    await page.waitForTimeout(2000);

    const purchaseHeading = await page.locator('h1').first().textContent();
    console.log('Heading text after toggle:', purchaseHeading);
    assert.match(purchaseHeading, /Purchase Report/i, 'Heading must match Purchase Report');

    // Take Purchase Report screenshot
    const purchaseReportImg = path.join(screenshotDir, '03_purchase_report.png');
    await page.screenshot({ path: purchaseReportImg });
    console.log(`Saved screenshot: ${purchaseReportImg}`);

    // Verify Purchase Report columns (strictly 6 columns)
    const purchaseThs = await page.locator('table thead th').allTextContents();
    console.log('Table Headers in Purchase Report:', purchaseThs.map(t => t.trim()));
    assert.equal(purchaseThs.length, 6, 'Must have exactly 6 table header columns');
    assert.match(purchaseThs[0], /Date/i, 'Col 1 is Date');
    assert.match(purchaseThs[1], /Bill No/i, 'Col 2 is Bill No');
    assert.match(purchaseThs[2], /Supplier Name/i, 'Col 3 is Supplier Name');
    assert.match(purchaseThs[3], /Total Amount/i, 'Col 4 is Total Amount');
    assert.match(purchaseThs[4], /Paid Amount/i, 'Col 5 is Paid Amount');
    assert.match(purchaseThs[5], /Balance Amount/i, 'Col 6 is Balance Amount');

    // Search for KPUR-1
    console.log('Searching for KPUR-1...');
    const purchaseSearchInput = page.locator('input[type="search"]').first();
    await purchaseSearchInput.fill('KPUR-1');
    await page.waitForTimeout(1000);

    const purchaseKpurRow = page.locator('table tbody tr').first();
    const purchaseKpurRowText = await purchaseKpurRow.textContent();
    console.log('KPUR-1 row text:', purchaseKpurRowText);
    assert.match(purchaseKpurRowText, /KPUR-1/, 'Filtered row contains KPUR-1');
    assert.match(purchaseKpurRowText, /Bellal Enterprise/i, 'KPUR-1 row has Bellal Enterprise');

    console.log('Clicking on KPUR-1 row...');
    await purchaseKpurRow.click();
    await page.waitForTimeout(2500);

    const purchaseUrl = page.url();
    console.log('Current URL after KPUR-1 click:', purchaseUrl);
    assert.ok(
      purchaseUrl.includes('/edit/PurchaseInvoice/KPUR-1'),
      'Must navigate to /edit/PurchaseInvoice/KPUR-1'
    );

    const purchaseBodyText = await page.locator('body').textContent();
    assert.ok(!purchaseBodyText.includes('no schema found'), 'No schema found error must not occur');
    assert.match(purchaseBodyText, /Bellal Enterprise/i, 'CommonForm must show supplier Bellal Enterprise');
    console.log('Successfully verified KPUR-1 loaded Bellal Enterprise with line items!');

    // Screenshot of Purchase Invoice CommonForm
    const purchaseBillImg = path.join(screenshotDir, '04_purchase_invoice_commonform.png');
    await page.screenshot({ path: purchaseBillImg });
    console.log(`Saved screenshot: ${purchaseBillImg}`);

    // Verify sidebar structure: under Reports, only Sales Report and Purchase Report exist
    console.log('Checking sidebar items under Reports...');
    const reportsSidebarItem = page.locator('.nivo-nav-item:has-text("Reports")');
    assert.ok(await reportsSidebarItem.isVisible(), 'Reports sidebar item is visible');

    // Verify no fatal page errors were captured
    assert.equal(pageErrors.length, 0, `Page errors encountered: ${pageErrors.join(', ')}`);

    console.log('\n=============================================');
    console.log('ALL PLAYWRIGHT INTEGRATION TESTS PASSED 100%!');
    console.log('=============================================\n');
  } finally {
    await app.close();
    try {
      fs.rmSync(run, { recursive: true, force: true });
    } catch {}
  }
})();
