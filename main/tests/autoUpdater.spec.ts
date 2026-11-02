import test from 'tape';
import {
  broadcastUpdateState,
  checkForAppUpdates,
  downloadAppUpdate,
  getUpdateState,
  handleUpdaterError,
  quitAndInstallAppUpdate,
  registerAutoUpdaterListeners,
  AppUpdaterLike,
} from '../registerAutoUpdaterListeners';
import { isNetworkError } from '../helpers';
import { IPC_CHANNELS } from '../../utils/messages';
import { UpdateState } from '../../utils/ipc/types';

test('isNetworkError correctly identifies network errors and non-network errors', (t) => {
  t.equal(isNetworkError(null), false, 'null is not network error');
  t.equal(isNetworkError(undefined), false, 'undefined is not network error');
  t.equal(
    isNetworkError(new Error('SyntaxError: unexpected token')),
    false,
    'syntax error is not network error'
  );

  t.equal(
    isNetworkError(new Error('net::ERR_INTERNET_DISCONNECTED')),
    true,
    'net::ERR_INTERNET_DISCONNECTED is network error'
  );
  t.equal(
    isNetworkError(new Error('net::ERR_CONNECTION_TIMED_OUT')),
    true,
    'net::ERR_CONNECTION_TIMED_OUT is network error'
  );

  const dnsErr = new Error('getaddrinfo ENOTFOUND api.github.com');
  (dnsErr as NodeJS.ErrnoException).code = 'ENOTFOUND';
  t.equal(isNetworkError(dnsErr), true, 'ENOTFOUND is network error');

  const refusedErr = new Error('connect ECONNREFUSED 127.0.0.1:443');
  (refusedErr as NodeJS.ErrnoException).code = 'ECONNREFUSED';
  t.equal(isNetworkError(refusedErr), true, 'ECONNREFUSED is network error');

  const timeoutErr = new Error('connect ETIMEDOUT');
  (timeoutErr as NodeJS.ErrnoException).code = 'ETIMEDOUT';
  t.equal(isNetworkError(timeoutErr), true, 'ETIMEDOUT is network error');

  t.end();
});

test('broadcastUpdateState dispatches state updates and notifies renderer window', (t) => {
  const sentMessages: { channel: string; data: UpdateState }[] = [];
  const fakeMain: any = {
    updateState: {
      status: 'idle',
      currentVersion: '0.40.5',
    },
    mainWindow: {
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => false,
        send: (channel: string, data: UpdateState) => {
          sentMessages.push({ channel, data });
        },
      },
    },
  };

  const next1 = broadcastUpdateState(fakeMain, {
    status: 'checking',
  });
  t.equal(next1.status, 'checking', 'status transitioned to checking');
  t.equal(sentMessages.length, 1, 'sent 1 message');
  t.equal(
    sentMessages[0].channel,
    IPC_CHANNELS.UPDATE_STATUS_CHANGED,
    'channel matches update-status-changed'
  );
  t.equal(sentMessages[0].data.status, 'checking', 'data status is checking');

  const next2 = broadcastUpdateState(fakeMain, {
    status: 'available',
    availableVersion: '0.41.0',
  });
  t.equal(next2.status, 'available', 'status transitioned to available');
  t.equal(next2.availableVersion, '0.41.0', 'availableVersion is set');
  t.equal(sentMessages.length, 2, 'sent 2 messages');

  const next3 = broadcastUpdateState(fakeMain, {
    status: 'downloading',
    progress: 42,
  });
  t.equal(next3.status, 'downloading', 'status transitioned to downloading');
  t.equal(next3.progress, 42, 'progress is 42');
  t.equal(
    next3.availableVersion,
    '0.41.0',
    'availableVersion preserved from previous state during download'
  );

  const next4 = broadcastUpdateState(fakeMain, {
    status: 'downloaded',
    progress: 100,
  });
  t.equal(next4.status, 'downloaded', 'status transitioned to downloaded');
  t.equal(next4.progress, 100, 'progress is 100 on downloaded');

  // Transition to not-available should clear availableVersion, progress, and error
  const next5 = broadcastUpdateState(fakeMain, {
    status: 'not-available',
  });
  t.equal(next5.status, 'not-available', 'status is not-available');
  t.equal(
    next5.availableVersion,
    undefined,
    'availableVersion cleared when not-available'
  );
  t.equal(next5.progress, undefined, 'progress cleared when not-available');
  t.equal(next5.error, undefined, 'error cleared when not-available');

  // Verify transition from error clears error on non-error state
  broadcastUpdateState(fakeMain, {
    status: 'error',
    error: 'Previous failure',
  });
  t.equal(fakeMain.updateState.status, 'error');
  t.equal(fakeMain.updateState.error, 'Previous failure');

  broadcastUpdateState(fakeMain, {
    status: 'checking',
  });
  t.equal(fakeMain.updateState.status, 'checking');
  t.equal(fakeMain.updateState.error, undefined, 'error cleared when transitioning from error to checking');

  // Destroyed window safety test
  fakeMain.mainWindow.isDestroyed = () => true;
  t.doesNotThrow(() => {
    broadcastUpdateState(fakeMain, { status: 'idle' });
  }, 'does not throw when mainWindow is destroyed');

  t.end();
});

