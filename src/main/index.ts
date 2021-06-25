import { app, BrowserWindow } from 'electron'
import './dialog'
// import { Logger } from './logger'
import { init } from './services'
// import createBaseWorker from './workers/index?worker'
import indexPreload from '/@preload/index'
import anotherPreload from '/@preload/another'
import indexHtmlUrl from '/@renderer/index.html'
import sideHtmlUrl from '/@renderer/preview.html'
import logoUrl from '/@static/logo.png'
console.log(123)
console.log(sideHtmlUrl)

async function main() {
    // const logger = new Logger()
    // logger.initialize(app.getPath('userData'))
    // initialize(logger)
    init()
    app.whenReady().then(() => {
        const main = createWindow()
        const [x, y] = main.getPosition()
        const side = createSecondWindow()
        side.setPosition(x + 1600 + 5, y)
    })
    // thread_worker example
    // createBaseWorker({ workerData: 'worker world' })
    //     .on('message', (message) => {
    //         logger.log(`Message from worker: ${message}`)
    //     })
    //     .postMessage('')
}

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        height: 1200,
        width: 1600,
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
        width: 400,
        webPreferences: {
            // preload: anotherPreload,
            preload: indexPreload,

            contextIsolation: true,
            nodeIntegration: false,
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
