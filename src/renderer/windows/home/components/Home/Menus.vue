<template>
    <div class="menus-list">
        <div class="handle">
            <div class="slider">
                <div class="slider-item">
                    <span>质量</span>
                    <el-slider
                        @change="configChange('thumbQuilaty')"
                        v-model="userConfig.thumbQuilaty"
                        :min="10"
                        :max="70"
                        :step="30"
                        show-stops
                    ></el-slider>
                </div>
                <div class="slider-item">
                    <span>大小</span>
                    <el-slider
                        :min="1"
                        @change="configChange('thumbSize')"
                        v-model="userConfig.thumbSize"
                    ></el-slider>
                </div>
                <div class="slider-item">
                    <span>线程数</span>
                    <el-slider
                        :min="1"
                        :max="128"
                        @change="configChange('threadNumber')"
                        v-model="userConfig.threadNumber"
                    ></el-slider>
                </div>
            </div>

            <div class="handle-button">
                <el-button type="primary" size="small" @click="selectDir"
                    >添加文件夹</el-button
                >
                <el-button type="success" size="small" @click="refreshAlbums"
                    >刷新相册</el-button
                >
            </div>
        </div>
        <el-tree
            class="folder-tree"
            :data="folderTree"
            :props="defaultProps"
            @node-click="scrollToFolder"
            show-checkbox
            node-key="hash"
            :default-expanded-keys="[
                scrollTarget.action === 'open-tree' && scrollTarget.hash,
            ]"
            @check-change="handleCheckChange"
        ></el-tree>
    </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
const { ipcRenderer, dialog } = window.electron
import PromiseWorker from 'promise-worker'

// 文件处理线程
import FileWorker from '/@shared/workers/file?worker'

// 图像处理
import SharpWorker from '/@shared/workers/sharp?worker'

// 页面刷新时，退出程序前，应关闭worker
const fileWorker = new PromiseWorker(new FileWorker())

