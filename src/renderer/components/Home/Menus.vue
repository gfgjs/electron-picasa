<template>
    <div class="menus-list">
        <div v-for="(item, index) in userAlbums" :key="index">
            <el-button type="warning" size="default" @click="deleteAlbum(item)"
                >删除</el-button
            >
            <code>{{ item }}</code>
        </div>
        <el-button type="primary" @click="selectDir">添加文件夹</el-button>
        <el-button type="success" @click="refreshAlbums">刷新相册</el-button>
    </div>
</template>
<script>
import { mapGetters } from "vuex";
import FileListEm from "@/components/Home/FileList.vue";

import FsWorker from "worker-loader!./fs-worker.js";
import GmWorker from "worker-loader!./gm-worker.js";

const { remote, ipcRenderer } = require("electron");
const ipc = ipcRenderer;
const fsWorker = new FsWorker();

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
        fsWorker.onmessage = (e) => {
            let data = e.data;

            switch (data.type) {
                case "folder":
                    //step-2：将所有目录渲染，
                    const folder = data.folderJsonStr;

                    this.updateRender(folder);
                    // 应异步将新的目录表存入e-store
                    // 应存入另一个e-store文件
                    // ipc.invoke('setStoreValue','folderJsonStr',folderJsonStr)
                    break;
                case "FileList":
                    // step-5：worker处理完树结构，返回一维数组
                    // 开始生成缩略图 可选多线程

                    this.startThumWorkers(6, data.FileList);
                    break;
                default:
                    break;
            }
        };
        fsWorker.onerror = function (e) {
            // console.log(e);
        };

        this.thumbnailsPath =
            (await ipc.invoke("getUserDataPath")) + "/thumbnails";

        // 首次进入自动刷新一次相册
        // 尝试从electron-store中读取目录表
        // folder = await ipcRenderer.invoke(
        //     "getStoreValue",
        //     "folderJsonStr"
        // );
        // folder = JSON.parse(folder);

        this.changeAlbums(
            await ipc.invoke("getStoreValue", "userAlbums"),
            true
        );
    },
    methods: {
        // ipcRenderer通信传参可以是Promise对象，会自动提取reslove中的数据
        // ipcRenerder传参应先序列化，否则其本身会之行序列化，但效率较低

        async updateRender(folder) {
            // 将目录渲染到视图
            // 应分片渲染
            this.sendFilesToParent(folder);
            // step-3：整理文件目录以开始生成缩略图
            this.getFileList(folder);
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
                // 更新e-store中的用户相册
                ipc.invoke("setStoreValue", "userAlbums", albums);
            }
        },
        refreshAlbums() {
            console.log("刷新相册", this.userAlbums);
            for (let i in this.threadPool) {
                // console.log(this.threadPool[i]);
                this.threadPool[i] && this.threadPool[i].terminate();
            }
            this.threadPool = [];
            //step-1：读取相册目录及其子目录
            fsWorker.postMessage({
                cmd: "readdir",
                paths: this.userAlbums,
            });
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
            // step-4：发送所有目录到worker，降维目录树对象
            fsWorker.postMessage({
                cmd: "getFileList",
                // listObject: files,
                listArray: files,
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