test('handleUpdaterError handles check vs download errors appropriately', (t) => {
  const fakeMain: any = {
    updateState: {
      status: 'checking',
      currentVersion: '0.40.5',
    },
    mainWindow: {
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => false,
        send: () => null,
      },
    },
  };

  // 1. 404 error during checking (e.g. no release on GitHub) -> graceful not-available
  handleUpdaterError(
    fakeMain,
    new Error('HttpError: 404 Not Found at https://api.github.com/repos/sifat-939/veyro/releases')
  );
  t.equal(
    fakeMain.updateState.status,
    'not-available',
    '404 release check is gracefully treated as not-available (up to date)'
  );
  t.equal(fakeMain.updateState.error, undefined, 'no error string on 404 check');
  t.equal(
    fakeMain.updateState.availableVersion,
    undefined,
    'availableVersion cleared on 404'
  );

  // 2. Windows latest.yml missing during check
  handleUpdaterError(
    fakeMain,
    new Error('Cannot find latest.yml in https://github.com/sifat-939/veyro/releases/download/v0.40.5')
  );
  t.equal(
    fakeMain.updateState.status,
    'not-available',
    'missing latest.yml is gracefully treated as not-available'
  );

  // 3. Linux latest-linux.yml missing during check
  handleUpdaterError(
    fakeMain,
    new Error('Cannot find latest-linux.yml in https://github.com/sifat-939/veyro/releases/download/v0.40.5')
  );
  t.equal(
    fakeMain.updateState.status,
    'not-available',
    'missing latest-linux.yml is gracefully treated as not-available'
  );

  // 4. macOS latest-mac.yml missing during check
  handleUpdaterError(
    fakeMain,
    new Error('Cannot find latest-mac.yml in https://github.com/sifat-939/veyro/releases/download/v0.40.5')
  );
  t.equal(
    fakeMain.updateState.status,
    'not-available',
    'missing latest-mac.yml is gracefully treated as not-available'
  );

  // 5. ERR_UPDATER_CHANNEL_FILE_NOT_FOUND code
  const channelErr = new Error('Channel file not found');
  (channelErr as any).code = 'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND';
  handleUpdaterError(fakeMain, channelErr);
  t.equal(
    fakeMain.updateState.status,
    'not-available',
    'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND is gracefully treated as not-available'
  );

  // 6. Network error during check
  const netErr = new Error('getaddrinfo ENOTFOUND api.github.com');
  (netErr as NodeJS.ErrnoException).code = 'ENOTFOUND';
  handleUpdaterError(fakeMain, netErr);
  t.equal(fakeMain.updateState.status, 'error', 'network error produces status error');
  t.equal(
    fakeMain.updateState.error,
    'Network error checking for updates',
    'network error formatted nicely for checking'
  );

  // 7. Network error during download
  fakeMain.updateState.status = 'downloading';
  handleUpdaterError(fakeMain, netErr);
  t.equal(fakeMain.updateState.status, 'error', 'download network error produces status error');
  t.equal(
    fakeMain.updateState.error,
    'Network error downloading update',
    'network error formatted nicely for downloading'
  );

  // 8. 404 error during download (asset missing) -> MUST produce error, NOT not-available!
  fakeMain.updateState.status = 'downloading';
  handleUpdaterError(
    fakeMain,
    new Error('HttpError: 404 Not Found at https://github.com/sifat-939/veyro/releases/download/v0.41.0/VEYRO-v0.41.0.deb'),
    'Download failed'
  );
  t.equal(
    fakeMain.updateState.status,
    'error',
    '404 during download is reported as error, not up-to-date'
  );
  t.equal(
    fakeMain.updateState.error,
    'Download failed',
    'fallback message used for download failure'
  );

  t.end();
});

