const state = {
    scrollTarget: null
}

const mutations = {
    UPDATE_SCROLL_TARGET(state, e) {
        state.scrollTarget = e
    }
}

const actions = {
    UPDATE_SCROLL_TARGET(store, e) {
        store.commit('UPDATE_SCROLL_TARGET', e)
    }
}

const getters = {
    scrollTarget(e) {
        return e.scrollTarget
    }
}

export default {
    state,
    mutations,
    actions,
    getters
}
