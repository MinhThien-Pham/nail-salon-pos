// src/main.ts
import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { AppDatabase } from './main/database';
import setUpHandlers from './main/ipcHandlers';

// Define the database variable outside so we can close it later
let db: AppDatabase;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Remove the default menu (File, Edit, etc.) for a cleaner POS look
  Menu.setApplicationMenu(null);

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024, // POS screens are usually larger
    height: 768,
    alwaysOnTop: true, // Keep the POS window on top
    webPreferences: {
      devTools: true, // Enable DevTools for debugging
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools (Keep this while developing, comment out for production)
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // 1. Initialize Database
  db = new AppDatabase();

  // 2. Set up the listeners (IPC)
  setUpHandlers(db);

  // 3. Create the window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Close database connection cleanly
  if (db) {
    // We didn't add a close() method to AppDatabase yet, but better-sqlite3 handles it automatically on exit.
    // If you want to be explicit, you can add a close method to your class later.
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
