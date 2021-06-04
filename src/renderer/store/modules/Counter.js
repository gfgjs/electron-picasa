const state = {
  main: 0
}

const mutations = {
  DECREMENT_MAIN_COUNTER(state) {
    state.main--
  },
  INCREMENT_MAIN_COUNTER(state) {
    state.main++
  }
}

const actions = {
  someAsyncTask({ commit }) {
    // do something async
    commit('INCREMENT_MAIN_COUNTER')
  }
}
const getters = {
  testState() {
    return '==========='
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
