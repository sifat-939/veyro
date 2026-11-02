import { FieldTypeEnum, RawValue, Schema } from 'schemas/types';
import test from 'tape';
import { getMapFromList, getValueMapFromList, sleep } from 'utils';
import { getDefaultMetaFieldValueMap, sqliteTypeMap } from '../../helpers';
import DatabaseCore from '../core';
import { FieldValueMap, SqliteTableInfo } from '../types';
import {
  assertDoesNotThrow,
  assertThrows,
  BaseMetaKey,
  getBuiltTestSchemaMap,
} from './helpers';

/**
 * Note: these tests have a strange structure where multiple tests are
 * inside a `specify`, this is cause `describe` doesn't support `async` or waiting
 * on promises.
 *
 * Due to this `async` db operations need to be handled in `specify`. And `specify`
 * can't be nested in the `describe` can, hence the strange structure.
 *
 * This also implies that assert calls should have discriptive
 */

const schemaMap = getBuiltTestSchemaMap();
async function getDb(shouldMigrate: boolean = true): Promise<DatabaseCore> {
  const db = new DatabaseCore();
  await db.connect();
  db.setSchemaMap(schemaMap);
  if (shouldMigrate) {
    await db.migrate();
  }
  return db;
}

test('db init, migrate, close', async (t) => {
  const db = new DatabaseCore();
  t.equal(db.dbPath, ':memory:');

  const schemaMap = getBuiltTestSchemaMap();
  db.setSchemaMap(schemaMap);

  // Same Object
  t.equal(schemaMap, db.schemaMap);

  await assertDoesNotThrow(async () => await db.connect());
  t.notEqual(db.knex, undefined);

  await assertDoesNotThrow(async () => await db.migrate());

  await assertDoesNotThrow(async () => await db.close());
});

/**
 * DatabaseCore: Migrate and Check Db
 */

test(`Pre Migrate TableInfo`, async function (t) {
  const db = await getDb(false);
  for (const schemaName in schemaMap) {
    const columns = await db.knex?.raw('pragma table_info(??)', schemaName);
    t.equal(columns.length, 0, `column count ${schemaName}`);
  }
  await db.close();
});

test('Post Migrate TableInfo', async function (t) {
  const db = await getDb();
  for (const schemaName in schemaMap) {
    const schema = schemaMap[schemaName] as Schema;
    const fieldMap = getMapFromList(schema.fields, 'fieldname');
    const columns: SqliteTableInfo[] = await db.knex!.raw(
      'pragma table_info(??)',
      schemaName
    );

    let columnCount = schema.fields.filter(
      (f) => f.fieldtype !== FieldTypeEnum.Table
    ).length;

    if (schema.isSingle) {
      columnCount = 0;
    }

    t.equal(
      columns.length,
      columnCount,
      `${schemaName}:: column count: ${columns.length}, ${columnCount}`
    );

    for (const column of columns) {
      const field = fieldMap[column.name];
      const dbColType = sqliteTypeMap[field.fieldtype];

      t.equal(
        column.name,
        field.fieldname,
        `${schemaName}.${column.name}:: name check: ${column.name}, ${field.fieldname}`
      );

      t.equal(
        column.type.toLowerCase(),
        dbColType,
        `${schemaName}.${column.name}:: type check: ${column.type}, ${dbColType}`
      );

      if (field.required !== undefined) {
        t.equal(
          !!column.notnull,
          field.required,
          `${schemaName}.${column.name}:: iotnull iheck: ${column.notnull}, ${field.required}`
        );
      } else {
        t.equal(
          column.notnull,
          0,
          `${schemaName}.${column.name}:: notnull check: ${column.notnull}, ${field.required}`
        );
      }

      if (column.dflt_value === null) {
        t.equal(
          field.default,
          undefined,
          `${schemaName}.${column.name}:: dflt_value check: ${column.dflt_value}, ${field.default}`
        );
      } else {
        t.equal(
          column.dflt_value.slice(1, -1),
          String(field.default),
          `${schemaName}.${column.name}:: dflt_value check: ${column.type}, ${dbColType}`
        );
      }
    }
  }

  await db.close();
});

