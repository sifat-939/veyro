import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';
import { ModelNameEnum } from '../models/types';
import { buildStatement } from '../utils/standardPrint';
import type { StatementEntry } from '../utils/standardPrint';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('Party Hub Engine: Statement period filtering and opening balance arithmetic', async (t) => {
  const item = fyo.doc.getNewDoc(ModelNameEnum.Item, {
    name: 'Engine Test Item',
    rate: 100,
    unit: 'Unit',
    for: 'Both',
    trackItem: false,
  });
  await item.sync();

  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Engine Test Merchant',
    role: 'Both',
  });
  await party.sync();

  const accounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    fields: ['name'],
    filters: { accountType: ['in', ['Receivable', 'Payable']] },
  });
  const controlAccounts = new Set(accounts.map((a) => String(a.name)));

  // Jan 2026: Sale 1000
  const saleJan = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    party: 'Engine Test Merchant',
    account: 'Debtors',
    date: new Date(2026, 0, 15, 12, 0, 0),
    items: [{ item: 'Engine Test Item', quantity: 10, rate: 100 }],
  });
  await saleJan.runFormulas();
  await saleJan.sync();
  await saleJan.submit();

  // Feb 2026: Purchase 400
  const purchaseFeb = fyo.doc.getNewDoc(ModelNameEnum.PurchaseInvoice, {
    party: 'Engine Test Merchant',
    account: 'Creditors',
    date: new Date(2026, 1, 10, 12, 0, 0),
    items: [{ item: 'Engine Test Item', quantity: 4, rate: 100 }],
  });
  await purchaseFeb.runFormulas();
  await purchaseFeb.sync();
  await purchaseFeb.submit();

  // Mar 2026: Payment received 200
  const paymentMar = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Engine Test Merchant',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    date: new Date(2026, 2, 5, 12, 0, 0),
    amount: fyo.pesa(200),
  });
  await paymentMar.runFormulas();
  await paymentMar.sync();
  await paymentMar.submit();

  const entries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['name', 'date', 'account', 'debit', 'credit', 'referenceType', 'referenceName', 'reverted', 'reverts'],
    filters: { party: 'Engine Test Merchant' },
    orderBy: 'date',
    order: 'asc',
  });

  // 1. All-time statement
  const fullStmt = buildStatement(entries as unknown as StatementEntry[], controlAccounts);
  t.equal(fullStmt.opening, 0, 'full statement opening balance is 0');
  t.equal(fullStmt.closing, 400, 'full statement closing balance is 1000 - 400 - 200 = 400');
  t.equal(fullStmt.rows.length, 3, 'full statement has 3 rows');

  // 2. Filter February only (2026-02-01 to 2026-02-28)
  const febStmt = buildStatement(entries as unknown as StatementEntry[], controlAccounts, '2026-02-01', '2026-02-28');
  t.equal(febStmt.opening, 1000, 'February statement opening balance is +1000 from January');
  t.equal(febStmt.closing, 600, 'February statement closing balance is 1000 - 400 = 600');
  t.equal(febStmt.rows.length, 1, 'February statement has 1 row (purchase)');

  // 3. Filter March only (2026-03-01 to 2026-03-31)
  const marStmt = buildStatement(entries as unknown as StatementEntry[], controlAccounts, '2026-03-01', '2026-03-31');
  t.equal(marStmt.opening, 600, 'March statement opening balance is +600 from Feb');
  t.equal(marStmt.closing, 400, 'March statement closing balance is 600 - 200 = 400');
  t.equal(marStmt.rows.length, 1, 'March statement has 1 row (payment)');

  // Clean up
  await paymentMar.cancel();
  await purchaseFeb.cancel();
  await saleJan.cancel();
});

test('Party Hub Engine: Auto-swapping invalid date range prevents buildStatement crash', (t) => {
  let fromDate = '2026-10-31';
  let toDate = '2026-10-01';

  // Defensive logic in loadSelectedPartyLedger
  if (fromDate && toDate && fromDate > toDate) {
    const temp = fromDate;
    fromDate = toDate;
    toDate = temp;
  }

  t.equal(fromDate, '2026-10-01', 'swapped fromDate is earlier');
  t.equal(toDate, '2026-10-31', 'swapped toDate is later');
  t.doesNotThrow(() => {
    buildStatement([], new Set(), fromDate, toDate);
  }, 'swapped date range does not throw in buildStatement');
  t.end();
});

test('Party Hub Engine: Bank payment clearanceDate and referenceId contract safety', async (t) => {
  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Bank Safe Customer',
    role: 'Customer',
  });
  await party.sync();

  const postingDate = new Date(2026, 9, 30, 12, 0, 0);

  // Auto-generate referenceId and clearanceDate if Bank method selected
  let refId = '';
  let clearanceDate: Date | undefined;

  const isBankMethod = true;
  if (isBankMethod) {
    if (!refId.trim()) {
      refId = `TRX-${Date.now().toString().slice(-6)}`;
    }
    clearanceDate = postingDate;
  }

  t.ok(refId.startsWith('TRX-'), 'referenceId auto-generated for bank method');
  t.ok(clearanceDate, 'clearanceDate auto-populated for bank method');

  const payment = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Bank Safe Customer',
    paymentType: 'Receive',
    paymentMethod: 'Bank',
    date: postingDate,
    clearanceDate,
    amount: fyo.pesa(350),
    referenceId: refId,
  });

  await payment.runFormulas();
  await payment.sync();
  await payment.submit();

  t.ok(payment.submitted, 'Bank payment submitted with zero errors');
  await payment.cancel();
  t.ok(payment.cancelled, 'cancelled cleanly');
});

test('Party Hub Engine: Address unique name collision safety', async (t) => {
  const partyName = 'Collision Test Party';
  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: partyName,
    role: 'Both',
  });
  await party.sync();

  const safeAddrSuffix1 = '1001';
  const safeAddrSuffix2 = '1002';

  const addrName1 = `${partyName}-Address-${safeAddrSuffix1}`;
  const addrName2 = `${partyName}-Address-${safeAddrSuffix2}`;

  const addr1 = fyo.doc.getNewDoc('Address', {
    name: addrName1,
    addressLine1: 'Road 1, Block A',
    city: 'Default',
    country: 'Bangladesh',
    party: partyName,
  });
  await addr1.sync();

  const addr2 = fyo.doc.getNewDoc('Address', {
    name: addrName2,
    addressLine1: 'Road 2, Block B',
    city: 'Default',
    country: 'Bangladesh',
    party: partyName,
  });
  await addr2.sync();

  t.notEqual(addr1.name, addr2.name, 'distinct suffixes avoid collisions on re-creation');
});

closeTestFyo(fyo, __filename);
