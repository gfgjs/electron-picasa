import { createRouter, createMemoryHistory } from 'vue-router'
import Home from './components/Home/Home.vue'
// console.log(Home)

const router = createRouter({
    history: createMemoryHistory(),
    routes: [
        {
            path: '/',
            component: Home,
        },
        // {
        //   path: '/about',
        //   component: About
        // }
    ],
})

export default router
