<template>
    <div class="menus-list">
        <div v-for="item in userAlbums" :key="item">
            <button @click="deleteAlbum(item)">删除</button
            ><code>{{ item }}</code>
        </div>
        <button @click="selectDir">添加文件夹</button>
        <button @click="confirmAlbums">刷新相册</button>
    </div>
</template>
<script>
import { mapGetters } from "vuex";
import FileListEm from "@/components/Home/FileList.vue";

import FsWorker from "worker-loader!./fs-worker.js";
import GmWorker from "worker-loader!./gm-worker.js";
import { ipcCmdOnce } from "../../renderer-tools";

import { log } from "util";

const { remote, ipcRenderer } = require("electron");

const userDataPath = remote.app.getPath("userData");
const thumbnailsPath = userDataPath + "/thumbnails";

const fsWorker = new FsWorker();

let FileList = [];
export default {
    name: "Menus",
    components: {
        "file-list": FileListEm,
    },
    data() {
        return {
            Files: {
                children: {},
                name: "",
            },
            thumbnailsPath,
            threadPool: {},
            userAlbums: {},
        };
    },
    computed: {
        ...mapGetters(["testState"]),
    },
    async mounted() {
        // const foo = await ipcRenderer.invoke("setStoreValue", ts+'11111111', ts);

        fsWorker.onmessage = (e) => {
            const data = e.data;
            switch (data.type) {
                case "folder":
                    console.info("读取目录树完毕");
                    const files = data.files;
                    this.sendFilesToParent(files);
                    this.getFileList(files);
                    break;
                case "FileList":
                    FileList = data.FileList;
                    // 开始生成缩略图 6线程
                    this.startThumWorkers(1, data.FileList);
                    break;
                default:
                    console.log("======");
                    break;
            }
        };
        fsWorker.onerror = function (e) {
            // console.log(e);
        };
        ipcCmdOnce(ipcRenderer, { cmd: "getUserAlbums" }).then(({ arg }) => {
            this.changeAlbums(arg, true);
            // 首次进入自动刷新一次相册
        });
    },
    methods: {
        deleteAlbum(item) {
            this.$delete(this.userAlbums, item);
            this.sendFilesToParent({ path: item }, "delete");

            ipcCmdOnce(ipcRenderer, {
                cmd: "deleteUserAlbums",
                name: item,
            }).then(({ arg }) => {
                this.changeAlbums(arg);
                // 删除后是否需要自动刷新相册？
            });
            // this.changeAlbums(this.userAlbums);
        },
        changeAlbums(albums, autoRefresh) {
            if (typeof albums === "object") {
                this.userAlbums = albums;
                // console.log(this.userAlbums, "this.userAlbums");

                // 需要手动点击刷新相册
                this.$nextTick(() => {
                    autoRefresh && this.confirmAlbums();
                    // state更新后 刷新相册 按钮才可以点击
                });
            }
        },
        async selectDir() {
            const result = await remote.dialog.showOpenDialog({
                properties: ["openDirectory"],
            });
            const paths = result.filePaths.map((item) => {
                console.log(item.split("\\").join("/"));

                return item.split("\\").join("/");
            });
            if (result.filePaths.length) {
                ipcCmdOnce(ipcRenderer, {
                    cmd: "addUserAlbums",
                    filePaths: paths || result.filePaths,
                }).then(({ arg }) => {
                    this.changeAlbums(arg);
                });
            }
        },
        confirmAlbums() {
            console.log("刷新相册");
            for (let i in this.threadPool) {
                // console.log(this.threadPool[i]);
                this.threadPool[i] && this.threadPool[i].terminate();
            }
            this.threadPool = [];
            for (let i in this.userAlbums) {
                fsWorker.postMessage({
                    cmd: "readdir",
                    path: i,
                });
            }
            // console.log(paths);
            // 选取目录
            // 可以设置一个示例目录
            const folderPath = "c:/Users/GF/Desktop/";
        },
        startThumWorkers(threadNumber, fileList) {
            const ths = threadNumber || 1;
            const threadPool = [];
            const FileListLength = fileList.length;

            // 分配图像到线程
            let m = parseInt(FileListLength / ths);
            let n = FileListLength % ths;
            let startIndex = 0;
            let nextIndex = 0;

            for (let i = 0; i < ths; i++) {
                threadPool[i] = new GmWorker();
                let list = [];
                if (ths === 1) {
                    list = fileList;
                } else {
                    if (i === ths - 1) {
                        m += n;
                    }
                    nextIndex = startIndex + m;
                    list = fileList.slice(startIndex, nextIndex);
                    startIndex = nextIndex;
                }
                threadPool[i].postMessage({
                    thumbnailsPath,
                    FileList: list,
                    threadId: i,
                });
            }

            this.threadPool = this.threadPool.concat(threadPool);
        },
        getFileList(files) {
            // worker读取选中目录中所有图片
            fsWorker.postMessage({
                cmd: "getFileList",
                listObject: files,
            });
        },
        sendFilesToParent(files, cmd) {
            this.$emit("updateFiles", { files, cmd });
        },
    },
};
</script>
<style lang="scss">
.home {
    position: fixed;
    width: 100vw;
    height: 100vh;
    display: flex;
    .menus {
        // max-width: 10%;
        width: 200px;
        height: 100%;
        // background-color: aquamarine;
        border-right: solid 1px #cecece;
    }
    .content {
        width: calc(100% - 200px);
        height: 100%;
        overflow-y: scroll;
    }
    // background-color: red;
}
</style>