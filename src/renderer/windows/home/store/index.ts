/* eslint-disable no-unused-vars */
import { createStore, StoreOptions } from 'vuex'
// import bar from './modules/bar'
// import foo from './modules/foo'
import render from './modules/render'
// const es = require('vuex-electron-store')
// console.log(es.default.create)

export interface RootState {}

const store: StoreOptions<RootState> = {
    state: {},
    getters: {},
    mutations: {},
    modules: {
        // foo,
        // bar,
        render,
    },
    strict: false,
    // plugins: [es.default.create()],
}
const e = createStore(store)
export default e
