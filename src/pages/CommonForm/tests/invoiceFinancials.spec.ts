import test from 'tape';
import { getTestFyo } from 'tests/helpers';
import { getInvoiceFinancialAmounts } from '../invoiceFinancials';
import {
  formatGroupedQuantities,
  sanitizeVisibleColumns,
} from '../../ListView/helpers';

const fyo = getTestFyo();

test('invoice amounts use company currency and handle drafts, payments, returns and cancellation', (t) => {
  const draft = getInvoiceFinancialAmounts(
    { baseGrandTotal: fyo.pesa(2400), isSubmitted: false },
    fyo
  );
  t.equal(draft.finalAmount.float, 2400, 'final amount uses base currency');
  t.equal(draft.paidAmount.float, 0, 'draft has no paid amount');
  t.equal(draft.dueAmount.float, 2400, 'draft is fully due');

  const partlyPaid = getInvoiceFinancialAmounts(
    {
      baseGrandTotal: fyo.pesa(2400),
      outstandingAmount: fyo.pesa(800),
      isSubmitted: true,
    },
    fyo
  );
  t.equal(
    partlyPaid.paidAmount.float,
    1600,
    'settled/adjusted amount is final minus outstanding, not a payment ledger total'
  );
  t.equal(partlyPaid.dueAmount.float, 800, 'submitted due uses outstanding');

  const returned = getInvoiceFinancialAmounts(
    {
      baseGrandTotal: fyo.pesa(-500),
      outstandingAmount: fyo.pesa(-200),
      isSubmitted: true,
    },
    fyo
  );
  t.equal(
    returned.finalAmount.float,
    500,
    'return amount is displayed positive'
  );
  t.equal(
    returned.paidAmount.float,
    300,
    'return paid amount uses absolute values'
  );
  t.equal(
    returned.dueAmount.float,
    200,
    'return due amount uses absolute values'
  );

  const cancelled = getInvoiceFinancialAmounts(
    {
      baseGrandTotal: fyo.pesa(2400),
      outstandingAmount: fyo.pesa(2400),
      isSubmitted: true,
      isCancelled: true,
    },
    fyo
  );
  t.equal(cancelled.dueAmount.float, 0, 'cancelled invoice has no due');
  t.end();
});

test('saved invoice columns retain hidden and reordered choices safely', (t) => {
  t.deepEqual(
    sanitizeVisibleColumns(
      ['name', 'party', 'date', 'paidAmount', 'dueAmount'],
      ['dueAmount', 'dueAmount', 'invalid', 'name']
    ),
    ['name', 'dueAmount'],
    'forces the document name and drops unknown/duplicate ids without restoring hidden choices'
  );
  t.deepEqual(
    sanitizeVisibleColumns(['name', 'party', 'date'], null),
    ['name'],
    'invalid saved state leaves only the required name column'
  );
  t.end();
});

test('quantity display keeps each unit separate', (t) => {
  t.equal(
    formatGroupedQuantities({ kg: 3.5, piece: 2 }),
    '3.5 kg, 2 piece',
    'keeps unlike units separate in the quantity column'
  );
  t.end();
});

test('getInvoiceFinancialAmounts delegates to invoice.getFinancialAmounts if present', (t) => {
  let called = false;
  const mockInvoice = {
    getFinancialAmounts: () => {
      called = true;
      return {
        finalAmount: fyo.pesa(500),
        paidAmount: fyo.pesa(200),
        dueAmount: fyo.pesa(300),
      };
    },
  };
  const amounts = getInvoiceFinancialAmounts(mockInvoice, fyo);
  t.ok(called, 'delegated to invoice.getFinancialAmounts()');
  t.equal(amounts.finalAmount.float, 500);
  t.equal(amounts.paidAmount.float, 200);
  t.equal(amounts.dueAmount.float, 300);
  t.end();
});

test('getInvoiceFinancialAmounts handles null, undefined, and raw database record shapes safely', (t) => {
  const fromNull = getInvoiceFinancialAmounts(null, fyo);
  t.equal(fromNull.finalAmount.float, 0, 'null invoice has zero finalAmount');
  t.equal(fromNull.paidAmount.float, 0, 'null invoice has zero paidAmount');
  t.equal(fromNull.dueAmount.float, 0, 'null invoice has zero dueAmount');

  const fromUndefined = getInvoiceFinancialAmounts(undefined, fyo);
  t.equal(
    fromUndefined.finalAmount.float,
    0,
    'undefined invoice has zero finalAmount'
  );
  t.equal(
    fromUndefined.paidAmount.float,
    0,
    'undefined invoice has zero paidAmount'
  );
  t.equal(
    fromUndefined.dueAmount.float,
    0,
    'undefined invoice has zero dueAmount'
  );

  const rawSubmitted = getInvoiceFinancialAmounts(
    {
      baseGrandTotal: fyo.pesa(300),
      outstandingAmount: fyo.pesa(100),
      submitted: 1,
    } as any,
    fyo
  );
  t.equal(rawSubmitted.finalAmount.float, 300, 'raw submitted finalAmount');
  t.equal(rawSubmitted.paidAmount.float, 200, 'raw submitted paidAmount');
  t.equal(rawSubmitted.dueAmount.float, 100, 'raw submitted dueAmount');

  const rawCancelled = getInvoiceFinancialAmounts(
    {
      baseGrandTotal: fyo.pesa(300),
      outstandingAmount: fyo.pesa(100),
      submitted: 1,
      cancelled: 1,
    } as any,
    fyo
  );
  t.equal(
    rawCancelled.finalAmount.float,
    300,
    'raw cancelled finalAmount retains grand total'
  );
  t.equal(rawCancelled.paidAmount.float, 0, 'raw cancelled paidAmount is zero');
  t.equal(rawCancelled.dueAmount.float, 0, 'raw cancelled dueAmount is zero');

  t.end();
});
