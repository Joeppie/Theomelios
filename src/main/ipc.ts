import { ipcMain, BrowserWindow } from 'electron';
import { listTranslations, getTranslationInfo, getVerses } from '../domain/bible/bibleLoader';
import { createMainWindow, createPresentationWindow, setPendingPresentationData } from './windows';

let currentPassage: any = null;
let presentationWin: BrowserWindow | null = null;
let currentWordHighlight: { wordIndex: number; verseNum: number } | null = null;

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

  ipcMain.handle('window:sendPresentation', async (_event, passage: { book: string; chapter: number; verses?: number[]; translationFile: string }) => {
    let verses: any;
    
    if (passage.verses && passage.verses.length > 0) {
      verses = await getVerses({
        book: passage.book,
        chapter: passage.chapter,
        verses: passage.verses.length === 1 ? passage.verses[0] : [passage.verses[0], passage.verses[passage.verses.length - 1]],
        translationFile: passage.translationFile,
      });
      
      if (verses && passage.verses.length > 0) {
        verses.verses = verses.verses.filter((v: any) => passage.verses!.includes(v.ID));
      }
    } else {
      verses = await getVerses(passage);
    }
    
    if (verses) {
      if (presentationWin && !presentationWin.isDestroyed()) {
        presentationWin.webContents.send('passage:update', verses);
        if (presentationWin.isMinimized()) {
          presentationWin.restore();
        }
        presentationWin.focus();
      } else {
        setPendingPresentationData(verses);
        const win = createPresentationWindow();
        if (win) {
          presentationWin = win;
        }
      }
    }
    return true;
  });

  ipcMain.handle('window:openPresentation', async () => {
    const win = createPresentationWindow();
    if (win) {
      presentationWin = win;
    }
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
    presentationWin = null;
  });

  ipcMain.handle('presentation:highlightWord', async (_event, highlight: { wordIndex: number; verseNum: number } | null) => {
    currentWordHighlight = highlight;
    if (presentationWin && !presentationWin.isDestroyed()) {
      presentationWin.webContents.send('presentation:highlightWord', highlight);
    }
    return true;
  });

  ipcMain.handle('presentation:getCurrentHighlight', async () => {
    return currentWordHighlight;
  });

  // Remove menu bar
  const { Menu } = require('electron');
  Menu.setApplicationMenu(null);
}
