import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/lib/theme-chalk/index.css'
// import lazyPlugin from 'vue3-lazy'
// import { ElIcon } from 'element-plus'

const app = createApp(App)

app.use(router)
app.use(store)
// app.use(lazyPlugin, {
//     loading: './assets/default.png',
//     error: './assets/default.png',
// })
app.use(ElementPlus)
// app.use(ElIcon)

app.mount('#app')
