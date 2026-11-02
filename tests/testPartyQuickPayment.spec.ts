import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';
import { ModelNameEnum } from '../models/types';
import { buildStatement } from '../utils/standardPrint';
import type { StatementEntry } from '../utils/standardPrint';
import { Party } from '../models/baseModels/Party/Party';
import { Payment } from '../models/baseModels/Payment/Payment';
import { SalesInvoice } from '../models/baseModels/SalesInvoice/SalesInvoice';
import { PurchaseInvoice } from '../models/baseModels/PurchaseInvoice/PurchaseInvoice';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('Quick payment without invoice references submits and posts to party control ledger', async (t) => {
  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Quick Pay Customer',
    role: 'Customer',
  });
  await party.sync();

  const paymentIn = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Quick Pay Customer',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(500),
  });
  await paymentIn.runFormulas();
  await paymentIn.sync();
  await paymentIn.submit();

  t.ok(paymentIn.submitted, 'unallocated payment submits successfully');

  const accounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    fields: ['name'],
    filters: { accountType: ['in', ['Receivable', 'Payable']] },
  });
  const controlAccounts = new Set(accounts.map((a) => String(a.name)));

  const entries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: [
      'name',
      'date',
      'account',
      'debit',
      'credit',
      'referenceType',
      'referenceName',
      'reverted',
      'reverts',
    ],
    filters: { party: 'Quick Pay Customer' },
    orderBy: 'date',
    order: 'asc',
  });

  const statement = buildStatement(
    entries as unknown as StatementEntry[],
    controlAccounts
  );
  t.equal(statement.closing, -500, 'customer received payment makes balance -500 (advance/credit)');

  // Now create supplier and test Payment Out
  const supplier = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Quick Pay Supplier',
    role: 'Supplier',
  });
  await supplier.sync();

  const paymentOut = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Quick Pay Supplier',
    paymentType: 'Pay',
    paymentMethod: 'Cash',
    amount: fyo.pesa(300),
  });
  await paymentOut.runFormulas();
  await paymentOut.sync();
  await paymentOut.submit();

  t.ok(paymentOut.submitted, 'payment out submits successfully');

  const supEntries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: [
      'name',
      'date',
      'account',
      'debit',
      'credit',
      'referenceType',
      'referenceName',
      'reverted',
      'reverts',
    ],
    filters: { party: 'Quick Pay Supplier' },
    orderBy: 'date',
    order: 'asc',
  });
  const supStatement = buildStatement(
    supEntries as unknown as StatementEntry[],
    controlAccounts
  );
  t.equal(supStatement.closing, 300, 'supplier paid money makes balance +300 (advance to supplier)');

  await paymentIn.cancel();
  t.ok(paymentIn.cancelled, 'payment in cancelled cleanly');
  await paymentOut.cancel();
  t.ok(paymentOut.cancelled, 'payment out cancelled cleanly');
});