test('exists() before insertion', async function (t) {
  const db = await getDb();
  for (const schemaName in schemaMap) {
    const doesExist = await db.exists(schemaName);
    if (['SingleValue', 'SystemSettings'].includes(schemaName)) {
      t.equal(doesExist, true, `${schemaName} exists`);
    } else {
      t.equal(doesExist, false, `${schemaName} exists`);
    }
  }
  await db.close();
});

test('CRUD single values', async function (t) {
  const db = await getDb();
  /**
   * Checking default values which are created when db.migrate
   * takes place.
   */
  let rows: Record<string, RawValue>[] = await db.knex!.raw(
    'select * from SingleValue'
  );
  const defaultMap = getValueMapFromList(
    (schemaMap.SystemSettings as Schema).fields,
    'fieldname',
    'default'
  );
  for (const row of rows) {
    t.equal(
      row.value,
      defaultMap[row.fieldname as string],
      `${row.fieldname} default values equality`
    );
  }

  /**
   * Insertion and updation for single values call the same function.
   *
   * Insert
   */

  let localeRow = rows.find((r) => r.fieldname === 'locale');
  const localeEntryName = localeRow?.name as string;
  const localeEntryCreated = localeRow?.created as string;

  let locale = 'hi-IN';
  await db.insert('SystemSettings', { locale });
  rows = await db.knex!.raw('select * from SingleValue');
  localeRow = rows.find((r) => r.fieldname === 'locale');

  t.notEqual(localeEntryName, undefined, 'localeEntryName');
  t.equal(rows.length, 2, 'rows length insert');
  t.equal(
    localeRow?.name as string,
    localeEntryName,
    `localeEntryName ${localeRow?.name}, ${localeEntryName}`
  );
  t.equal(localeRow?.value, locale, `locale ${localeRow?.value}, ${locale}`);
  t.equal(
    localeRow?.created,
    localeEntryCreated,
    `locale ${localeRow?.value}, ${locale}`
  );

  /**
   * Update
   */
  locale = 'ca-ES';
  await db.update('SystemSettings', { locale });
  rows = await db.knex!.raw('select * from SingleValue');
  localeRow = rows.find((r) => r.fieldname === 'locale');

  t.notEqual(localeEntryName, undefined, 'localeEntryName');
  t.equal(rows.length, 2, 'rows length update');
  t.equal(
    localeRow?.name as string,
    localeEntryName,
    `localeEntryName ${localeRow?.name}, ${localeEntryName}`
  );
  t.equal(localeRow?.value, locale, `locale ${localeRow?.value}, ${locale}`);
  t.equal(
    localeRow?.created,
    localeEntryCreated,
    `locale ${localeRow?.value}, ${locale}`
  );

  /**
   * Delete
   */
  await db.delete('SystemSettings', 'locale');
  rows = await db.knex!.raw('select * from SingleValue');
  t.equal(rows.length, 1, 'delete one');
  await db.delete('SystemSettings', 'dateFormat');
  rows = await db.knex!.raw('select * from SingleValue');
  t.equal(rows.length, 0, 'delete two');

  const dateFormat = 'dd/mm/yy';
  await db.insert('SystemSettings', { locale, dateFormat });
  rows = await db.knex!.raw('select * from SingleValue');
  t.equal(rows.length, 2, 'delete two');

  /**
   * Read
   *
   * getSingleValues
   */
  const svl = await db.getSingleValues('locale', 'dateFormat');
  t.equal(svl.length, 2, 'getSingleValues length');
  for (const sv of svl) {
    t.equal(sv.parent, 'SystemSettings', `singleValue parent ${sv.parent}`);
    t.equal(
      sv.value,
      { locale, dateFormat }[sv.fieldname],
      `singleValue value ${sv.value}`
    );

    /**
     * get
     */
    const svlMap = await db.get('SystemSettings');
    t.equal(Object.keys(svlMap).length, 2, 'get key length');
    t.equal(svlMap.locale, locale, 'get locale');
    t.equal(svlMap.dateFormat, dateFormat, 'get locale');
  }

  await db.close();
});

