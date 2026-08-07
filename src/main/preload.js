const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('minimize-window'),
  maximize: () => ipcRenderer.invoke('maximize-window'),
  close: () => ipcRenderer.invoke('close-window'),

  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', { filePath, content }),
  listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', dirPath),

  // App data
  getAppData: () => ipcRenderer.invoke('get-app-data'),

  // Shortcuts
  registerShortcut: (shortcut) => ipcRenderer.invoke('register-shortcut', shortcut),

  // Notifications
  showNotification: (title, body) => {
    new Notification(title, { body, icon: null });
  },
});