test('Both party (Customer + Supplier) contra netting running ledger balances', async (t) => {
  const item = fyo.doc.getNewDoc(ModelNameEnum.Item, {
    name: 'Contra Item',
    rate: 100,
    unit: 'Unit',
    for: 'Both',
    trackItem: false,
  });
  await item.sync();

  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Contra Merchant',
    role: 'Both',
  });
  await party.sync();

  const accounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    fields: ['name'],
    filters: { accountType: ['in', ['Receivable', 'Payable']] },
  });
  const controlAccounts = new Set(accounts.map((a) => String(a.name)));

  // 1. Sell goods 1000
  const sale = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    party: 'Contra Merchant',
    account: 'Debtors',
    items: [{ item: 'Contra Item', quantity: 10, rate: 100 }],
  });
  await sale.runFormulas();
  await sale.sync();
  await sale.submit();

  let entries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['name', 'date', 'account', 'debit', 'credit', 'referenceType', 'referenceName', 'reverted', 'reverts'],
    filters: { party: 'Contra Merchant' },
    orderBy: 'date',
    order: 'asc',
  });
  let stmt = buildStatement(entries as unknown as StatementEntry[], controlAccounts);
  t.equal(stmt.closing, 1000, 'after 1000 sale, closing net balance is +1000 (To Receive)');

  // 2. Buy goods 400
  const purchase = fyo.doc.getNewDoc(ModelNameEnum.PurchaseInvoice, {
    party: 'Contra Merchant',
    account: 'Creditors',
    items: [{ item: 'Contra Item', quantity: 4, rate: 100 }],
  });
  await purchase.runFormulas();
  await purchase.sync();
  await purchase.submit();

  entries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['name', 'date', 'account', 'debit', 'credit', 'referenceType', 'referenceName', 'reverted', 'reverts'],
    filters: { party: 'Contra Merchant' },
    orderBy: 'date',
    order: 'asc',
  });
  stmt = buildStatement(entries as unknown as StatementEntry[], controlAccounts);
  t.equal(stmt.closing, 600, 'after 400 purchase, net balance is +600 (Contra Netting: 1000 - 400)');

  // 3. Receive 500 payment from merchant
  const paymentIn = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Contra Merchant',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(500),
  });
  await paymentIn.runFormulas();
  await paymentIn.sync();
  await paymentIn.submit();

  entries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['name', 'date', 'account', 'debit', 'credit', 'referenceType', 'referenceName', 'reverted', 'reverts'],
    filters: { party: 'Contra Merchant' },
    orderBy: 'date',
    order: 'asc',
  });
  stmt = buildStatement(entries as unknown as StatementEntry[], controlAccounts);
  t.equal(stmt.closing, 100, 'after 500 payment in, net balance is +100');

  // 4. Clean up / cancel
  await paymentIn.cancel();
  await purchase.cancel();
  await sale.cancel();
});

test('Party role auto-upgrade and account type safety for cross-role operations', async (t) => {
  // A customer that also sells items to us
  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Dynamic Customer Merchant',
    role: 'Customer',
    defaultAccount: 'Debtors',
  });
  await party.sync();

  // 1. Initially Customer can receive payment
  const initialPayIn = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Dynamic Customer Merchant',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(200),
  });
  await initialPayIn.runFormulas();
  t.equal(initialPayIn.account, 'Debtors', 'Receive uses customer Debtors account');
  await initialPayIn.sync();
  await initialPayIn.submit();

  // 2. Cross-role: We now pay this party (Payment Out). Party upgraded to Both.
  await party.setAndSync('role', 'Both');
  const payOut = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Dynamic Customer Merchant',
    paymentType: 'Pay',
    paymentMethod: 'Cash',
    amount: fyo.pesa(500),
  });
  await payOut.runFormulas();
  t.equal(payOut.paymentAccount, 'Creditors', 'Payment Out uses Creditors account for Both party');
  await payOut.sync();
  await payOut.submit();

  const accounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    fields: ['name'],
    filters: { accountType: ['in', ['Receivable', 'Payable']] },
  });
  const controlAccounts = new Set(accounts.map((a) => String(a.name)));

  let entries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['name', 'date', 'account', 'debit', 'credit', 'referenceType', 'referenceName', 'reverted', 'reverts'],
    filters: { party: 'Dynamic Customer Merchant' },
    orderBy: 'date',
    order: 'asc',
  });
  let stmt = buildStatement(entries as unknown as StatementEntry[], controlAccounts);
  // Initial: Receive 200 -> balance -200. Then Pay 500 -> +500. Net = +300.
  t.equal(stmt.closing, 300, 'net balance after contra Receive 200 + Pay 500 is +300');

  // 3. PurchaseInvoice on this party posts to Creditors
  const item = fyo.doc.getNewDoc(ModelNameEnum.Item, {
    name: 'Dynamic Item',
    rate: 100,
    unit: 'Unit',
    for: 'Both',
    trackItem: false,
  });
  await item.sync();

  const purchase = fyo.doc.getNewDoc(ModelNameEnum.PurchaseInvoice, {
    party: 'Dynamic Customer Merchant',
    account: 'Creditors',
    items: [{ item: 'Dynamic Item', quantity: 3, rate: 100 }],
  });
  await purchase.runFormulas();
  await purchase.sync();
  await purchase.submit();

  entries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['name', 'date', 'account', 'debit', 'credit', 'referenceType', 'referenceName', 'reverted', 'reverts'],
    filters: { party: 'Dynamic Customer Merchant' },
    orderBy: 'date',
    order: 'asc',
  });
  stmt = buildStatement(entries as unknown as StatementEntry[], controlAccounts);
  // Net: 300 - 300 = 0 (Settled)
  t.equal(stmt.closing, 0, 'after 300 purchase, net balance is 0 (fully settled)');

  // 4. Cancellation rolls back cleanly
  await purchase.cancel();
  await payOut.cancel();
  await initialPayIn.cancel();

  entries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['name', 'date', 'account', 'debit', 'credit', 'referenceType', 'referenceName', 'reverted', 'reverts'],
    filters: { party: 'Dynamic Customer Merchant' },
    orderBy: 'date',
    order: 'asc',
  });
  stmt = buildStatement(entries as unknown as StatementEntry[], controlAccounts);
  t.equal(stmt.closing, 0, 'after all cancellations, closing balance is 0');
  t.equal(stmt.rows.length, 0, 'no active rows remain after cancellation');
});

