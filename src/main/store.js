import { ipcMain } from 'electron'
import Store from 'electron-store'

const store = new Store()

const UserAlbums = store.get('UserAlbums')
if (!UserAlbums) {
    store.set('UserAlbums', {})
}

export default store