test('CRUD nondependent schema', async function (t) {
  const db = await getDb();
  const schemaName = 'Customer';
  let rows = await db.knex!(schemaName);
  t.equal(rows.length, 0, 'rows length before insertion');

  /**
   * Insert
   */
  const metaValues = getDefaultMetaFieldValueMap();
  const name = 'John Thoe';

  await assertThrows(
    async () => await db.insert(schemaName, { name }),
    'insert() did not throw without meta values'
  );

  const updateMap = Object.assign({}, metaValues, { name });
  await db.insert(schemaName, updateMap);
  rows = await db.knex!(schemaName);
  let firstRow = rows?.[0];
  t.equal(rows.length, 1, `rows length insert ${rows.length}`);
  t.equal(firstRow.name, name, `name check ${firstRow.name}, ${name}`);
  t.equal(firstRow.email, null, `email check ${firstRow.email}`);

  for (const key in metaValues) {
    t.equal(firstRow[key], metaValues[key as BaseMetaKey], `${key} check`);
  }

  /**
   * Update
   */
  const email = 'john@thoe.com';
  await sleep(1); // required for modified to change
  await db.update(schemaName, {
    name,
    email,
    modified: new Date().toISOString(),
  });
  rows = await db.knex!(schemaName);
  firstRow = rows?.[0];
  t.equal(rows.length, 1, `rows length update ${rows.length}`);
  t.equal(firstRow.name, name, `name check update ${firstRow.name}, ${name}`);
  t.equal(firstRow.email, email, `email check update ${firstRow.email}`);

  const phone = '8149133530';
  await sleep(1);
  await db.update(schemaName, {
    name,
    phone,
    modified: new Date().toISOString(),
  });
  rows = await db.knex!(schemaName);
  firstRow = rows?.[0];
  t.equal(firstRow.email, email, `email check update ${firstRow.email}`);
  t.equal(firstRow.phone, phone, `email check update ${firstRow.phone}`);

  for (const key in metaValues) {
    const val = firstRow[key];
    const expected = metaValues[key as BaseMetaKey];
    if (key !== 'modified') {
      t.equal(val, expected, `${key} check ${val}, ${expected}`);
    } else {
      t.notEqual(val, expected, `${key} check ${val}, ${expected}`);
    }
  }

  /**
   * Delete
   */
  await db.delete(schemaName, name);
  rows = await db.knex!(schemaName);
  t.equal(rows.length, 0, `rows length delete ${rows.length}`);

  /**
   * Get
   */
  let fvMap = await db.get(schemaName, name);
  t.equal(
    Object.keys(fvMap).length,
    0,
    `key count get ${JSON.stringify(fvMap)}`
  );

  /**
   * > 1 entries
   */

  const cOne = { name: 'John Whoe', ...getDefaultMetaFieldValueMap() };
  const cTwo = { name: 'Jane Whoe', ...getDefaultMetaFieldValueMap() };

  // Insert
  await db.insert(schemaName, cOne);
  t.equal((await db.knex!(schemaName)).length, 1, `rows length minsert`);
  await db.insert(schemaName, cTwo);
  rows = await db.knex!(schemaName);
  t.equal(rows.length, 2, `rows length minsert`);

  const cs = [cOne, cTwo];
  for (const i in cs) {
    for (const k in cs[i]) {
      const val = cs[i][k as BaseMetaKey];
      t.equal(
        rows?.[i]?.[k],
        val,
        `equality check ${i} ${k} ${val} ${rows?.[i]?.[k]}`
      );
    }
  }

  // Update
  await db.update(schemaName, { name: cOne.name, email });
  const cOneEmail = await db.get(schemaName, cOne.name, 'email');
  t.equal(cOneEmail.email, email, `mi update check one ${cOneEmail}`);
  const cTwoEmail = await db.get(schemaName, cTwo.name, 'email');
  t.equal(cOneEmail.email, email, `mi update check two ${cTwoEmail}`);

  // Rename
  const newName = 'Johnny Whoe';
  await db.rename(schemaName, cOne.name, newName);

  fvMap = await db.get(schemaName, cOne.name);
  t.equal(
    Object.keys(fvMap).length,
    0,
    `mi rename check old ${JSON.stringify(fvMap)}`
  );

  fvMap = await db.get(schemaName, newName);
  t.equal(fvMap.email, email, `mi rename check new ${JSON.stringify(fvMap)}`);

  // Delete
  await db.delete(schemaName, newName);
  rows = await db.knex!(schemaName);
  t.equal(rows.length, 1, `mi delete length ${rows.length}`);
  t.equal(rows[0].name, cTwo.name, `mi delete name ${rows[0].name}`);
  await db.close();
});

