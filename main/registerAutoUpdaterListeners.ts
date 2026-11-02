import { app } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import type { Main } from '../main';
import { isNetworkError } from './helpers';
import { IPC_CHANNELS } from '../utils/messages';
import { UpdateState } from '../utils/ipc/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppUpdaterLike = any;

export function getAppVersion(): string {
  try {
    return app?.getVersion ? app.getVersion() : '0.40.5';
  } catch {
    return '0.40.5';
  }
}

export function getUpdateState(main?: Main): UpdateState {
  if (main?.updateState) {
    return main.updateState;
  }
  return {
    status: 'idle',
    currentVersion: getAppVersion(),
  };
}

export function broadcastUpdateState(
  main: Main,
  patch: Partial<UpdateState>
): UpdateState {
  const currentVersion = getAppVersion();
  const nextStatus = patch.status ?? main.updateState?.status ?? 'idle';

  let nextAvailableVersion =
    patch.availableVersion !== undefined
      ? patch.availableVersion
      : main.updateState?.availableVersion;

  // Clear availableVersion when transitioning to not-available or idle unless explicitly provided
  if (nextStatus === 'not-available' || nextStatus === 'idle') {
    if (patch.availableVersion === undefined) {
      nextAvailableVersion = undefined;
    }
  }

  let nextProgress = patch.progress;
  if (nextProgress === undefined) {
    if (nextStatus === 'downloading') {
      nextProgress = main.updateState?.progress ?? 0;
    } else if (nextStatus === 'downloaded') {
      nextProgress = 100;
    } else {
      nextProgress = undefined;
    }
  }

  let nextError = patch.error;
  if (nextError === undefined) {
    if (nextStatus === 'error') {
      nextError = main.updateState?.error ?? 'Update error';
    } else {
      nextError = undefined;
    }
  }

  const nextState: UpdateState = {
    status: nextStatus,
    currentVersion,
    availableVersion: nextAvailableVersion,
    progress: nextProgress,
    error: nextError,
  };

  main.updateState = nextState;
  if (
    main.mainWindow &&
    !main.mainWindow.isDestroyed() &&
    main.mainWindow.webContents &&
    !main.mainWindow.webContents.isDestroyed()
  ) {
    main.mainWindow.webContents.send(
      IPC_CHANNELS.UPDATE_STATUS_CHANGED,
      nextState
    );
  }
  return nextState;
}

export function handleUpdaterError(
  main: Main,
  error: Error | null | undefined,
  fallbackMsg?: string
): void {
  const isNet = isNetworkError(error);
  const msg = error?.message || '';
  const code = (error as { code?: string })?.code || '';
  const isDownloading =
    main.updateState?.status === 'downloading' ||
    fallbackMsg?.toLowerCase().includes('download');

  if (isDownloading) {
    const userMessage = isNet
      ? 'Network error downloading update'
      : fallbackMsg || msg || 'Update download failed';

    broadcastUpdateState(main, {
      status: 'error',
      error: userMessage,
    });
    return;
  }

  // During check: If no release found or 404 (e.g. repository has no published release yet,
  // or missing platform-specific latest channel file like latest-linux.yml / latest-mac.yml / latest.yml),
  // treat gracefully as up-to-date rather than alarming the user
  if (
    code === 'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND' ||
    code === 'ERR_UPDATER_NO_PUBLISHED_VERSIONS' ||
    code === 'ERR_UPDATER_LATEST_VERSION_NOT_FOUND' ||
    msg.includes('404') ||
    /latest.*\.ya?ml/i.test(msg) ||
    msg.includes('No published versions on GitHub') ||
    msg.includes('Unable to find latest version') ||
    (msg.includes('Cannot find') && msg.includes('.yml'))
  ) {
    broadcastUpdateState(main, {
      status: 'not-available',
      error: undefined,
      availableVersion: undefined,
    });
    return;
  }

  const userMessage = isNet
    ? 'Network error checking for updates'
    : fallbackMsg || msg || 'Update check failed';

  broadcastUpdateState(main, {
    status: 'error',
    error: userMessage,
  });
}

export async function checkForAppUpdates(
  main: Main,
  manual = false,
  updater: AppUpdaterLike = autoUpdater
): Promise<UpdateState> {
  if (!main.updatesEnabled) {
    return main.updateState;
  }

  if (main.updateState?.status === 'checking') {
    return main.updateState;
  }

  if (!manual && main.checkedForUpdate) {
    return main.updateState;
  }

  broadcastUpdateState(main, {
    status: 'checking',
    error: undefined,
  });

  try {
    const result = await updater.checkForUpdates();
    main.checkedForUpdate = true;
    if (getUpdateState(main).status === 'checking') {
      const detectedVersion = result?.updateInfo?.version;
      if (detectedVersion && detectedVersion !== getAppVersion()) {
        broadcastUpdateState(main, {
          status: 'available',
          availableVersion: detectedVersion,
          error: undefined,
        });
      } else {
        broadcastUpdateState(main, {
          status: 'not-available',
          error: undefined,
          availableVersion: undefined,
        });
      }
    }
  } catch (error) {
    main.checkedForUpdate = true;
    handleUpdaterError(main, error as Error);
  }

  return main.updateState;
}

export async function downloadAppUpdate(
  main: Main,
  updater: AppUpdaterLike = autoUpdater
): Promise<UpdateState> {
  if (main.updateState?.status === 'downloading') {
    return main.updateState;
  }

  broadcastUpdateState(main, {
    status: 'downloading',
    progress: 0,
    error: undefined,
  });

  try {
    await updater.downloadUpdate();
  } catch (error) {
    handleUpdaterError(main, error as Error, 'Download failed');
  }

  return main.updateState;
}

export function quitAndInstallAppUpdate(
  updater: Pick<AppUpdaterLike, 'quitAndInstall'> = autoUpdater
): void {
  try {
    updater.quitAndInstall(false, true);
  } catch (error) {
    console.error('Failed to quit and install update:', error);
  }
}

export function registerAutoUpdaterListeners(
  main: Main,
  updater: AppUpdaterLike = autoUpdater
): void {
  updater.autoDownload = false;
  updater.allowPrerelease = true;
  updater.autoInstallOnAppQuit = true;

  if (main.isDevelopment && 'forceDevUpdateConfig' in updater) {
    updater.forceDevUpdateConfig = true;
  }

  if (typeof updater.setFeedURL === 'function') {
    try {
      updater.setFeedURL({
        provider: 'github',
        owner: 'sifat-939',
        repo: 'veyro',
      });
    } catch {
      // ignore in environments without complete provider runtime
    }
  }

  updater.on('checking-for-update', () => {
    broadcastUpdateState(main, {
      status: 'checking',
      error: undefined,
    });
  });

  updater.on('update-available', (info: UpdateInfo) => {
    broadcastUpdateState(main, {
      status: 'available',
      availableVersion: info?.version,
      error: undefined,
    });
  });

  updater.on('update-not-available', () => {
    broadcastUpdateState(main, {
      status: 'not-available',
      error: undefined,
      availableVersion: undefined,
    });
  });

  updater.on('download-progress', (progressObj: { percent: number }) => {
    broadcastUpdateState(main, {
      status: 'downloading',
      progress: Math.round(progressObj.percent),
    });
  });

  updater.on('update-downloaded', () => {
    broadcastUpdateState(main, {
      status: 'downloaded',
      progress: 100,
      error: undefined,
    });
  });

  updater.on('error', (error: Error) => {
    if (!main.checkedForUpdate) {
      main.checkedForUpdate = true;
    }
    handleUpdaterError(main, error);
  });
}

export default registerAutoUpdaterListeners;
