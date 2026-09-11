import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './windows';
import { registerIpcHandlers } from './ipc';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

if (process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('remote-debugging', '9229');
  app.commandLine.appendSwitch('remote-debugging-port', '9229');
}

function createApp() {
  createMainWindow();
  registerIpcHandlers();
}

app.whenReady().then(() => {
  createApp();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createApp();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
