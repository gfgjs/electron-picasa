<template>
    <div class="home">
        <!-- <h2 style="font-size: 100px" @click="selectDir">欢迎使用</h2> -->
        <div class="menus">
            <menus @updateFiles="updateFiles" />
        </div>
        <div class="file">
            <file-list :list="Files" :thumbnailsPath="thumbnailsPath" />
        </div>
    </div>
</template>
<script>
import FileListEm from "@/components/Home/FileList.vue";
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
            FilesArray: [],
            Files: {},
            thumbnailsPath: "",
        };
    },
    computed: {},
    async mounted() {
        this.thumbnailsPath =
            (await ipcRenderer.invoke("getUserDataPath")) + "/thumbnails";
    },
    methods: {
        updateFiles({ folder, cmd }) {
            if (cmd === "delete") {
                this.$delete(this.Files, folder.path);
            } else {
                this.$set(this.Files, folder.path, folder);
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
        width: 200px;
        height: 100%;
        border-right: solid 1px #cecece;
    }
    .file {
        width: calc(100% - 200px);
        height: 100%;
        overflow-y: scroll;
    }
}
</style>