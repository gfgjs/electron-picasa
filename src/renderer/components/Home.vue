<template>
    <div class="home">
        <!-- <h2 style="font-size: 100px" @click="selectDir">欢迎使用</h2> -->
        <div class="menus">
            <menus @updateFiles="updateFiles" />
        </div>
        <div class="file">
            <file-list :list="renderList" :thumbnailsPath="thumbnailsPath" />
        </div>
    </div>
</template>
<script>
import FileListEm from "@/components/Home/FileListV2.vue";
import Menus from "@/components/Home/Menus.vue";
import { ipcRenderer } from "electron";

export default {
    name: "Home",
    components: {
        "file-list": FileListEm,
        menus: Menus,
    },
    data() {
        return {
            renderList: [],
            thumbnailsPath: "",
        };
    },
    computed: {},
    async mounted() {
        this.thumbnailsPath =
            (await ipcRenderer.invoke("getUserDataPath")) + "/thumbnails/";
    },
    methods: {
        updateFiles({ folder, cmd }) {
            // console.log(folder);
            if (cmd === "delete") {
                this.$delete(this.FilesRender, folder.path);
            } else {
                this.renderList = folder;
            }
        },
    },
};
</script>
<style lang="scss" scoped>
.home {
    position: fixed;
    width: 100vw;
    height: 100vh;
    display: flex;
    .menus {
        width: 240px;
        height: 100%;
        border-right: solid 1px #cecece;
    }
    .file {
        width: calc(100% - 200px);
        height: 100%;
    }
}
</style>