test('CRUD dependent schema', async function (t) {
  const db = await getDb();

  const Customer = 'Customer';
  const SalesInvoice = 'SalesInvoice';
  const SalesInvoiceItem = 'SalesInvoiceItem';

  const customer: FieldValueMap = {
    name: 'John Whoe',
    email: 'john@whoe.com',
    ...getDefaultMetaFieldValueMap(),
  };

  const invoice: FieldValueMap = {
    name: 'SINV-1001',
    date: '2022-01-21',
    customer: customer.name,
    account: 'Debtors',
    submitted: false,
    cancelled: false,
    ...getDefaultMetaFieldValueMap(),
  };

  await assertThrows(
    async () => await db.insert(SalesInvoice, invoice),
    'foreign key constraint fail failed'
  );

  await assertDoesNotThrow(async () => {
    await db.insert(Customer, customer);
    await db.insert(SalesInvoice, invoice);
  }, 'insertion failed');

  await assertThrows(
    async () => await db.delete(Customer, customer.name as string),
    'foreign key constraint fail failed'
  );

  await assertDoesNotThrow(async () => {
    await db.delete(SalesInvoice, invoice.name as string);
    await db.delete(Customer, customer.name as string);
  }, 'deletion failed');

  await db.insert(Customer, customer);
  await db.insert(SalesInvoice, invoice);

  let fvMap = await db.get(SalesInvoice, invoice.name as string);
  for (const key in invoice) {
    let expected = invoice[key];
    if (typeof expected === 'boolean') {
      expected = +expected;
    }

    t.equal(
      fvMap[key],
      expected,
      `equality check ${key}: ${fvMap[key]}, ${invoice[key]}`
    );
  }

  t.equal((fvMap.items as unknown[])?.length, 0, 'empty items check');

  const items: FieldValueMap[] = [
    {
      item: 'Bottle Caps',
      quantity: 2,
      rate: 100,
      amount: 200,
    },
  ];

  await assertThrows(
    async () => await db.insert(SalesInvoice, { name: invoice.name, items }),
    'invoice insertion with ct did not fail'
  );
  await assertDoesNotThrow(
    async () => await db.update(SalesInvoice, { name: invoice.name, items }),
    'ct insertion failed'
  );

  fvMap = await db.get(SalesInvoice, invoice.name as string);
  const ct = fvMap.items as FieldValueMap[];
  t.equal(ct.length, 1, `ct length ${ct.length}`);
  t.equal(ct[0].parent, invoice.name, `ct parent ${ct[0].parent}`);
  t.equal(
    ct[0].parentFieldname,
    'items',
    `ct parentFieldname ${ct[0].parentFieldname}`
  );
  t.equal(
    ct[0].parentSchemaName,
    SalesInvoice,
    `ct parentSchemaName ${ct[0].parentSchemaName}`
  );
  for (const key in items[0]) {
    t.equal(
      ct[0][key],
      items[0][key],
      `ct values ${key}: ${ct[0][key]}, ${items[0][key]}`
    );
  }

  items.push({
    item: 'Mentats',
    quantity: 4,
    rate: 200,
    amount: 800,
  });
  await assertDoesNotThrow(
    async () => await db.update(SalesInvoice, { name: invoice.name, items }),
    'ct updation failed'
  );

  let rows = await db.getAll(SalesInvoiceItem, {
    fields: ['item', 'quantity', 'rate', 'amount'],
  });
  t.equal(rows.length, 2, `ct length update ${rows.length}`);

  for (const i in rows) {
    for (const key in rows[i]) {
      t.equal(
        rows[i][key],
        items[i][key],
        `ct values ${i},${key}: ${rows[i][key]}`
      );
    }
  }

  invoice.date = '2022-04-01';
  invoice.modified = new Date().toISOString();
  await db.update('SalesInvoice', {
    name: invoice.name,
    date: invoice.date,
    modified: invoice.modified,
  });

  rows = await db.knex!(SalesInvoiceItem);
  t.equal(rows.length, 2, `postupdate ct empty ${rows.length}`);

  await db.delete(SalesInvoice, invoice.name as string);
  rows = await db.getAll(SalesInvoiceItem);
  t.equal(rows.length, 0, `ct length delete ${rows.length}`);

  await db.close();
});

