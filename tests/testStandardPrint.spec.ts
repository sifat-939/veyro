import { getReportPrintValues, ReportPrintInput } from 'utils/reportPrint';
import test from 'tape';
import fs from 'fs';
import path from 'path';
import { compile } from '@vue/compiler-dom';
import {
  buildStatement,
  dateKey,
  printTemplateFilter,
  printPreviewType,
} from 'utils/standardPrint';
import { migrateStandardPrint } from 'utils/migrateStandardPrint';
import {
  addStandardDocumentValues,
  getStatementValues,
} from 'utils/standardPrintValues';
import {
  normalizeCurrencyText,
  normalizePrintDate,
  wordsWithCurrency,
} from 'utils/printFormat';
import { getTestFyo, setupTestFyo, closeTestFyo } from './helpers';

const template = fs.readFileSync(
  path.resolve('templates/Nivo Standard.All.template.html'),
  'utf8'
);
test('statement date keys preserve local Date calendar days', (t) => {
  t.equal(dateKey(new Date(2026, 0, 2, 23, 59)), '2026-01-02');
  t.equal(dateKey('2026-01-02T23:59:59'), '2026-01-02');
  t.end();
});
test('one standard compiles and accepts invoice / party document selection', (t) => {
  const errors: string[] = [];
  compile(template, {
    onError: (e) => errors.push(e.message),
    onWarn: (e) => errors.push(e.message),
  });
  t.deepEqual(errors, []);
  t.equal(printPreviewType('All'), 'SalesInvoice');
  t.deepEqual(printTemplateFilter('Party'), { type: ['in', ['Party', 'All']] });
  t.end();
});
test('statements use only active control postings, retain opening and include entire To Date', (t) => {
  const row = (
    name: string,
    date: string,
    debit: number,
    credit: number,
    account = 'Debtors',
    reverted = false,
    reverts = ''
  ) => ({
    name,
    date,
    debit,
    credit,
    account,
    reverted,
    reverts,
    referenceType: 'SalesInvoice',
    referenceName: 'INV-' + name,
  });
  const rows = [
    row('1', '2026-01-01T12:00:00', 100, 0),
    row('2', '2026-01-02T23:59:59', 0, 40),
    row('3', '2026-01-03', 500, 0),
    row('4', '2026-01-02', 999, 0, 'Sales'),
    row('5', '2026-01-02', 999, 0, 'Debtors', true),
    row('6', '2026-01-02', 0, 999, 'Debtors', false, '5'),
  ];
  const result = buildStatement(
    rows,
    new Set(['Debtors']),
    '2026-01-02',
    '2026-01-02'
  );
  t.equal(result.opening, 100);
  t.equal(result.closing, 60);
  t.equal(result.credit, 40);
  t.equal(result.rows.length, 1);
  t.throws(() => buildStatement([], new Set(), '2026-03-01', '2026-01-01'));
  const both = buildStatement(
    [row('1', '2026-01-01', 0, 150, 'Creditors')],
    new Set(['Debtors', 'Creditors'])
  );
  t.equal(both.closing, -150, 'supplier payable is a negative net balance');
  t.end();
});
const fyo = getTestFyo();
setupTestFyo(fyo, __filename);
test('template replacement rewires defaults atomically and is idempotent', async (t) => {
  const old = fyo.doc.getNewDoc('PrintTemplate', {
    name: 'Old layout',
    type: 'SalesInvoice',
    template: '<main>Old</main>',
    isCustom: true,
  });
  await old.sync();
  const defaults = await fyo.doc.getDoc('Defaults');
  await defaults.setAndSync('salesInvoicePrintTemplate', 'Old layout');
  const ledgerBefore = await fyo.db.count('AccountingLedgerEntry');
  const remove = fyo.db.delete.bind(fyo.db);
  fyo.db.delete = async (schema, name) => {
    if (schema === 'PrintTemplate')
      throw new Error('simulated template deletion failure');
    return remove(schema, name);
  };
  try {
    await migrateStandardPrint(fyo, template);
    t.fail('must roll back');
  } catch (e) {
    t.match(String(e), /simulated/);
  } finally {
    fyo.db.delete = remove;
  }
  t.equal(await fyo.db.exists('PrintTemplate', 'Old layout'), true);
  t.equal(await fyo.db.exists('PrintTemplate', 'Nivo Standard'), false);
  t.equal(
    (await fyo.doc.getDoc('Defaults')).salesInvoicePrintTemplate,
    'Old layout',
    'default also rolled back'
  );
  await migrateStandardPrint(fyo, template);
  t.equal(await fyo.db.count('PrintTemplate'), 1);
  t.equal(
    (await fyo.doc.getDoc('Defaults')).paymentPrintTemplate,
    'Nivo Standard'
  );
  await migrateStandardPrint(fyo, template);
  t.equal(await fyo.db.count('PrintTemplate'), 1);
  t.equal(
    await fyo.db.count('AccountingLedgerEntry'),
    ledgerBefore,
    'template replacement never posts entries'
  );
});
test('empty party statement is accurate and printable; draft is visibly marked', async (t) => {
  const party = fyo.doc.getNewDoc('Party', {
    name: 'Print test party',
    role: 'Customer',
  });
  await party.sync();
  const values = await getStatementValues(party, '2026-01-01', '2026-12-31');
  t.equal(values.isStatement, true);
  t.equal(values.printRows.length, 1);
  t.equal(values.closingAmount, 0);
  const invoice = fyo.doc.getNewDoc('SalesInvoice', { party: party.name });
  const printed = await addStandardDocumentValues(invoice, {
    items: [],
    grandTotal: '0.00',
  });
  t.equal(printed.printStatus, 'DRAFT');
  t.equal(printed.showPaymentQR, false);
});
test('printing uses this invoice allocation, excludes draft/cancelled receipts, and labels adjustments separately', async (t) => {
  const party = 'Print test party';
  await (
    await fyo.doc.getDoc('AccountingSettings')
  ).setAndSync('enablePartialPayment', true);
  await fyo.doc
    .getNewDoc('Item', {
      name: 'Print sample item',
      unit: 'Unit',
      rate: 100,
      trackItem: false,
    })
    .sync();
  const invoices = [];
  for (let i = 0; i < 2; i++) {
    const invoice = fyo.doc.getNewDoc('SalesInvoice', {
      party,
      items: [{ item: 'Print sample item', quantity: 10, rate: 100 }],
      makeAutoPayment: false,
      makeAutoStockTransfer: false,
    });
    await invoice.sync();
    await invoice.submit();
    invoices.push(invoice);
  }
  const pending = fyo.doc.getNewDoc('Payment', {
    party,
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(50),
    for: [
      {
        referenceType: 'SalesInvoice',
        referenceName: invoices[0].name,
        amount: fyo.pesa(50),
      },
    ],
  });
  await pending.sync();
  const payment = fyo.doc.getNewDoc('Payment', {
    party,
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(500),
    for: invoices.map((invoice, i) => ({
      referenceType: 'SalesInvoice',
      referenceName: invoice.name,
      amount: fyo.pesa(i ? 200 : 300),
    })),
  });
  await payment.sync();
  await payment.submit();
  let values = await addStandardDocumentValues(invoices[0], {
    grandTotal: '1,000.00',
    items: [],
  });
  t.match(
    values.printTotals!.find((row) => row.label === 'Received Amount')!.value!,
    /300[.,]00/,
    'only 300 of the shared receipt belongs to this invoice'
  );
  t.notOk(
    values.printTotals!.some((row) => row.label === 'Settled / Adjusted'),
    'ordinary receipt is not a non-cash adjustment'
  );
  await payment.cancel();
  values = await addStandardDocumentValues(invoices[0], {
    grandTotal: '1,000.00',
    items: [],
  });
  t.match(
    values.printTotals!.find((row) => row.label === 'Received Amount')!.value!,
    /0[.,]00/,
    'cancelled and draft payments never appear as received'
  );
  // A legacy imported adjustment must not be relabelled as a receipt.
  await invoices[0].setAndSync('outstandingAmount', fyo.pesa(900));
  values = await addStandardDocumentValues(invoices[0], {
    grandTotal: '1,000.00',
    items: [],
  });
  t.match(
    values.printTotals!.find((row) => row.label === 'Settled / Adjusted')!
      .value!,
    /100[.,]00/
  );
});
test('print cash labels follow invoice and return payment direction', async (t) => {
  for (const schema of ['SalesInvoice', 'PurchaseInvoice']) {
    for (const isReturn of [false, true]) {
      const doc = fyo.doc.getNewDoc(schema, {
        name: 'Print direction fixture',
        submitted: true,
        returnAgainst: isReturn ? 'Original invoice' : undefined,
        grandTotal: fyo.pesa(isReturn ? -100 : 100),
        baseGrandTotal: fyo.pesa(isReturn ? -100 : 100),
        outstandingAmount: fyo.pesa(isReturn ? -100 : 100),
      });
      const view = await addStandardDocumentValues(doc, { items: [] });
      const receives = (schema === 'SalesInvoice') !== isReturn;
      t.ok(
        view.printTotals!.some(
          (row) => row.label === (receives ? 'Received Amount' : 'Paid Amount')
        ),
        `${schema}${isReturn ? ' return' : ''} cash direction`
      );
      t.equal(view.showPaymentQR, schema === 'SalesInvoice' && !isReturn);
    }
  }
  for (const paymentType of ['Receive', 'Pay']) {
    const doc = fyo.doc.getNewDoc('Payment', { paymentType });
    const view = await addStandardDocumentValues(doc, { amount: '100.00' });
    t.equal(
      view.printTotals![1].label,
      paymentType === 'Receive' ? 'Amount Received' : 'Amount Paid'
    );
    t.equal(view.showPaymentQR, false);
  }
});
test('report layouts preserve selected columns, row style and filters without requesting payment', (t) => {
  const report: ReportPrintInput = {
    title: 'General Ledger',
    columns: [],
    reportData: [],
    filters: [],
    filterMap: { fromDate: '2026-01-01', toDate: '2026-12-31' },
    fyo,
  };
  report.columns = [
    { fieldname: 'account', label: 'Account', fieldtype: 'Data', width: 2 },
    {
      fieldname: 'debit',
      label: 'Debit',
      fieldtype: 'Currency',
      align: 'right',
      width: 1,
    },
  ];
  report.reportData = [
    {
      cells: [
        { value: 'Cash', rawValue: 'Cash', bold: true },
        { value: '50.00', rawValue: 50 },
      ],
    },
  ];
  report.filters = [
    { fieldname: 'fromDate', label: 'From Date', fieldtype: 'Date' },
    { fieldname: 'toDate', label: 'To Date', fieldtype: 'Date' },
  ];
  const view = getReportPrintValues(report, 1, 1, [true, false]);
  t.equal(view.showPaymentQR, false);
  t.equal(view.showTerms, false);
  t.equal(view.printColumns.length, 1);
  t.equal(view.printRows[0]['0'], 'Cash');
  t.equal(view.printRows[0]._cellStyles['0'].fontWeight, '700');
  t.ok(view.printMetaLeft.some((field) => field.label === 'From Date'));
  t.equal(
    report.reportData[0].cells.length,
    2,
    'printing does not mutate report data'
  );
  t.end();
});
test('voucher policies have document-specific columns and never request another payment', async (t) => {
  for (const [schema, title] of [
    ['Expense', 'Expense Voucher'],
    ['SalaryPayment', 'Salary Payment Voucher'],
    ['Shipment', 'Delivery Note'],
    ['PurchaseReceipt', 'Goods Receipt'],
    ['StockMovement', 'Stock Movement'],
  ]) {
    const doc = fyo.doc.getNewDoc(schema);
    const view = await addStandardDocumentValues(doc, { items: [] });
    t.equal(view.printTitle, title);
    t.equal(view.showPaymentQR, false);
    t.equal(view.showTerms, false);
    t.ok(Array.isArray(view.printMetaRight));
  }
});
test('unified printFormat centralizes currency, date and words formatting', (t) => {
  t.equal(normalizeCurrencyText('৳ 500.00'), 'Tk. 500.00');
  t.equal(normalizeCurrencyText('৳500.00'), 'Tk. 500.00');
  t.equal(normalizeCurrencyText('৳   1,250.75'), 'Tk. 1,250.75');
  t.equal(normalizeCurrencyText('$ 100.00'), '$ 100.00');
  t.equal(normalizeCurrencyText(''), '');
  t.equal(normalizeCurrencyText(100), '100');
  t.equal(normalizeCurrencyText(0), '0');
  t.equal(normalizeCurrencyText(null), '');
  t.equal(normalizeCurrencyText(undefined), '');

  t.equal(normalizePrintDate('2026-03-15'), '15 Mar 2026');
  t.equal(normalizePrintDate('2026-03-15T12:00:00'), '15 Mar 2026');
  t.equal(normalizePrintDate(new Date(2026, 2, 15)), '15 Mar 2026');
  t.equal(normalizePrintDate(1773532800000), '15 Mar 2026');
  t.equal(normalizePrintDate(''), '');
  t.equal(normalizePrintDate(null), '');
  t.equal(normalizePrintDate(undefined), '');
  t.equal(normalizePrintDate(new Date(NaN)), '');
  t.equal(normalizePrintDate('invalid-date'), '');

  t.equal(
    wordsWithCurrency(1250, 'BDT'),
    'One Thousand Two Hundred And Fifty Taka Only'
  );
  t.equal(
    wordsWithCurrency(1250.5, 'BDT'),
    'One Thousand Two Hundred And Fifty Taka and Fifty Paisa Only'
  );
  t.equal(wordsWithCurrency(500, 'INR'), 'Five Hundred Rupees Only');
  t.equal(
    wordsWithCurrency(500.5, 'INR'),
    'Five Hundred Rupees and Fifty Paisa Only'
  );
  t.equal(wordsWithCurrency(100, 'USD'), 'One Hundred Dollars Only');
  t.equal(
    wordsWithCurrency(100.25, 'USD'),
    'One Hundred Dollars and Twenty Five Cents Only'
  );
  t.equal(wordsWithCurrency(50, 'EUR'), 'Fifty Euros Only');
  t.equal(
    wordsWithCurrency(50.75, 'EUR'),
    'Fifty Euros and Seventy Five Cents Only'
  );
  t.equal(wordsWithCurrency(75, undefined, 'BDT'), 'Seventy Five Taka Only');
  t.equal(wordsWithCurrency(100, 'GBP'), 'One Hundred GBP Only');
  t.equal(
    wordsWithCurrency(100.5, 'GBP'),
    'One Hundred GBP and Fifty Pence Only'
  );
  t.equal(wordsWithCurrency(0, 'BDT'), 'Zero Taka Only');
  t.equal(wordsWithCurrency(0.5, 'USD'), 'Zero Dollars and Fifty Cents Only');
  t.equal(wordsWithCurrency(100), 'One Hundred only');
  t.equal(wordsWithCurrency(100.5), 'One Hundred and Fifty Paisa only');
  t.end();
});
closeTestFyo(fyo, __filename);
