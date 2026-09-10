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
};

contextBridge.exposeInMainWorld('bibleApi', api);
