import test from 'tape';
import {
  registerWindowCleanup,
  safeRollbackOrphanedTransaction,
} from '../registerIpcMainActionListeners';
import databaseManager from '../../backend/database/manager';
import DatabaseCore from '../../backend/database/core';

test('registerWindowCleanup attaches render-process-gone and closed listeners', (t) => {
  const webContentsEvents: Record<string, Function[]> = {};
  const windowEvents: Record<string, Function[]> = {};

  const fakeWindow: any = {
    webContents: {
      on: (event: string, fn: Function) => {
        webContentsEvents[event] = webContentsEvents[event] ?? [];
        webContentsEvents[event].push(fn);
      },
    },
    on: (event: string, fn: Function) => {
      windowEvents[event] = windowEvents[event] ?? [];
      windowEvents[event].push(fn);
    },
  };

  let cleanedUpCount = 0;
  const mockCleanup = () => {
    cleanedUpCount++;
  };

  registerWindowCleanup(fakeWindow, mockCleanup);

  t.equal(
    webContentsEvents['render-process-gone']?.length,
    1,
    'render-process-gone listener registered on webContents'
  );
  t.equal(
    windowEvents['closed']?.length,
    1,
    'closed listener registered on window'
  );

  // Trigger render-process-gone
  webContentsEvents['render-process-gone'][0]();
  t.equal(cleanedUpCount, 1, 'render-process-gone triggered cleanup');

  // Trigger closed
  windowEvents['closed'][0]();
  t.equal(cleanedUpCount, 2, 'closed triggered cleanup');

  // Verify duplicate registration on same window is guarded by WeakSet
  registerWindowCleanup(fakeWindow, mockCleanup);
  t.equal(
    webContentsEvents['render-process-gone'].length,
    1,
    'duplicate registration does not double-bind render-process-gone'
  );
  t.equal(
    windowEvents['closed'].length,
    1,
    'duplicate registration does not double-bind closed'
  );

  t.end();
});

test('safeRollbackOrphanedTransaction rolls back active database transaction', async (t) => {
  const db = new DatabaseCore(':memory:');
  await db.connect();
  databaseManager.db = db;

  try {
    await db.beginTransaction();
    t.equal(db.isTransactionActive, true, 'transaction is active');

    await safeRollbackOrphanedTransaction();

    t.equal(
      db.isTransactionActive,
      false,
      'safeRollbackOrphanedTransaction rolled back the transaction'
    );
    t.equal(db.transactionDepth, 0, 'transaction depth is reset to 0');
  } finally {
    await db.close();
    delete databaseManager.db;
  }
  t.end();
});

test('safeRollbackOrphanedTransaction survives when no database is connected', async (t) => {
  delete databaseManager.db;
  try {
    await safeRollbackOrphanedTransaction();
    t.pass('safeRollbackOrphanedTransaction completed without throwing');
  } catch (error) {
    t.fail(`Should not throw when db is not connected: ${error}`);
  }
  t.end();
});
