<template>
    <div class="home">
        <div class="menus">
            <menus @updateFiles="updateFiles" />
        </div>
        <div class="file">
            <file-list :list="renderList" :thumbnailsPath="thumbnailsPath" />
        </div>
    </div>
</template>
<script>
import FileListEm from './FileList.vue'
import Menus from './Menus.vue'
import { defineComponent } from 'vue'
import { mapActions } from 'vuex'

const ipcRenderer = window.electron.ipcRenderer

//用户信息 detection

export default defineComponent({
    name: 'Home',
    components: {
        'file-list': FileListEm,
        menus: Menus,
    },
    data() {
        return {
            renderList: [],
            thumbnailsPath: '',
        }
    },
    computed: {},
    async mounted() {
        this.thumbnailsPath =
            (await ipcRenderer.invoke('getUserDataPath')) + '/thumbnails/'
        this.USER_CONFIG(
            await ipcRenderer.invoke('getStoreValue', 'USER_CONFIG')
        )
    },
    methods: {
        ...mapActions(['USER_CONFIG']),
        updateFiles({ folder, cmd }) {
            if (cmd === 'delete') {
                this.$delete(this.FilesRender, folder.path)
            } else {
                this.renderList = folder
            }
        },
    },
})
</script>
<style lang="scss" scoped>
.home {
    position: fixed;
    width: 100vw;
    height: 100vh;
    display: flex;
    .menus {
        box-sizing: border-box;
        width: 240px;
        height: 100%;
        overflow-x: hidden;
        border-right: solid 1px #cecece;
    }
    .menus::-webkit-scrollbar {
        width: 6px;
    }
    .menus::-webkit-scrollbar-thumb {
        background-color: #efefef;
        border-radius: 3px;
    }
    .file {
        box-sizing: border-box;
        width: calc(100% - 200px);
        height: 100%;
    }
}
</style>
