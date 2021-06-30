import { Module } from 'vuex'
import { RootState } from '..'
import { toRaw } from 'vue'

//@ts-ignore
const ipc = window.electron.ipcRenderer

export interface State {
    scrollTarget: any
    userConfig: any
}

const mod: Module<State, RootState> = {
    state: {
        scrollTarget: {
            imgHash: null,
            hash: null, // 目标hash
            target: null, //
        },
        userConfig: {
            size_little: 36, // 初始生成高度36px
            size_small: 180, // 后台生成3种高度的缩略图
            size_middle: 540,
            size_large: 1200,
            thumbSizeBase: 12, // size基本长度，用法：最终缩略图高度 = thumbSize * thumbSizeBase
            thumbQuilaty: 10, // 生成的缩略图质量：10 40 70 100

            // 可即时调整
            threadNumber: 6, // 使用的线程数
            thumbSize: 30, // 缩略图大小 0~100
            // ...config,
        },
    },
    mutations: {
        SCROLL_TARGET(state: any, e: any) {
            state.scrollTarget = e
        },
        async USER_CONFIG(state: any, e: any) {
            state.userConfig = { ...state.userConfig, ...e }
            ipc.invoke('setStoreValue', 'USER_CONFIG', toRaw(state.userConfig))
        },
    },

    actions: {
        SCROLL_TARGET(store: any, e: any) {
            store.commit('SCROLL_TARGET', e)
        },
        USER_CONFIG(store: any, e: any) {
            store.commit('USER_CONFIG', e)
        },
    },

    getters: {
        scrollTarget(e: any) {
            return e.scrollTarget
        },
        userConfig(e: any) {
            return e.userConfig
        },
    },
}
const state = {
    scrollTarget: {
        hash: null, // 目标hash
        target: null, //
    },
    userConfig: {
        size_little: 36, // 初始生成高度36px
        size_small: 180, // 后台生成3种高度的缩略图
        size_middle: 540,
        size_large: 1200,
        thumbSize: 30, // 缩略图大小 0~100
        thumbSizeBase: 12, // size基本长度，用法：最终缩略图高度 = thumbSize * thumbSizeBase
        thumbQuilaty: 10, // 生成的缩略图质量：10 40 70 100
    },
}

const mutations = {
    SCROLL_TARGET(state: any, e: any) {
        state.scrollTarget = e
    },
    USER_CONFIG(state: any, e: any) {
        state.userConfig = { ...state.userConfig, ...e }
    },
}

const actions = {
    SCROLL_TARGET(store: any, e: any) {
        store.commit('SCROLL_TARGET', e)
    },
    USER_CONFIG(store: any, e: any) {
        store.commit('USER_CONFIG', e)
    },
}

const getters = {
    scrollTarget(e: any) {
        return e.scrollTarget
    },
    userConfig(e: any) {
        return e.userConfig
    },
}

// export default {
//     state,
//     mutations,
//     actions,
//     getters,
// }
export default mod
