import Store from 'electron-store'

const store = new Store()

if (!store.has('userAlbums')) {
    store.set('userAlbums', {})
}

export default store