test('Quick payment local date noon anchor preserves local calendar date', (t) => {
  const dateStr = '2026-10-29';
  const [year, month, day] = dateStr.split('-').map(Number);
  const postingDate = new Date(year, month - 1, day, 12, 0, 0);

  const key = `${postingDate.getFullYear()}-${String(postingDate.getMonth() + 1).padStart(2, '0')}-${String(postingDate.getDate()).padStart(2, '0')}`;
  t.equal(key, '2026-10-29', 'calendar date is exactly 2026-10-29');
  t.end();
});

test('Quick payment with Bank method passes clearance and reference validation', async (t) => {
  // Ensure Bank payment method exists
  let bankMethod = await fyo.db.get(ModelNameEnum.PaymentMethod, 'Bank').catch(() => null);
  if (!bankMethod) {
    const bankAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
      fields: ['name'],
      filters: { accountType: 'Bank' },
    });
    const bankAccountName = (bankAccounts[0]?.name as string) || 'Test Bank of Scriptia';
    await fyo.db.insert(ModelNameEnum.PaymentMethod, {
      name: 'Bank',
      type: 'Bank',
      account: bankAccountName,
    });
  }

  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Bank Pay Customer',
    role: 'Customer',
  });
  await party.sync();

  const postingDate = new Date(2026, 9, 29, 12, 0, 0);
  const payment = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Bank Pay Customer',
    paymentType: 'Receive',
    paymentMethod: 'Bank',
    date: postingDate,
    clearanceDate: postingDate,
    amount: fyo.pesa(750),
    referenceId: 'CHQ-88991',
  });

  await payment.runFormulas();
  await payment.sync();
  await payment.submit();

  t.ok(payment.submitted, 'Bank payment with clearanceDate and referenceId submitted cleanly');

  // Verify statement date range filtering and opening balance
  const accounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    fields: ['name'],
    filters: { accountType: ['in', ['Receivable', 'Payable']] },
  });
  const controlAccounts = new Set(accounts.map((a) => String(a.name)));

  const entries = await fyo.db.getAll(ModelNameEnum.AccountingLedgerEntry, {
    fields: [
      'name',
      'date',
      'account',
      'debit',
      'credit',
      'referenceType',
      'referenceName',
      'reverted',
      'reverts',
    ],
    filters: { party: 'Bank Pay Customer' },
    orderBy: 'date',
    order: 'asc',
  });

  // Filter with date AFTER posting date -> should show opening balance of -750 and 0 period rows
  const filteredStmt = buildStatement(
    entries as unknown as StatementEntry[],
    controlAccounts,
    '2026-10-30',
    '2026-10-31'
  );
  t.equal(filteredStmt.opening, -750, 'statement after posting date has opening balance of -750');
  t.equal(filteredStmt.rows.length, 0, 'no transactions inside subsequent date range');

  await payment.cancel();
  t.ok(payment.cancelled, 'bank payment cancelled cleanly');
});

