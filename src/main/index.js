import { app, BrowserWindow, ipcMain } from 'electron'
import '../renderer/store'
import fs from 'fs'
import store from './store'


ipcMain.handle('getStoreValue', (event, key) => {
  return store.get(key);
});
ipcMain.handle('setStoreValue', (event, key, data = '') => {
  store.set(key, data);
  return [1, 2]
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

const userDataPath = app.getPath('userData')
const thumbnailsPath = userDataPath + '/thumbnails'
if (fs.existsSync(thumbnailsPath)) {
  // console.log('缩略图目录已存在')
} else {
  fs.mkdirSync(thumbnailsPath)
}
// store.set('111',{"C:/Users/GF/Desktop/2/2-1/2-1-1":'/1/1/1'})
ipcMain.on('fsio-cmd', (e, cmd) => {
  // console.log('main:', cmd)

  switch (cmd.cmd) {
    case ('getThumbnailsPath'):
      e.sender.send('fsio-reply' + cmd.id, thumbnailsPath)
      break;
    case ('getUserAlbums'):
      e.sender.send('fsio-reply' + cmd.id, store.get('UserAlbums'))
      break;
    case ('deleteUserAlbums'):
      const albumsOfDelete = store.get('UserAlbums')
      delete albumsOfDelete[cmd.name]
      store.set('UserAlbums', albumsOfDelete)

      e.returnValue = albumsOfDelete || ('fsio-reply' + cmd.id, albumsOfDelete)
      break;
    case ('addUserAlbums'):
      let albums = store.get('UserAlbums')
      cmd.filePaths.forEach(item => {
        albums[item] = item
      })

      let check = []
      for (let i in albums) {
        check.push(albums[i])
      }
      check.sort((a, b) => a.length - b.length)

      for (let i in check) {
        for (let j in albums) {
          if (check[i] === albums[j]) {
          } else {
            if (albums[j].includes(check[i])) {
              delete albums[j]
            }
          }
        }
      }

      store.set('UserAlbums', albums)

      e.returnValue = albums || ('fsio-reply' + cmd.id, albums)
      // let count = 0;
      // for (let i in a) {
      //     const len = a[i].length;
      //     let flag;
      //     for (let j in b) {
      //         count++;
      //         if (len > b[j].length) {
      //             if (a[i].includes(b[j])) {
      //                 flag = true;
      //                 a[i] = b[j];
      //                 b.splice(j, 1);
      //                 console.log(count, j,"change");
      //                 break;
      //             }
      //         } else {
      //             if (b[j].includes(a[i])) {
      //                 flag = true;
      //                 b.splice(j, 1);
      //                 console.log(count, j,"nochange");
      //                 break;
      //             }
      //         }
      //     }
      //     if (flag) {
      //         continue;
      //     }
      // }
      // a = a.concat(b)
      // console.log(count, a);
      // // a自身对比
      // for (let i in a){
      //   let A = a[i]
      //   for(let j in a){
      //     let B = a[j]

      //   }
      // }

      break;
    default:
      break;
  }
})

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
