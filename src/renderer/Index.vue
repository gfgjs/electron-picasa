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

export default defineComponent({
    components: {
        // Navigator,
    },
})
</script>

<style>
* {
    padding: 0;
    margin: 0;
}
</style>
