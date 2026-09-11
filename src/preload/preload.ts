import { contextBridge, ipcRenderer } from 'electron';

const api = {
  async listTranslations(): Promise<string[]> {
    return ipcRenderer.invoke('bible:listTranslations');
  },

  async getTranslationInfo(translationFile: string): Promise<any> {
    return ipcRenderer.invoke('bible:getTranslationInfo', translationFile);
  },

  async getVerses(request: {
    book: string;
    chapter: number;
    verses?: [number, number] | number;
    translationFile: string;
  }): Promise<any> {
    return ipcRenderer.invoke('bible:getVerses', request);
  },

  async openPresentationWindow(): Promise<boolean> {
    return ipcRenderer.invoke('window:openPresentation');
  },

  async sendToPresentation(passage: { book: string; chapter: number; verses?: number[]; translationFile: string }): Promise<boolean> {
    return ipcRenderer.invoke('window:sendPresentation', passage);
  },

  async sendWordHighlight(highlight: { wordIndex: number; verseNum: number } | null): Promise<void> {
    return ipcRenderer.invoke('presentation:highlightWord', highlight);
  },

  async getCurrentWordHighlight(): Promise<{ wordIndex: number; verseNum: number } | null> {
    return ipcRenderer.invoke('presentation:getCurrentHighlight');
  },

  async closePresentationWindow(): Promise<void> {
    return ipcRenderer.invoke('window:closePresentation');
  },

  onPassageUpdate(callback: (data: any) => void) {
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('passage:update', listener);
    return () => ipcRenderer.removeListener('passage:update', listener);
  },

  onWindowClosed(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on('window:closed', listener);
    return () => ipcRenderer.removeListener('window:closed', listener);
  },

  onWordHighlight(callback: (data: { wordIndex: number; verseNum: number } | null) => void) {
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('presentation:highlightWord', listener);
    return () => ipcRenderer.removeListener('presentation:highlightWord', listener);
  },
};

contextBridge.exposeInMainWorld('bibleApi', api);
