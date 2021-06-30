<template>
    <div class="app">
        <!-- <navigator /> -->
        <router-view> </router-view>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
// import Navigator from '/@/components/HomeNavigator.vue'
// import Navigator from './components/HomeNavigator.vue'
// import { mapGetters } from 'vuex'
// import * as ves from 'vuex-electron-store'
// const ves = require('vuex-electron-store')
// console.log(electron.ves.default.create())

export default defineComponent({
    components: {
        // Navigator,
    },
    watch: {
        // userConfig(e) {
        //     console.log({ ...e })
        // },
    },
    computed: {
        // ...mapGetters(['userConfig']),
    },
})
</script>

<style>
* {
    padding: 0;
    margin: 0;
}
</style>