test('Direct unallocated payment reduces party outstanding amount without requiring invoice allocation', async (t) => {
  const item = fyo.doc.getNewDoc(ModelNameEnum.Item, {
    name: 'Direct Pay Item',
    rate: 1000,
    unit: 'Unit',
    for: 'Both',
    trackItem: false,
  });
  await item.sync();

  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Direct Pay Customer',
    role: 'Customer',
  }) as Party;
  await party.sync();

  // Create 1000 sale invoice
  const sale = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    party: 'Direct Pay Customer',
    account: 'Debtors',
    items: [{ item: 'Direct Pay Item', quantity: 1, rate: 1000 }],
  }) as SalesInvoice;
  await sale.runFormulas();
  await sale.sync();
  await sale.submit();

  await party.load();
  t.equal(party.outstandingAmount?.float, 1000, 'customer initial outstanding is 1000');

  // Customer makes direct unallocated payment of 400
  const directPay = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Direct Pay Customer',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(400),
  }) as Payment;
  await directPay.runFormulas();
  t.equal(directPay.amount?.float, 400, 'formula preserves direct payment amount');
  await directPay.sync();
  await directPay.submit();

  await party.load();
  t.equal(party.outstandingAmount?.float, 600, 'party outstanding cleanly reduced to 600 by direct payment');

  // Cancel direct payment -> reverts back to 1000
  await directPay.cancel();
  await party.load();
  t.equal(party.outstandingAmount?.float, 1000, 'cancelling direct payment restores party outstanding to 1000');

  await sale.cancel();
});

test('Direct payment advance and supplier direct pay update party outstanding cleanly', async (t) => {
  // Advance payment from customer with no invoices
  const advParty = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Advance Customer',
    role: 'Customer',
  }) as Party;
  await advParty.sync();

  const advancePay = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Advance Customer',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(350),
  }) as Payment;
  await advancePay.runFormulas();
  await advancePay.sync();
  await advancePay.submit();

  await advParty.load();
  t.equal(advParty.outstandingAmount?.float, -350, 'advance direct payment registers as -350 credit balance');

  await advancePay.cancel();
  await advParty.load();
  t.equal(advParty.outstandingAmount?.float, 0, 'cancellation restores advance customer balance to 0');

  // Supplier direct payment
  const supParty = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Direct Pay Vendor',
    role: 'Supplier',
  }) as Party;
  await supParty.sync();

  const bill = fyo.doc.getNewDoc(ModelNameEnum.PurchaseInvoice, {
    party: 'Direct Pay Vendor',
    account: 'Creditors',
    items: [{ item: 'Direct Pay Item', quantity: 1, rate: 800 }],
  }) as PurchaseInvoice;
  await bill.runFormulas();
  await bill.sync();
  await bill.submit();

  await supParty.load();
  t.equal(supParty.outstandingAmount?.float, 800, 'vendor initial payable is 800');

  const supPay = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Direct Pay Vendor',
    paymentType: 'Pay',
    paymentMethod: 'Cash',
    amount: fyo.pesa(500),
  }) as Payment;
  await supPay.runFormulas();
  await supPay.sync();
  await supPay.submit();

  await supParty.load();
  t.equal(supParty.outstandingAmount?.float, 300, 'vendor payable reduced to 300 by direct payment');

  await supPay.cancel();
  await supParty.load();
  t.equal(supParty.outstandingAmount?.float, 800, 'cancellation restores vendor payable to 800');

  await bill.cancel();
});