test('db deleteAll', async (t) => {
  const db = await getDb();

  const emailOne = 'one@temp.com';
  const emailTwo = 'two@temp.com';
  const emailThree = 'three@temp.com';

  const phoneOne = '1';
  const phoneTwo = '2';

  const customers = [
    { name: 'customer-a', phone: phoneOne, email: emailOne },
    { name: 'customer-b', phone: phoneOne, email: emailOne },
    { name: 'customer-c', phone: phoneOne, email: emailTwo },
    { name: 'customer-d', phone: phoneOne, email: emailTwo },
    { name: 'customer-e', phone: phoneTwo, email: emailTwo },
    { name: 'customer-f', phone: phoneTwo, email: emailThree },
    { name: 'customer-g', phone: phoneTwo, email: emailThree },
  ];

  for (const { name, email, phone } of customers) {
    await db.insert('Customer', {
      name,
      email,
      phone,
      ...getDefaultMetaFieldValueMap(),
    });
  }

  // Get total count
  t.equal((await db.getAll('Customer')).length, customers.length);
  t.equal(
    await db.count('Customer'),
    customers.length,
    'SQL count returns all rows'
  );
  t.equal(
    await db.count('Customer', { filters: { email: emailOne } }),
    2,
    'SQL count applies filters without loading rows'
  );
  t.equal(
    (await db.getAll('Customer', { offset: 2, limit: 2 })).length,
    2,
    'getAll supports bounded page queries'
  );

  // Single filter
  t.equal(
    await db.deleteAll('Customer', { email: emailOne }),
    customers.filter((c) => c.email === emailOne).length
  );
  t.equal(
    (await db.getAll('Customer', { filters: { email: emailOne } })).length,
    0
  );

  // Multiple filters
  t.equal(
    await db.deleteAll('Customer', { email: emailTwo, phone: phoneTwo }),
    customers.filter(
      ({ phone, email }) => email === emailTwo && phone === phoneTwo
    ).length
  );
  t.equal(
    await db.deleteAll('Customer', { email: emailTwo, phone: phoneTwo }),
    0
  );

  // Includes filters
  t.equal(
    await db.deleteAll('Customer', { email: ['in', [emailTwo, emailThree]] }),
    customers.filter(
      ({ email, phone }) =>
        [emailTwo, emailThree].includes(email) &&
        !(phone === phoneTwo && email === emailTwo)
    ).length
  );
  t.equal(
    (
      await db.getAll('Customer', {
        filters: { email: ['in', [emailTwo, emailThree]] },
      })
    ).length,
    0
  );

  await db.close();
});