test('getUpdateState returns current state or default idle state', (t) => {
  const stateFromUndefined = getUpdateState(undefined);
  t.equal(stateFromUndefined.status, 'idle', 'fallback status is idle');
  t.ok(stateFromUndefined.currentVersion, 'currentVersion is populated');

  const mainWithState: any = {
    updateState: {
      status: 'available',
      currentVersion: '0.40.5',
      availableVersion: '0.41.0',
    },
  };
  const stateFromMain = getUpdateState(mainWithState);
  t.equal(stateFromMain.status, 'available', 'returns state from main');
  t.equal(stateFromMain.availableVersion, '0.41.0', 'preserves availableVersion');

  t.end();
});

test('checkForAppUpdates behaves correctly with mock updater', async (t) => {
  const fakeMain: any = {
    updatesEnabled: false,
    checkedForUpdate: false,
    updateState: {
      status: 'idle',
      currentVersion: '0.40.5',
    },
  };

  const mockUpdater: AppUpdaterLike = {
    checkForUpdates: async () => null,
    downloadUpdate: async () => null,
    quitAndInstall: () => {},
    on: () => mockUpdater,
  };

  // 1. updatesEnabled = false
  const stateDisabled = await checkForAppUpdates(fakeMain, false, mockUpdater);
  t.equal(stateDisabled.status, 'idle', 'skips update check when updatesEnabled is false');

  // 2. checkedForUpdate = true and manual = false
  fakeMain.updatesEnabled = true;
  fakeMain.checkedForUpdate = true;
  const stateAlreadyChecked = await checkForAppUpdates(fakeMain, false, mockUpdater);
  t.equal(stateAlreadyChecked.status, 'idle', 'skips background check if already checked');

  // 3. manual = true proceeds even if checkedForUpdate = true, recovers if updater returns null
  fakeMain.checkedForUpdate = true;
  fakeMain.mainWindow = {
    isDestroyed: () => false,
    webContents: {
      isDestroyed: () => false,
      send: () => null,
    },
  };
  const stateRecovered = await checkForAppUpdates(fakeMain, true, mockUpdater);
  t.equal(
    stateRecovered.status,
    'not-available',
    'recovers to not-available if updater returns null, never stuck in checking'
  );

  // 4. Handles updater returning updateInfo with a newer version
  const newVersionUpdater: AppUpdaterLike = {
    ...mockUpdater,
    checkForUpdates: async () => ({
      updateInfo: { version: '0.42.0' },
    }),
  };
  fakeMain.updateState.status = 'idle';
  const stateAvailable = await checkForAppUpdates(fakeMain, true, newVersionUpdater);
  t.equal(stateAvailable.status, 'available', 'transitions to available when newer version is returned');
  t.equal(stateAvailable.availableVersion, '0.42.0', 'availableVersion is set');

  // 5. Handles updater returning updateInfo with same version
  const sameVersionUpdater: AppUpdaterLike = {
    ...mockUpdater,
    checkForUpdates: async () => ({
      updateInfo: { version: '0.40.5' },
    }),
  };
  fakeMain.updateState.status = 'idle';
  const stateSame = await checkForAppUpdates(fakeMain, true, sameVersionUpdater);
  t.equal(stateSame.status, 'not-available', 'transitions to not-available when version matches');

  // 6. Handles thrown exception gracefully
  const failingUpdater: AppUpdaterLike = {
    ...mockUpdater,
    checkForUpdates: async () => {
      throw new Error('HttpError: 404 Not Found');
    },
  };
  fakeMain.updateState.status = 'idle';
  const state404 = await checkForAppUpdates(fakeMain, true, failingUpdater);
  t.equal(state404.status, 'not-available', '404 handled gracefully via checkForAppUpdates');
  t.equal(fakeMain.checkedForUpdate, true, 'checkedForUpdate is true after attempt');

  t.end();
});

