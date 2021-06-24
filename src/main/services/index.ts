import { ipcMain, app } from 'electron'
import fs from 'fs'
import Store from 'electron-store'

import { Logger } from '../logger'
import { BaseService } from './BaseService'
import { FooService } from './FooService'
import { INJECTIONS_SYMBOL } from './Service'

/**
 * All services definition
 */
export interface Services {
    FooService: FooService
    BaseService: BaseService
}

let _services!: Services

/**
 * Initialize the services module to serve client (renderer process)
 *
 * @param logger The simple app logger
 */
export function initialize(logger: Logger) {
    _initialize({
        BaseService: new BaseService(logger),
        FooService: new FooService(logger),
    })
}

/**
 * Initialize the services module to serve client (renderer process)
 *
 * @param services The running services for current app
 */
function _initialize(services: Services) {
    if (_services) {
        throw new Error('Should not initialize the services multiple time!')
    }
    _services = services
    for (const serv of Object.values(services)) {
        const injects = Object.getPrototypeOf(serv)[INJECTIONS_SYMBOL] || []
        for (const i of injects) {
            const { type, field } = i
            if (type in services) {
                const success = Reflect.set(
                    serv,
                    field,
                    (services as any)[type]
                )
                if (!success) {
                    throw new Error(
                        `Cannot set service ${type} to ${Object.getPrototypeOf(
                            serv
                        )}`
                    )
                }
            } else {
                throw new Error(
                    `Cannot find service named ${type}! Which is required by ${
                        Object.getPrototypeOf(serv).constructor.name
                    }`
                )
            }
        }
    }
}

export class ServiceNotFoundError extends Error {
    constructor(readonly service: string) {
        super(`Cannot find service named ${service}!`)
    }
}
export class ServiceMethodNotFoundError extends Error {
    constructor(readonly service: string, readonly method: string) {
        super(`Cannot find method named ${method} in service [${service}]!`)
    }
}

ipcMain.handle(
    'service:call',
    (event, name: string, method: string, ...payloads: any[]) => {
        if (!_services) {
            throw new Error(
                'Cannot call any service until the services are ready!'
            )
        }
        const service = (_services as any)[name]
        if (!service) {
            throw new ServiceNotFoundError(name)
        }
        if (!service[method]) {
            throw new ServiceMethodNotFoundError(name, method)
        }
        return service[method](...payloads)
    }
)
export function init() {
    const store: any = new Store()
    if (!store.has('USER_ALBUMS')) {
        store.set('USER_ALBUMS', {})
    }

    // 创建缩略图目录
    const userDataPath = app.getPath('userData').replace(/\\/g, '/')
    const thumbnailsPath = userDataPath + '/thumbnails'
    !fs.existsSync(thumbnailsPath) && fs.mkdirSync(thumbnailsPath)

    !fs.existsSync(thumbnailsPath + '/small') &&
        fs.mkdirSync(thumbnailsPath + '/small')
    !fs.existsSync(thumbnailsPath + '/middle') &&
        fs.mkdirSync(thumbnailsPath + '/middle')
    !fs.existsSync(thumbnailsPath + '/large') &&
        fs.mkdirSync(thumbnailsPath + '/large')

    // 渲染进程需要的一些工具
    ipcMain.handle('getUserDataPath', (event, key) => {
        return userDataPath
    })

    ipcMain.handle('getStoreValue', (event, key) => {
        return store.get(key)
    })

    ipcMain.handle('setStoreValue', (event, key, data = '') => {
        store.set(key, data)
        return 'complete'
    })
}
