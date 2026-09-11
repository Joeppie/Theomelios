import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { listTranslations, getTranslationInfo, getVerses } from '../domain/bible/bibleLoader';

let mainWin: BrowserWindow | null = null;
let presentationWin: BrowserWindow | null = null;

export function createMainWindow() {
  if (mainWin) {
    mainWin.focus();
    return;
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch(err => {
      mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }

  mainWin = mainWindow;

  mainWindow.on('closed', () => {
    mainWin = null;
  });
}

let pendingPresentationData: any = null;

export function createPresentationWindow() {
  const existingWins = BrowserWindow.getAllWindows();
  for (const win of existingWins) {
    if (win === presentationWin && !win.isDestroyed()) {
      win.focus();
      if (pendingPresentationData) {
        setTimeout(() => {
          if (win && !win.isDestroyed() && win.webContents.isDOMReady()) {
            win.webContents.send('passage:update', pendingPresentationData);
            pendingPresentationData = null;
          }
        }, 50);
      }
      return win;
    }
  }

  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL.replace(/\/$/, '')}/#/presentation`);
  } else {
    win.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'), {
      hash: '/presentation',
    });
  }

  win.once('did-finish-load', () => {
    if (pendingPresentationData && !win.isDestroyed()) {
      win.webContents.send('passage:update', pendingPresentationData);
      pendingPresentationData = null;
    }
  });

  win.on('closed', () => {
    if (presentationWin === win) {
      presentationWin = null;
    }
    if (mainWin) {
      mainWin.webContents.send('window:closed');
    }
  });

  presentationWin = win;
  return win;
}

export function setPendingPresentationData(data: any) {
  pendingPresentationData = data;
}

export function getMainWin() {
  return mainWin;
}