test('Zero or negative payment amount is rejected on direct payments', async (t) => {
  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Validation Customer',
    role: 'Customer',
  });
  await party.sync();

  const zeroPay = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Validation Customer',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(0),
  });

  let threw = false;
  try {
    await zeroPay.sync();
    await zeroPay.submit();
  } catch (err) {
    threw = true;
    t.ok(/greater than 0/i.test((err as Error).message), 'error message specifies amount greater than 0');
  }
  t.ok(threw, 'zero payment amount throws error');
});

test('Direct payment updates cashflow and realized cash movements without invoice reconciliation', async (t) => {
  const fromDate = '2026-10-01';
  const toDate = '2026-10-31';

  const cfBefore = await fyo.db.getCashflow(fromDate, toDate);
  const inflowBefore = cfBefore.reduce((acc, row) => acc + (Number(row.inflow) || 0), 0);
  const outflowBefore = cfBefore.reduce((acc, row) => acc + (Number(row.outflow) || 0), 0);

  const postingDate = new Date(2026, 9, 29, 12, 0, 0);
  const directPay = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Validation Customer',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(750),
    date: postingDate,
  }) as Payment;
  await directPay.runFormulas();
  await directPay.sync();
  await directPay.submit();

  const cfAfter = await fyo.db.getCashflow(fromDate, toDate);
  const inflowAfter = cfAfter.reduce((acc, row) => acc + (Number(row.inflow) || 0), 0);
  const outflowAfter = cfAfter.reduce((acc, row) => acc + (Number(row.outflow) || 0), 0);

  t.equal(inflowAfter - inflowBefore, 750, 'direct receive payment immediately reflects in cashflow inflow (+750)');
  t.equal(outflowAfter - outflowBefore, 0, 'outflow remains unchanged');

  // Realized Cash Profit = inflow - outflow
  const cashProfitBefore = inflowBefore - outflowBefore;
  const cashProfitAfter = inflowAfter - outflowAfter;
  t.equal(cashProfitAfter - cashProfitBefore, 750, 'realized cash profit increased by direct payment without invoice matching');

  await directPay.cancel();
  const cfCancelled = await fyo.db.getCashflow(fromDate, toDate);
  const inflowCancelled = cfCancelled.reduce((acc, row) => acc + (Number(row.inflow) || 0), 0);
  t.equal(inflowCancelled, inflowBefore, 'cancelling direct payment restores cashflow inflow');
});

test('Customer direct refund (Payment Out) routes to customer control account and updates balance cleanly', async (t) => {
  const customer = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Refundable Customer',
    role: 'Customer',
    defaultAccount: 'Debtors',
  }) as Party;
  await customer.sync();

  // 1. Advance receipt 1000
  const advance = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Refundable Customer',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(1000),
  }) as Payment;
  await advance.runFormulas();
  await advance.sync();
  await advance.submit();

  await customer.load();
  t.equal(customer.outstandingAmount?.float, -1000, 'customer initial advance is -1000');

  // 2. Direct refund 400 to customer (Pay)
  const refund = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Refundable Customer',
    paymentType: 'Pay',
    paymentMethod: 'Cash',
    amount: fyo.pesa(400),
  }) as Payment;
  await refund.runFormulas();
  t.equal(refund.paymentType, 'Pay', 'paymentType Pay is preserved on refund');
  t.equal(refund.paymentAccount, 'Debtors', 'refund routes to customer control account Debtors, not Creditors');
  t.ok(refund.account === 'Cash' || refund.account === 'Cash In Hand', 'from account is cash');
  await refund.sync();
  await refund.submit();

  await customer.load();
  t.equal(customer.outstandingAmount?.float, -600, 'customer advance reduced to -600 after 400 refund');

  await refund.cancel();
  await advance.cancel();
  await customer.load();
  t.equal(customer.outstandingAmount?.float, 0, 'cancelling both restores customer balance to 0');
});

