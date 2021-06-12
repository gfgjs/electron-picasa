// 读取目录、文件，排序等
import fs from 'fs'
import registerPromiseWorker from 'promise-worker/register';
import { hashCode } from '../../../common-tools'

let FOLDER_HASH = 1 // 文件夹的hash单独计算

let FileTree = {} // 文件夹/文件 树结构
let FileList = [] // 一维数组
let ThumbsList = []
let HashForUrlList = {} //一维

const store = {
    setFileTree: e => FileTree = e,
    setFileList: e => FileList = e,
    setHashForUrlList: e => HashForUrlList = e,
    setThumbsList: e => ThumbsList = e,

    // 应当返回源对象的复制，否则可能会出现意外的update，这样速度更慢，且数据量过大时内存占用很多，但更安全
    getFileTree: () => FileTree,
    getFileList: () => FileList,
    getThumbsList: () => ThumbsList,
    getHashForUrlList: () => HashForUrlList,

    updateFileList: path => {
        FileList.push(path)
    },
    updateFileTree: (path, data) => {
        FileTree[path] = data
    },
    updateThumbsList: hash => {
        ThumbsList.push(hash)
    },
    updateHashForUrlList: (hash, path) => {
        HashForUrlList[hash] = path
    }
}

function initStore() {
    store.setFileTree({})
    store.setFileList([])
    store.setThumbsList([])
    store.setHashForUrlList({})
    FOLDER_HASH = 1
}

registerPromiseWorker(function (message) {
    if (typeof message === 'object') {
        switch (message.cmd) {
            case 'getFolderList':
                // stpe_1 更新相册后读取目录
                const tree = readdir(message.paths)
                console.log('tree.length:', JSON.stringify(tree).length / 1000 + 'kb');
                return tree
            case 'getThumbsList':
                // step_2.1 返回缩略图的hash，开始渲染节点在页面，点击图片可通过hash找到源文件地址
                console.log('ThumbsList.length:', JSON.stringify(store.getThumbsList()).length / 1000 + 'kb');

                return store.getThumbsList()
            case 'getFileList':
                // step_2.2 返回文件数组，并开始生成缩略图
                // 清除list中的folder-sign（文件夹分割符）
                const list = store.getFileList()
                console.log('FileList.length:', JSON.stringify(list).length / 1000 + 'kb');
                return store.getFileList()
            default:
                return 0
        }
    } else {

    }
});

function readdir(paths) {
    // 初始化
    initStore()

    console.time("读取目录耗时");
    for (let i in paths) {
        // console.log('相册:', i);
        const path = i
        const pathSplit = path.split('/')
        const name = pathSplit[pathSplit.length - 1]
        // 遍历目录树
        store.updateFileTree(i, getFolderContent(path, name))
    }
    console.timeEnd("读取目录耗时");

    // 从FileTree中提取FolderTree（不包含图片的地址等信息）文件夹的tree显示在菜单栏

    // 计算12万次，V2比V1快2~3ms；
    // 两种方式同时计算，V2在V1前时，V2耗时10ms，V1耗时0.4ms左右。？？？
    // V1在V2前时，都耗时10ms左右。

    // V2
    let arr = calcFolderTreeV2(store.getFileTree())

    // V1 
    // let arr = []
    // for (let i in store.getFileTree()) {
    //     let res = calcFolderTreeV1(FileTree[i])
    //     res && arr.push(res)
    // }

    return arr
}
function calcFolderTreeV2(data) {
    let obj = []
    for (let i in data) {
        const item = data[i]
        if (item) {
            if (item.type === 'dir') {
                // 不使用{...}而是直接data[i]会改变源对象
                obj.push({ ...item, children: calcFolderTreeV2(item.children) })
            }
        }
    }
    return obj
}

function calcFolderTreeV1(data) {
    let obj = {}
    if (data.type === 'dir') {
        obj = { ...data, children: [] }
        for (let i in data.children) {
            if (data.children[i].type === 'dir') {
                obj.children.push(calcFolderTreeV1(data.children[i]))
            }
        }
        return obj
    }
}

function getFolderContent(path, name) {
    // if(fs.existsSync(path)){
    try {
        let obj = {}
        const stat = fs.statSync(path)

        if (stat.isFile()) {
            let ext = path.substr(path.lastIndexOf(".") + 1);
            // console.log(ext);
            if (ext && 'jpg jpeg gif png'.includes(ext.toLowerCase())) {
                const hash = hashCode(path)
                obj = {
                    name,
                    path,
                    type: "file",
                    hash
                    //  + '.webp',
                };
                // 图片文件单独一个数组
                // todo 用setTimeout处理成异步更好吗？
                store.updateHashForUrlList(hash, path)
                store.updateFileList(path)
                store.updateThumbsList(hash)

                obj.ctimeMs = stat.ctimeMs
                return obj
            }
        } else if (stat.isDirectory()) {
            // const hash = hashCode(path)
            // store.updateFolderList(path)

            const folder = fs.readdirSync(path);
            // 过滤掉没有内容的文件夹
            if (folder.length) {
                FOLDER_HASH++
                obj = {
                    name,
                    path,
                    children: {},
                    type: "dir",
                    hash: FOLDER_HASH
                };

                // store.updateFileList('electron-picasa-folder-sign'+name)
                // 向缩略图列表插入folder-sign（文件夹分隔标志）

                // folder-sign为数字（无法点击菜单中目录名跳转，可保持ThumbsList中只存在Number元素）
                // store.updateThumbsList(999999999)

                // folder-sign为{}（可以点击菜单中目录名跳转，不可保持ThumbsList中只存在Number元素）

                // 文件夹hash单独计算，为自增的数字，大小上限为1000000，图片的hash至少9位数
                // 可能出现的问题：更新相册目录时，整体ThumbsList变动，但页面可能不更新？
                store.updateThumbsList(FOLDER_HASH)

                folder.forEach((item) => {
                    const child = getFolderContent(path + '/' + item, item);
                    child && (obj.children[item] = child)
                })
                obj.ctimeMs = stat.ctimeMs
                return obj
            }
        }
        // 应附加文件信息，但文件信息无需存入store，因为可能变更
        // 此方法耗时
        // console.log(stat);
        // Object.assign(obj, stat)

        // obj.ctimeMs = stat.ctimeMs
        // return obj
        return null
    } catch (e) {
        console.error(e);
    }
    // }
}