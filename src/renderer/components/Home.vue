<template>
    <div class="home">
        <h2 style="font-size: 100px" @click="selectDir">欢迎使用</h2>
        <!-- <div v-for="(item,index) in Files" :key="index">{{item.name}}</div> -->
        <file-list
            v-if="Files"
            :list="Files"
            :thumbnailsPath="thumbnailsPath"
        />
    </div>
</template>
<script>
import { mapGetters } from "vuex";
import FileListEm from "@/components/Home/FileList.vue";

import FsWorker from "worker-loader!./fs-worker.js";
import GmWorker from "worker-loader!./gm-worker.js";

import { log } from "util";

const { remote } = require("electron");

const userDataPath = remote.app.getPath("userData");
const thumbnailsPath = userDataPath + "/thumbnails";

const fsWorker = new FsWorker();

let FileList = [];
export default {
    name: "Home",
    components: {
        "file-list": FileListEm,
    },
    data() {
        return {
            Files: {
                contents: {},
            },
            thumbnailsPath,
            threadPool: {},
        };
    },
    computed: {
        ...mapGetters(["testState"]),
    },
    mounted() {
        console.log(this.testState);
        // this.main();
        fsWorker.onmessage = (e) => {
            const data = e.data;
            switch (data.type) {
                case "folder":
                    console.info("读取目录树完毕");
                    this.Files = {
                        contents: data.files,
                    };
                    this.getFileList();
                    break;
                case "FileList":
                    FileList = data.FileList;
                    // 开始生成缩略图 6线程
                    this.startThumWorkers(6);
                    break;
                default:
                    console.log("======");
                    break;
            }
        };
        // fsWorker.onerror = function (e) {
        // console.log(e);
        // };
    },
    methods: {
        main(path) {
            // 选取目录
            const folderPath = "c:/Users/GF/Desktop/";
            fsWorker.postMessage({
                cmd: "readdir",
                path: path,
            });
        },
        async selectDir() {
            for (let i in this.threadPool) {
                this.threadPool[i] && this.threadPool[i].terminate();
            }
            const result = await remote.dialog.showOpenDialog({
                properties: ["openDirectory"],
            });
            // console.log(result.filePaths[0])
            result.filePaths[0] && this.main(result.filePaths[0]);
        },
        startThumWorkers(threadNumber) {
            const ths = threadNumber || 1;
            const threadPool = {};
            const FileListLength = FileList.length;

            // 分配图像到线程
            let m = parseInt(FileListLength / ths);
            let n = FileListLength % ths;
            let startIndex = 0;
            let nextIndex = 0;

            for (let i = 0; i < ths; i++) {
                threadPool[i] = new GmWorker();
                let list = [];
                if (ths === 1) {
                    list = FileList;
                } else {
                    if (i === ths - 1) {
                        m += n;
                    }
                    nextIndex = startIndex + m;
                    list = FileList.slice(startIndex, nextIndex);
                    startIndex = nextIndex;
                }
                threadPool[i].postMessage({
                    thumbnailsPath,
                    FileList: list,
                    threadId: i,
                });
            }

            this.threadPool = threadPool;
        },
        getFileList() {
            // worker读取选中目录中所有图片
            fsWorker.postMessage({
                cmd: "getFileList",
                listObject: this.Files.contents,
            });
        },
    },
};
</script>
<style lang="scss">
.home {
    position: fixed;
    width: 100vw;
    height: 100vh;
    overflow-y: scroll;
    // background-color: red;
}
</style>