<template>
    <div class="menus-list">
        <div v-for="item in userAlbums" :key="item">
            <button @click="deleteAlbum(item)">删除</button>
            <code>{{ item }}</code>
            <div style="width: 100%; height: 100px" @click="deleteAlbum(item)">
                删除
            </div>
        </div>
        <button @click="selectDir">添加文件夹</button>
        <button @click="refreshAlbums">刷新相册</button>
    </div>
</template>
<script>
import { mapGetters } from "vuex";
import FileListEm from "@/components/Home/FileList.vue";

import FsWorker from "worker-loader!./fs-worker.js";
import GmWorker from "worker-loader!./gm-worker.js";

const { remote, ipcRenderer } = require("electron");
const ipc = ipcRenderer;

// const userDataPath = remote.app.getPath("userData");
// const thumbnailsPath = userDataPath + "/thumbnails";

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
            thumbnailsPath: "",
            threadPool: {},
            userAlbums: {},
        };
    },
    computed: {
        ...mapGetters(["testState"]),
    },
    async mounted() {
        // this.timeTestStr();
        this.timeTestStr();

        fsWorker.onmessage = (e) => {
            const data = e.data;
            switch (data.type) {
                case "folder":
                    // const simdjson = require('simdjson');

                    // const jsonString = "{ \"answer\": 42 }";
                    // const valid = simdjson.isValid(jsonString); // true

                    // let folder = data.folder;
                    // this.timeTest(data.folder)

                    // console.log('读store', Date.now());
                    // folder = ipcRenderer.invoke("getStoreValue", "json");

                    // console.log('写store>序列化', Date.now());
                    // folder = JSON.stringify(folder);
                    // console.log(folder);

                    // console.log('写store>源对象', Date.now());
                    // folder = JSON.stringify(folder);

                    // ipcRenderer.invoke("setStoreValue", "json", folder);

                    // console.timeEnd("传输耗时");

                    // this.sendFilesToParent(folder);
                    // this.getFileList(folder);
                    break;
                case "FileList":
                    FileList = data.FileList;
                    // 开始生成缩略图 6线程
                    // this.startThumWorkers(1, data.FileList);
                    break;
                default:
                    console.log("======");
                    break;
            }
        };
        fsWorker.onerror = function (e) {
            // console.log(e);
        };

        this.thumbnailsPath =
            (await ipc.invoke("getUserDataPath")) + "/thumbnails";

        // this.changeAlbums(
        //     await ipc.invoke("getStoreValue", "userAlbums"),
        //     true
        // );
        // 首次进入自动刷新一次相册
    },
    methods: {
        // ipcRenderer通信传参可以是Promise对象，会自动提取reslove中的数据
        // ipcRenerder传参应先序列化，否则其本身会之行序列化，但效率较低

        // const simdjson = require('simdjson');
        // const jsonString = "{ \"answer\": 42 }";
        // const valid = simdjson.isValid(jsonString); // true
        async timeTestStr(folder) {
            // console.log("读store开始 - ", Date.now());
            folder = await ipcRenderer.invoke(
                "getStoreValue",
                "folderJsonStr",
                Date.now()
            );

                        console.log( Date.now() - folder.time );

            return

            // console.log("写store>序列化 - 开始", Date.now());
            ipcRenderer.invoke(
                "setStoreValue",
                "folderJsonStr",
                folder,
                Date.now()
            );

            console.timeEnd("传输耗时");
        },

        async timeTestObj(folder) {
            // console.log("读store - 开始", Date.now());
            folder = await ipcRenderer.invoke(
                "getStoreValue",
                "folderObject",
                Date.now()
            );
            console.log( Date.now() - folder.time );
            return

            // console.log("写store>源对象 - 开始", Date.now());
            ipcRenderer.invoke(
                "setStoreValue",
                "folderObject",
                folder,
                Date.now()
            );
            console.timeEnd("传输耗时");
        },

        deleteAlbum(item) {
            this.$delete(this.userAlbums, item);
            this.sendFilesToParent({ path: item }, "delete");
            // this.changeAlbums(this.userAlbums);

            ipc.invoke("setStoreValue", "userAlbums", this.userAlbums);
        },
        changeAlbums(albums, autoRefresh) {
            if (typeof albums === "object") {
                this.userAlbums = albums;

                // 需要手动点击刷新相册
                this.$nextTick(() => {
                    autoRefresh && this.refreshAlbums();
                    // state更新后 刷新相册 按钮才可以点击
                });
            }
        },
        async selectDir() {
            const result = await remote.dialog.showOpenDialog({
                properties: ["openDirectory"],
            });
            const paths = result.filePaths.map((item) => {
                return item.split("\\").join("/");
                // + "/";
            });

            if (paths.length) {
                let albums = await ipc.invoke("getStoreValue", "userAlbums");

                paths.forEach((item) => {
                    albums[item] = item;
                });

                let check = [];
                for (let i in albums) {
                    check.push(albums[i]);
                }
                check.sort((a, b) => a.length - b.length);

                for (let i in check) {
                    for (let j in albums) {
                        if (check[i] === albums[j]) {
                        } else {
                            if (albums[j].includes(check[i])) {
                                delete albums[j];
                            }
                        }
                    }
                }
                this.changeAlbums(albums);
                console.log(
                    'ipc.invoke("setStoreValue", "userAlbums", albums)',
                    JSON.parse(JSON.stringify(albums))
                );
                await ipc.invoke("setStoreValue", "userAlbums", albums);
            }
        },
        refreshAlbums() {
            console.log("刷新相册");
            for (let i in this.threadPool) {
                // console.log(this.threadPool[i]);
                this.threadPool[i] && this.threadPool[i].terminate();
            }
            this.threadPool = [];
            for (let i in this.userAlbums) {
                // ipcRenderer.invoke("setStoreValue", "json", "");
                console.time("传输耗时");

                fsWorker.postMessage({
                    cmd: "readdir",
                    path: i,
                });
            }
            // console.log(paths);
            // 选取目录
            // 可以设置一个示例目录
            // const folderPath = "c:/Users/GF/Desktop/";
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
                    thumbnailsPath: this.thumbnailsPath,
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
        sendFilesToParent(folder, cmd) {
            this.$emit("updateFiles", { folder, cmd });
        },
    },
};
</script>
<style lang="scss">
.ani {
    animation: ani 30000000ms linear infinite;
    width: 100px;
    height: 100px;
    background-color: aquamarine;
}

@keyframes ani {
    0% {
        transform: rotate(0);
    }
    50% {
        // transform: rotate(360deg);
    }
    100% {
        transform: rotate(7200000deg);
    }
}
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