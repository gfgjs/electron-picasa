import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import './dialog'
// import { Logger } from './logger'
import { init } from './services'
// import createBaseWorker from './workers/index?worker'
import indexPreload from '/@preload/index'
// import anotherPreload from '/@preload/another'
import indexHtmlUrl from '/@renderer/index.html'
import sideHtmlUrl from '/@renderer/preview.html'
import logoUrl from '/@static/logo.png'

async function main() {
    // const logger = new Logger()
    // logger.initialize(app.getPath('userData'))
    // initialize(logger)
    init()
    app.whenReady().then(() => {
        const main = createWindow()
        const preview = createSecondWindow()
        const windows = {
            main,
            preview,
        }

        // main.setPosition(10, 10)
        const [x, y] = main.getPosition()
        // preview.setPosition(60 + 5, y)

        ipcMain.handle('preview-init', (e, jsonStr) => {
            preview.webContents.send('preview-init', jsonStr)
        })

        ipcMain.handle('preview', (e, hash) => {
            preview.webContents.send('preview', hash)
        })

        ipcMain.handle('window', (e, target, active) => {
            windows[target][active]()
        })
    })
    // thread_worker example
    // createBaseWorker({ workerData: 'worker world' })
    //     .on('message', (message) => {
    //         logger.log(`Message from worker: ${message}`)
    //     })
    //     .postMessage('')
}
// Menu.setApplicationMenu(null)
function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        height: 1200,
        width: 1800,
        // frame: false,
        fullscreen: true,
        webPreferences: {
            preload: indexPreload,
            contextIsolation: true,
            nodeIntegration: false,
            nodeIntegrationInWorker: true,
            webSecurity: false,
        },
        icon: logoUrl,
    })

    mainWindow.loadURL(indexHtmlUrl).then()
    return mainWindow
}

function createSecondWindow() {
    const sideWindow = new BrowserWindow({
        height: 1200,
        width: 2200,
        frame: false,
        show: false,
        fullscreen: true,

        webPreferences: {
            preload: indexPreload,
            contextIsolation: false,
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            webSecurity: false,
        },
    })

    sideWindow.loadURL(sideHtmlUrl).then()
    return sideWindow
}

// ensure app start as single instance
if (!app.requestSingleInstanceLock()) {
    app.quit()
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

process.nextTick(main)
