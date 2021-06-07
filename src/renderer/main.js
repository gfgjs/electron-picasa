import Vue from 'vue'
import axios from 'axios'

import App from './App'

import router from './router'
import store from './store'
import VueLazyload from 'vue-lazyload'

import { Button, Slider, Switch, Tree } from 'element-ui';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(VueLazyload)

Vue.use(Button)
Vue.use(Slider)
Vue.use(Switch)
Vue.use(Tree)

/* eslint-disable no-new */
new Vue({
    components: { App },
    router,
    store,
    template: '<App/>'
}).$mount('#app')