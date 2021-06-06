import { app, BrowserWindow, ipcMain } from 'electron'
import '../renderer/store'
import fs from 'fs'
import store from './store'

const userDataPath = app.getPath('userData')

// 创建缩略图目录
const thumbnailsPath = userDataPath + '/thumbnails'

!fs.existsSync(thumbnailsPath) && fs.mkdirSync(thumbnailsPath)

!fs.existsSync(thumbnailsPath + '/small') && fs.mkdirSync(thumbnailsPath + '/small')
!fs.existsSync(thumbnailsPath + '/middle') && fs.mkdirSync(thumbnailsPath + '/middle')
!fs.existsSync(thumbnailsPath + '/large') && fs.mkdirSync(thumbnailsPath + '/large')

// 渲染进程需要的一些工具
ipcMain.handle('getUserDataPath', (event, key) => {
  return userDataPath
});

ipcMain.handle('getStoreValue', (event, key, timestamp) => {
  console.log("读store - 接收到", Date.now() - timestamp)
  console.time("store.get(key)");
  const result = store.get(key)
  console.timeEnd("store.get(key)");
  return { result,time:Date.now()};
});

ipcMain.handle('setStoreValue', (event, key, data = '', timestamp) => {
  console.log("写store - 接收到", Date.now() - timestamp)
  console.time("store.set(key, data)");
  store.set(key, data)
  console.timeEnd("store.set(key, data)");
  return 'complete'
});

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 800,
    useContentSize: true,
    width: 1500,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      enableRemoteModule: true, // 打开remote模块
      webSecurity: false,
      nodeIntegrationInWorker: true
    }
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
// console.log(app.getAppPath)

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