test('nullable IN filters remain inside other query and delete conditions', async (t) => {
  const db = await getDb();
  try {
    for (const [name, email, phone] of [
      ['keep-null', 'allowed', null],
      ['keep-value', 'allowed', '0'],
      ['other-null', 'other', null],
      ['other-value', 'allowed', '9'],
    ]) {
      await db.insert('Customer', {
        name,
        email,
        phone,
        ...getDefaultMetaFieldValueMap(),
      });
    }
    const filters = { email: 'allowed', phone: ['in', [null, '0']] };
    const rows = await db.getAll('Customer', { fields: ['name'], filters });
    t.deepEqual(rows.map((row) => row.name).sort(), [
      'keep-null',
      'keep-value',
    ]);
    t.equal(
      await db.count('Customer', { filters }),
      2,
      'count uses grouped conditions'
    );
    t.equal(
      await db.deleteAll('Customer', filters),
      2,
      'delete cannot escape its email condition'
    );
    t.ok(
      await db.exists('Customer', 'other-null'),
      'unrelated null row survives deletion'
    );
  } finally {
    await db.close();
  }
});

test('transaction commit and rollback persist and revert changes correctly', async (t) => {
  const db = await getDb();
  try {
    // Commit scenario
    await db.beginTransaction();
    t.equal(db.isTransactionActive, true, 'transaction is active');
    t.equal(db.transactionDepth, 1, 'transaction depth is 1');
    await db.insert('Customer', {
      name: 'tx-commit-user',
      email: 'commit@test.com',
      ...getDefaultMetaFieldValueMap(),
    });
    await db.commitTransaction();
    t.equal(db.isTransactionActive, false, 'transaction is no longer active');
    t.equal(db.transactionDepth, 0, 'transaction depth is 0');
    t.equal(await db.exists('Customer', 'tx-commit-user'), true, 'committed row exists');

    // Rollback scenario
    await db.beginTransaction();
    await db.insert('Customer', {
      name: 'tx-rollback-user',
      email: 'rollback@test.com',
      ...getDefaultMetaFieldValueMap(),
    });
    await db.rollbackTransaction();
    t.equal(db.isTransactionActive, false, 'transaction is no longer active after rollback');
    t.equal(await db.exists('Customer', 'tx-rollback-user'), false, 'rolled back row does not exist');
  } finally {
    await db.close();
  }
});

test('transaction watchdog timer auto-aborts abandoned transaction and prevents lockups', async (t) => {
  const db = await getDb();
  try {
    db.transactionTimeoutMs = 60; // 60ms timeout for test
    await db.beginTransaction();
    t.equal(db.isTransactionActive, true, 'transaction began');

    await db.insert('Customer', {
      name: 'tx-abandoned-user',
      email: 'abandoned@test.com',
      ...getDefaultMetaFieldValueMap(),
    });

    // Wait for watchdog to trigger (60ms timeout + buffer)
    await sleep(120);

    t.equal(db.isTransactionActive, false, 'watchdog auto-aborted the active transaction');
    t.equal(db.transactionDepth, 0, 'transaction depth reset to 0');
    t.equal(
      await db.exists('Customer', 'tx-abandoned-user'),
      false,
      'abandoned insert was rolled back by watchdog'
    );

    // Verify database is completely operational and not locked
    await db.insert('Customer', {
      name: 'tx-after-watchdog',
      email: 'after@test.com',
      ...getDefaultMetaFieldValueMap(),
    });
    t.equal(
      await db.exists('Customer', 'tx-after-watchdog'),
      true,
      'database is fully functional after watchdog abort'
    );
  } finally {
    await db.close();
  }
});

test('watchdog timer is cleared upon normal commit and rollback', async (t) => {
  const db = await getDb();
  try {
    db.transactionTimeoutMs = 80;

    // Normal commit clears watchdog
    await db.beginTransaction();
    await db.insert('Customer', {
      name: 'tx-cleared-commit',
      email: 'clear-commit@test.com',
      ...getDefaultMetaFieldValueMap(),
    });
    await db.commitTransaction();
    t.equal(db.isTransactionActive, false);

    // Sleep past the watchdog duration to ensure watchdog does not fire after completion
    await sleep(120);
    t.equal(
      await db.exists('Customer', 'tx-cleared-commit'),
      true,
      'committed data remains intact without late watchdog abort'
    );

    // Normal rollback clears watchdog
    await db.beginTransaction();
    await db.rollbackTransaction();
    await sleep(120);
    t.equal(db.isTransactionActive, false);
  } finally {
    await db.close();
  }
});

