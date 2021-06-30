import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// import store from '../home/store'
import ElementPlus from 'element-plus'
import 'element-plus/lib/theme-chalk/index.css'
// import 'viewerjs/dist/viewer.css'
// import VueViewer from 'v-viewer'
const app = createApp(App)
// app.use(VueViewer)
app.use(router)
// app.use(store)
app.use(ElementPlus)

app.mount('#app')
