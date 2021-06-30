import { createRouter, createMemoryHistory } from 'vue-router'
import Preview from './components/Preview.vue'

const router = createRouter({
    history: createMemoryHistory(),
    routes: [
        {
            path: '/',
            component: Preview,
        },
        // {
        //   path: '/about',
        //   component: About
        // }
    ],
})

export default router