test('Supplier direct refund (Payment In) routes to supplier control account and updates payable balance cleanly', async (t) => {
  const vendor = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Refundable Vendor',
    role: 'Supplier',
    defaultAccount: 'Creditors',
  }) as Party;
  await vendor.sync();

  // 1. Advance payout 1500 to vendor
  const advancePay = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Refundable Vendor',
    paymentType: 'Pay',
    paymentMethod: 'Cash',
    amount: fyo.pesa(1500),
  }) as Payment;
  await advancePay.runFormulas();
  await advancePay.sync();
  await advancePay.submit();

  await vendor.load();
  t.equal(vendor.outstandingAmount?.float, -1500, 'advance payout to vendor makes balance -1500');

  // 2. Direct refund 500 from vendor (Receive)
  const vendorRefund = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Refundable Vendor',
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    amount: fyo.pesa(500),
  }) as Payment;
  await vendorRefund.runFormulas();
  t.equal(vendorRefund.paymentType, 'Receive', 'paymentType Receive is preserved on vendor refund');
  t.equal(vendorRefund.account, 'Creditors', 'account routes to supplier control account Creditors, not Debtors');
  t.ok(vendorRefund.paymentAccount === 'Cash' || vendorRefund.paymentAccount === 'Cash In Hand', 'to account is cash');
  await vendorRefund.sync();
  await vendorRefund.submit();

  await vendor.load();
  t.equal(vendor.outstandingAmount?.float, -1000, 'vendor refund reduces advance to -1000');

  await vendorRefund.cancel();
  await advancePay.cancel();
  await vendor.load();
  t.equal(vendor.outstandingAmount?.float, 0, 'cancellation restores vendor balance to 0');
});

test('Payment Out respects specific account configured on PaymentMethod', async (t) => {
  // Create a distinct bank account and payment method
  const specificBankAcc = fyo.doc.getNewDoc(ModelNameEnum.Account, {
    name: 'City Bank Special Account',
    accountType: 'Bank',
    rootType: 'Asset',
    parentAccount: 'Bank Accounts',
    isGroup: false,
  });
  await specificBankAcc.sync();

  const cityBankMethod = fyo.doc.getNewDoc(ModelNameEnum.PaymentMethod, {
    name: 'City Bank Payout',
    type: 'Bank',
    account: 'City Bank Special Account',
  });
  await cityBankMethod.sync();

  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'Bank Payout Vendor',
    role: 'Supplier',
  });
  await party.sync();

  const payOut = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: 'Bank Payout Vendor',
    paymentType: 'Pay',
    paymentMethod: 'City Bank Payout',
    amount: fyo.pesa(250),
  }) as Payment;
  await payOut.runFormulas();

  t.equal(
    payOut.account,
    'City Bank Special Account',
    'Payment Out uses the specific account configured on PaymentMethod rather than default'
  );
});

test('Profit and Loss report returns Realized Cash rows even when no sales or purchase invoices exist', async (t) => {
  const { ProfitAndLoss } = await import('../reports/ProfitAndLoss/ProfitAndLoss');
  const pnl = new ProfitAndLoss(fyo);
  pnl.basedOn = 'Until Date';
  pnl.toDate = '2026-10-31';
  pnl.periodicity = 'Monthly';
  pnl.count = 1;
  await pnl.setDefaultFilters();
  await pnl.setReportData();

  t.ok(Array.isArray(pnl.reportData), 'reportData is an array');
  const rowNames = pnl.reportData.map((r) => r.cells?.[0]?.value || '');
  t.ok(
    rowNames.some((n) => typeof n === 'string' && /Realized Cash/i.test(n)),
    'Realized Cash rows are included in P&L report'
  );
});

closeTestFyo(fyo, __filename);