test('nested transactions handle failure state and reset cleanly in finally block', async (t) => {
  const db = await getDb();
  try {
    await db.beginTransaction();
    t.equal(db.transactionDepth, 1);

    await db.beginTransaction();
    t.equal(db.transactionDepth, 2, 'nested transaction depth is 2');

    // Inner failure rolls back nested level
    await db.rollbackTransaction();
    t.equal(db.transactionDepth, 1, 'nested rollback decrements depth');

    // Outer commit must detect nested failure, trigger full rollback and throw
    let commitFailed = false;
    try {
      await db.commitTransaction();
    } catch (error) {
      commitFailed = true;
      t.match((error as Error).message, /nested operation failed/);
    }
    t.equal(commitFailed, true, 'outer commit was rejected due to nested failure');
    t.equal(db.isTransactionActive, false, 'transaction cleanly closed');
    t.equal(db.transactionDepth, 0, 'depth cleanly reset');

    // Subsequent transaction must succeed cleanly and not be poisoned by past failure
    await db.beginTransaction();
    await db.insert('Customer', {
      name: 'tx-clean-slate',
      email: 'cleanslate@test.com',
      ...getDefaultMetaFieldValueMap(),
    });
    await db.commitTransaction();
    t.equal(await db.exists('Customer', 'tx-clean-slate'), true, 'subsequent transaction succeeded');
  } finally {
    await db.close();
  }
});

test('close is idempotent and handles active transactions and unconnected instances safely', async (t) => {
  // Unconnected instance close
  const unconnDb = new DatabaseCore(':memory:');
  try {
    await unconnDb.close();
    t.pass('closing unconnected db succeeds without throwing');
  } catch (err) {
    t.fail(`closing unconnected db threw: ${err}`);
  }

  // Active transaction closed
  const db = await getDb();
  await db.beginTransaction();
  t.equal(db.isTransactionActive, true);
  await db.close();
  t.equal(db.isTransactionActive, false, 'active transaction cleared on close');
  t.equal(db.knex, undefined, 'knex cleared on close');

  // Double close
  try {
    await db.close();
    t.pass('calling close twice succeeds idempotently');
  } catch (err) {
    t.fail(`double close threw: ${err}`);
  }

  // beginTransaction on disconnected db throws clear error
  try {
    await db.beginTransaction();
    t.fail('beginTransaction on closed db should throw');
  } catch (err) {
    t.equal((err as Error).message, 'Database is not connected');
  }
});

test('nested transaction watchdog timeout aborts entire transaction and recovers cleanly', async (t) => {
  const db = await getDb();
  try {
    db.transactionTimeoutMs = 60;
    await db.beginTransaction();
    t.equal(db.transactionDepth, 1);

    await db.beginTransaction();
    t.equal(db.transactionDepth, 2);

    await db.insert('Customer', {
      name: 'tx-nested-watchdog',
      email: 'nested-watchdog@test.com',
      ...getDefaultMetaFieldValueMap(),
    });

    await sleep(120);

    t.equal(db.isTransactionActive, false, 'nested watchdog auto-aborted transaction');
    t.equal(db.transactionDepth, 0, 'depth reset to 0');
    t.equal(
      await db.exists('Customer', 'tx-nested-watchdog'),
      false,
      'nested insert rolled back'
    );

    // Subsequent operation succeeds
    await db.insert('Customer', {
      name: 'tx-after-nested-watchdog',
      email: 'after-nested@test.com',
      ...getDefaultMetaFieldValueMap(),
    });
    t.equal(
      await db.exists('Customer', 'tx-after-nested-watchdog'),
      true,
      'database is operational after nested watchdog abort'
    );
  } finally {
    await db.close();
  }
});


