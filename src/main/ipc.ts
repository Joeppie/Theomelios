import { ipcMain, BrowserWindow } from 'electron';
import { listTranslations, getTranslationInfo, getVerses } from '../domain/bible/bibleLoader';
import { createMainWindow, createPresentationWindow } from './windows';

let currentPassage: any = null;

export function registerIpcHandlers() {
  ipcMain.handle('bible:listTranslations', async () => {
    return listTranslations();
  });

  ipcMain.handle('bible:getTranslationInfo', async (_event, translationFile: string) => {
    return getTranslationInfo(translationFile);
  });

  ipcMain.handle('bible:getVerses', async (_event, request: {
    book: string;
    chapter: number;
    verses?: [number, number] | number;
    translationFile: string;
  }) => {
    const result = await getVerses(request);
    if (result) {
      currentPassage = result;
    }
    return result;
  });

  ipcMain.handle('window:openPresentation', async () => {
    const win = createPresentationWindow();
    if (win && currentPassage) {
      win.webContents.send('passage:update', currentPassage);
    }
    return true;
  });

  ipcMain.handle('window:closePresentation', async () => {
    const wins = BrowserWindow.getAllWindows();
    for (const win of wins) {
      if (win !== wins[0]) {
        win.close();
      }
    }
  });
}