export default {
    name: 'Menus',
    components: {},
    data() {
        return {
            expanded: [],
            Files: {
                children: {},
                name: '',
            },
            thumbnailsPath: '',
            threadPool: {},
            userAlbums: {},
            folderTree: [],
            defaultProps: {
                children: 'children',
                label: 'name',
            },
        }
    },
    watch: {
        userConfig(e) {
            // console.log({ ...e })
        },
        scrollTarget(t) {
            // console.log({ ...t })

            // if (t.action === 'preview') {
            // 打开预览窗口
            // fileWorker
            //     .postMessage({ cmd: 'preview', hash: t.imgHash })
            //     .then((res) => {
            ipcRenderer.invoke('window', 'preview', 'show')

            ipcRenderer.invoke('preview', t.imgHash)
            // console.log(res)
            // })
            // }
        },
    },
    computed: {
        ...mapGetters(['userConfig', 'scrollTarget']),
    },
    async mounted() {
        this.thumbnailsPath =
            (await ipcRenderer.invoke('getUserDataPath')) + '/thumbnails'

        // console.time('set')
        // await ipcRenderer.invoke('setStoreValue', 'jsonStr', res)
        // console.timeEnd('set')

        // console.time('get')
        // let str = await ipcRenderer.invoke('getStoreValue', 'jsonStr')
        // console.timeEnd('get')

        // 进入程序刷新一次
        this.changeAlbums(
            await ipcRenderer.invoke('getStoreValue', 'USER_ALBUMS'),
            true
        )
    },
    methods: {
        ...mapActions(['SCROLL_TARGET', 'USER_CONFIG']),
        configChange(key) {
            this.USER_CONFIG({
                [key]: this.userConfig[key],
            })
        },
        handleCheckChange(e, f) {
            console.log(e, f)
        },
        scrollToFolder(item) {
            this.SCROLL_TARGET({ hash: item.hash, action: 'scroll-to-img' })
        },
        // ipcRenderer通信传参可以是Promise对象，会自动提取reslove中的数据
        // ipcRenerder传参应先序列化，否则其本身会之行序列化，但效率较低
        deleteAlbum(item) {
            this.$delete(this.userAlbums, item)
            this.sendFilesToParent({ path: item }, 'delete')
            // this.changeAlbums(this.userAlbums);
            // 点击删除时，直接从worker里的list删除，还是重新扫描文件夹？

            ipcRenderer.invoke('setStoreValue', 'USER_ALBUMS', this.userAlbums)
        },
        changeAlbums(albums, autoRefresh) {
            if (typeof albums === 'object') {
                this.userAlbums = albums

                // 需要手动点击刷新相册
                this.$nextTick(() => {
                    autoRefresh && this.refreshAlbums()
                    // state更新后 刷新相册 按钮才可以点击
                })
            }
        },
        async selectDir() {
            // 选取目录
            // 可以设置一个示例目录

            const result = await dialog.showOpenDialog({
                properties: ['openDirectory'],
            })
            const paths = result.filePaths.map((item) => {
                return item.split('\\').join('/')
                // + "/";
            })

            if (paths.length) {
                // 选择目录后去重，如存在父级，将子级移除，仅保留父级
                let albums = await ipcRenderer.invoke(
                    'getStoreValue',
                    'USER_ALBUMS'
                )

                paths.forEach((item) => {
                    albums[item] = item
                })
                // 去重可能有问题，比如
                // [c:folder]
                // [c:folder - 副本]，两者应当同级

                let check = []
                for (let i in albums) {
                    check.push(albums[i])
                }
                check.sort((a, b) => a.length - b.length)

                for (let i in check) {
                    for (let j in albums) {
                        if (check[i] === albums[j]) {
                        } else {
                            if (albums[j].includes(check[i])) {
                                delete albums[j]
                            }
                        }
                    }
                }
                this.changeAlbums(albums)
                // 更新e-store中的用户相册
                ipcRenderer.invoke('setStoreValue', 'USER_ALBUMS', albums)
            }
        },
        refreshAlbums() {
            //step_1：读取相册目录及其子目录
            fileWorker
                .postMessage(
                    JSON.stringify({
                        cmd: 'getFolderList',
                        paths: this.userAlbums,
                        userConfig: this.userConfig,
                    })
                )
                .then(async (res) => {
                    // 读取所有目录及文件完毕
                    this.folderTree = res
                    // 渲染缩略图节点
                    this.sendFilesToParent()
                    // 后台创建缩略图
                    this.createThumbs()
                    // 初始化预览界面数据
                    this.initPreviewData()
                })
                .catch((e) => {
                    console.log(e)
                })
        },
        initPreviewData() {
            fileWorker.postMessage({ cmd: 'preview-init' }).then((res) => {
                ipcRenderer.invoke('preview-init', res)
            })
        },
        sendFilesToParent() {
            fileWorker
                .postMessage({
                    cmd: 'getThumbsList',
                })
                .then((folder) => {
                    this.$emit('updateFiles', { folder })
                })
        },
        createThumbs() {
            // 由主进程开始worker
            // fileWorker.postMessage({ cmd: 'getFileList' }).then((jsonStr) => {
            //     ipcRenderer.send(
            //         'cmd_start_create_thumbs',
            //         jsonStr,
            //         toRaw(this.userConfig)
            //     )
            // })
            // 在渲染进程开始worker
            // 尝试结束之前运行的worker
            for (let i in this.threadPool) {
                this.threadPool[i] && this.threadPool[i].terminate()
            }
            // 重置线程池
            this.threadPool = []

            fileWorker.postMessage({ cmd: 'getFileList' }).then(async (res) => {
                this.startThumWorkers(res, this.userConfig)
            })
        },

        startThumWorkers(jsonStr, config) {
            const fileList = JSON.parse(jsonStr)
            const ths = config.threadNumber || 1 // 并行线程数
            const threadPool = []
            const fileListLength = fileList.length
            const stepLength = Math.ceil(fileListLength / ths)
            let startIndex = 0

            // 尝试结束之前运行的worker
            for (let i in this.threadPool) {
                this.threadPool[i] && this.threadPool[i].terminate()
            }
            // 重置线程池
            this.threadPool = []

            // 分配任务到线程
            for (let i = 0; i < ths; i++) {
                const worker = new SharpWorker()
                worker.onmessage = (e) => {
                    // 在此处发送进度到renderer
                    console.log(e)
                }
                // todo 应当接收处理进度显示在页面
                worker.postMessage({
                    thumbnailsPath: this.thumbnailsPath,
                    fileList: fileList.slice(
                        startIndex,
                        startIndex + stepLength
                    ),
                    threadId: i,
                    ...config,
                })

                threadPool[i] = worker
                startIndex += stepLength
            }

            this.threadPool = threadPool
        },
    },
}
</script>
<style lang="scss" scoped>
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
.menus-list {
    /* display: flex; */
    /* flex-direction: column; */
    /* align-items: center; */
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    position: relative;

    .handle {
        width: 100%;
        height: 20%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 10px;
        box-sizing: border-box;
        .handle-button {
            width: 100%;
            display: flex;
            justify-content: center;
        }
        .slider {
            display: flex;
            box-sizing: border-box;
            width: 100%;
            padding: 0 10px;
            flex-direction: column;
            .slider-item {
                display: flex;
                align-items: center;
                justify-content: space-around;
                font-size: 13px;
                width: 100%;
                .el-slider {
                    width: 60%;
                }
            }
        }
    }

    .folder-tree {
        width: 100%;
        height: 80%;
        overflow: scroll;
    }
    .folder-tree::-webkit-scrollbar {
        width: 6px;
    }
    .folder-tree::-webkit-scrollbar-thumb {
        background-color: #b5dd57;
        border-radius: 3px;
    }
}
</style>