test('downloadAppUpdate and quitAndInstallAppUpdate operate cleanly', async (t) => {
  let downloadCalled = false;
  let quitCalled = false;

  const fakeMain: any = {
    updateState: {
      status: 'available',
      currentVersion: '0.40.5',
      availableVersion: '0.41.0',
    },
    mainWindow: {
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => false,
        send: () => null,
      },
    },
  };

  const mockUpdater: AppUpdaterLike = {
    checkForUpdates: async () => null,
    downloadUpdate: async () => {
      downloadCalled = true;
      return null;
    },
    quitAndInstall: () => {
      quitCalled = true;
    },
    on: () => mockUpdater,
  };

  const dlState = await downloadAppUpdate(fakeMain, mockUpdater);
  t.equal(downloadCalled, true, 'downloadUpdate invoked');
  t.equal(dlState.status, 'downloading', 'status is downloading');
  t.equal(dlState.progress, 0, 'initial download progress is 0');

  // Duplicate call while downloading is guarded
  downloadCalled = false;
  await downloadAppUpdate(fakeMain, mockUpdater);
  t.equal(downloadCalled, false, 'duplicate download call guarded');

  // quitAndInstall
  quitAndInstallAppUpdate(mockUpdater);
  t.equal(quitCalled, true, 'quitAndInstall called');

  t.end();
});

test('registerAutoUpdaterListeners registers events and configures updater properties', (t) => {
  const registeredEvents = new Map<string, Function>();
  let configuredFeed: any = null;

  const mockUpdater: AppUpdaterLike = {
    autoDownload: true,
    allowPrerelease: false,
    autoInstallOnAppQuit: false,
    forceDevUpdateConfig: false,
    setFeedURL: (options: any) => {
      configuredFeed = options;
    },
    checkForUpdates: async () => null,
    downloadUpdate: async () => null,
    quitAndInstall: () => {},
    on: (event: string, listener: Function) => {
      registeredEvents.set(event, listener);
      return mockUpdater;
    },
  };

  const fakeMain: any = {
    isDevelopment: true,
    checkedForUpdate: false,
    updateState: {
      status: 'idle',
      currentVersion: '0.40.5',
    },
    mainWindow: {
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => false,
        send: () => null,
      },
    },
  };

  registerAutoUpdaterListeners(fakeMain, mockUpdater);

  t.equal(mockUpdater.autoDownload, false, 'autoDownload configured to false');
  t.equal(mockUpdater.allowPrerelease, true, 'allowPrerelease configured to true');
  t.equal(mockUpdater.autoInstallOnAppQuit, true, 'autoInstallOnAppQuit configured to true');
  t.equal(mockUpdater.forceDevUpdateConfig, true, 'forceDevUpdateConfig configured in dev mode');
  t.deepEqual(
    configuredFeed,
    { provider: 'github', owner: 'sifat-939', repo: 'veyro' },
    'configuredFeed matches sifat-939/veyro'
  );

  // Fire checking-for-update
  registeredEvents.get('checking-for-update')!();
  t.equal(fakeMain.updateState.status, 'checking', 'checking event handled');

  // Fire update-available
  registeredEvents.get('update-available')!({ version: '0.41.0' });
  t.equal(fakeMain.updateState.status, 'available', 'available event handled');
  t.equal(fakeMain.updateState.availableVersion, '0.41.0', 'version captured');

  // Fire download-progress
  registeredEvents.get('download-progress')!({ percent: 55.4 });
  t.equal(fakeMain.updateState.status, 'downloading', 'downloading event handled');
  t.equal(fakeMain.updateState.progress, 55, 'progress rounded');

  // Fire update-downloaded
  registeredEvents.get('update-downloaded')!();
  t.equal(fakeMain.updateState.status, 'downloaded', 'downloaded event handled');
  t.equal(fakeMain.updateState.progress, 100, 'progress set to 100');

  // Fire update-not-available
  registeredEvents.get('update-not-available')!();
  t.equal(fakeMain.updateState.status, 'not-available', 'not-available event handled');
  t.equal(fakeMain.updateState.availableVersion, undefined, 'availableVersion cleared');

  t.end();
});
