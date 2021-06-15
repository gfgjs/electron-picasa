const state = {
    scrollTarget: {
        hash:null,  // 目标hash
        target:null, // 
    },
    userConfig:{
        size_little:36, // 初始生成高度36px
        size_small:180, // 后台生成3种高度的缩略图
        size_middle:540,
        size_large:1200,
        thumbSize:30, // 缩略图大小 0~100
        thumbSizeBase:12, // size基本长度，用法：最终缩略图高度 = thumbSize * thumbSizeBase
        thumbQuilaty:10, // 生成的缩略图质量：10 40 70 100
    }
}

const mutations = {
    SCROLL_TARGET(state, e) {
        state.scrollTarget = e
    },
    USER_CONFIG(state,e){
        state.userConfig = {...state.userConfig,...e}
    }
}

const actions = {
    SCROLL_TARGET(store, e) {
        store.commit('SCROLL_TARGET', e)
    },
    USER_CONFIG(store, e) {
        store.commit('USER_CONFIG', e)
    },
}

const getters = {
    scrollTarget(e) {
        return e.scrollTarget
    },
    userConfig(e) {
        return e.userConfig
    },
}

export default {
    state,
    mutations,
    actions,
    getters
}
