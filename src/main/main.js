const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Assistant', click: () => mainWindow.show() },
    { label: 'Quit', click: () => { tray = null; app.quit(); } },
  ]);
  tray.setToolTip('Personal Assistant');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());
}

// IPC handlers
ipcMain.handle('minimize-window', () => mainWindow?.minimize());
ipcMain.handle('maximize-window', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('close-window', () => {
  if (tray) mainWindow?.hide();
  else mainWindow?.close();
});

// File operations
ipcMain.handle('read-file', async (_, filePath) => {
  try {
    return { success: true, data: fs.readFileSync(filePath, 'utf-8') };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('write-file', async (_, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('list-directory', async (_, dirPath) => {
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    return {
      success: true,
      data: files.map(f => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        path: path.join(dirPath, f.name),
      })),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-app-data', async () => {
  const dataPath = app.getPath('userData');
  return { success: true, data: dataPath };
});

// Global shortcut
ipcMain.handle('register-shortcut', async (_, shortcut) => {
  try {
    globalShortcut.register(shortcut, () => {
      if (mainWindow?.isVisible()) mainWindow.hide();
      else mainWindow?.show();
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();
  // Global shortcut to toggle window
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (mainWindow?.isVisible()) mainWindow.hide();
    else mainWindow?.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
