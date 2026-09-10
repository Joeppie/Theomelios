import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { listTranslations, getTranslationInfo, getVerses } from '../domain/bible/bibleLoader';

let mainWin: BrowserWindow | null = null;

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

export function createPresentationWindow() {
  const existingWins = BrowserWindow.getAllWindows();
  for (const win of existingWins) {
    if (win !== mainWin && !win.isDestroyed()) {
      win.focus();
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

  win.on('closed', () => {
    if (mainWin) {
      mainWin.webContents.send('window:closed');
    }
  });

  return win;
}

export function getMainWin() {
  return mainWin;
}
