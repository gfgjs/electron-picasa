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
import { ipcCmdOnce } from "../renderer-tools";

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
        const cmd = {
            cmd: "getThumbnailsPath",
        };
        ipcCmdOnce(ipcRenderer, cmd).then((res) => {
            this.thumbnailsPath = res.arg;
        });
        // setTimeout(() => {
        //     delete this.Files["C:/Users/GF/Desktop/1/"];
        //     // 结尾带/和不带/变来变去，得统一
        //     setTimeout(() => {
        //         console.log(this.Files);
        //     }, 1000);
        // }, 4000);
    },
    methods: {
        updateFiles({ files, cmd }) {
            // 文件夹最后带不带 / 是个问题
            if (cmd === "delete") {
                console.log(this.Files, files.path, cmd);
                const name = files.path + "/";

                this.$delete(this.Files, name);
                this.$nextTick(() => {
                    this.$forceUpdate();
                    for (let i in this.Files) {
                        console.log(i, name, i == name, i === name);
                    }
                    console.log(this.Files, name, cmd);
                });
            } else {
                // console.log('222222',this.Files, files.path, cmd);

                this.Files[files.path] = files;
                this.$set(this.Files, files.name, files);
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