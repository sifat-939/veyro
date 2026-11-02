import { App, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export const PRINT_TIMEOUT_MS = 15000;

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  promise.catch(() => {});
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function saveHtmlAsPdf(
  html: string,
  savePath: string,
  app: App,
  width: number, // centimeters
  height: number, // centimeters
  timeoutMs: number = PRINT_TIMEOUT_MS
): Promise<boolean> {
  const tempDirectory = await fs.mkdtemp(
    path.join(app.getPath('temp'), 'nivo-pdf-')
  );
  const htmlPath = path.join(tempDirectory, 'document.html');
  let printWindow: BrowserWindow | undefined;
  try {
    await fs.writeFile(htmlPath, html, { encoding: 'utf-8' });
    printWindow = await getInitializedPrintWindow(
      htmlPath,
      width,
      height,
      timeoutMs
    );
    const pdfPromise = printWindow.webContents.printToPDF({
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      pageSize: {
        height: height / 2.54,
        width: width / 2.54,
      },
      printBackground: true,
    });
    pdfPromise.catch(() => {});
    const data = await withTimeout(
      pdfPromise,
      timeoutMs,
      `PDF export timed out after ${timeoutMs}ms`
    );
    await fs.writeFile(savePath, data);
    return true;
  } finally {
    if (printWindow && !printWindow.isDestroyed()) printWindow.destroy();
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
}

export async function getInitializedPrintWindow(
  printFilePath: string,
  width: number,
  height: number,
  timeoutMs: number = PRINT_TIMEOUT_MS
): Promise<BrowserWindow> {
  const printWindow = new BrowserWindow({
    width: Math.floor(width * 28.333333), // pixels
    height: Math.floor(height * 28.333333), // pixels
    show: false,
  });

  try {
    const initPromise = (async () => {
      await printWindow.loadFile(printFilePath);
      await printWindow.webContents.executeJavaScript(`(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map(image => image.decode().catch(() => {})));
  })()`);
      return printWindow;
    })();
    initPromise.catch(() => {});

    return await withTimeout(
      initPromise,
      timeoutMs,
      `Print document initialization timed out after ${timeoutMs}ms`
    );
  } catch (error) {
    if (!printWindow.isDestroyed()) printWindow.destroy();
    throw error;
  }
}
