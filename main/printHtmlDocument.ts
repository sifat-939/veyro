import { App, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import {
  getInitializedPrintWindow,
  PRINT_TIMEOUT_MS,
  withTimeout,
} from './saveHtmlAsPdf';

export async function printHtmlDocument(
  html: string,
  app: App,
  width: number,
  height: number,
  timeoutMs: number = PRINT_TIMEOUT_MS
): Promise<boolean> {
  const tempDirectory = await fs.mkdtemp(
    path.join(app.getPath('temp'), 'nivo-print-')
  );
  const tempFile = path.join(tempDirectory, 'document.html');
  let printWindow: BrowserWindow | undefined;
  try {
    await fs.writeFile(tempFile, html, { encoding: 'utf-8' });
    printWindow = await getInitializedPrintWindow(
      tempFile,
      width,
      height,
      timeoutMs
    );
    const window = printWindow;
    const printPromise = new Promise<boolean>((resolve, reject) => {
      try {
        window.webContents.print(
          { silent: false, printBackground: true },
          (success) => resolve(success)
        );
      } catch (error) {
        reject(error);
      }
    });
    printPromise.catch(() => {});
    return await withTimeout(
      printPromise,
      timeoutMs,
      `Print operation timed out after ${timeoutMs}ms`
    );
  } finally {
    if (printWindow && !printWindow.isDestroyed()) printWindow.destroy();
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
}
