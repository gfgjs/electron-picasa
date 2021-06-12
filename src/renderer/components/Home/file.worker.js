// worker.js
import fs from 'fs'
import { hashCode } from '../../../common-tools'
import registerPromiseWorker from 'promise-worker/register';

let FileTree = {} // 文件夹/文件 树结构
let FileList = [] // 一维数组
let FolderTree = {} // 树
let FolderList = [] // 一维
let HashForUrlList = {} //一维
// let Albums = {} // 树



const store = {
    setFileTree: e => FileTree = e,
    setFileList: e => FileList = e,
    setFolderTree: e => FolderTree = e,
    setFolderList: e => FolderList = e,
    setHashForUrlList: e => HashForUrlList = e,

    getFileTree: () => FileTree,
    getFileList: () => FileList,
    getFolderTree: () => FolderTree,
    getFolderList: () => FolderList,
    getHashForUrlList: () => HashForUrlList,

    updateFileList: path => {
        FileList.push(path)
    },
    updateFileTree: (path, data) => {
        FileTree[path] = data
    },
    updateFolderList: path => {
        FolderList.push(path)
    },
    updateHashForUrlList: (hash, path) => {
        HashForUrlList[hash] = path
    }
}

registerPromiseWorker(function (message) {
    if (typeof message === 'object') {
        switch (message.cmd) {
            case 'getFolderList':
                return readdir(message.paths)
                break
            default:
                return 0
        }
    } else {

    }
});
function readdir(paths) {
    // 初始化
    store.setFileTree({})
    store.setFileList([])
    // store.setFolderTree({})
    // store.setFolderList([])
    store.setHashForUrlList({})

    console.time("读取目录耗时");
    for (let i in paths) {
        console.log('相册:', i);
        const path = i
        const pathSplit = path.split('/')
        const name = pathSplit[pathSplit.length - 1]
        // 遍历目录树
        store.updateFileTree(i, getFolderContent(path, name))
    }
    console.timeEnd("读取目录耗时");

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
        if (data[i].type === 'dir') {
            obj.push({ ...data[i], children: calcFolderTreeV2(data[i].children) })
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
                const pathHash = hashCode(path)
                obj = {
                    name,
                    path,
                    type: "file",
                    pathHash: pathHash + '.webp',
                };
                // 图片文件单独一个数组
                store.updateHashForUrlList(pathHash, path)
                store.updateFileList(path)
            }
        } else if (stat.isDirectory()) {
            obj = {
                name,
                path,
                children: {},
                type: "dir"
            };
            // store.updateFolderList(path)

            const folder = fs.readdirSync(path);
            if (folder.length) {
                store.updateFileList({ type: 'folder-sign' })
                folder.forEach((item) => {
                    obj.children[item] = getFolderContent(path + '/' + item, item);
                })
            }
        }
        // 应附加文件信息，但文件信息无需存入store，因为可能变更
        // 此方法耗时
        // console.log(stat);
        // Object.assign(obj, stat)
        obj.ctimeMs = stat.ctimeMs
        return obj
    } catch (e) {
        console.error(e);
    }
    // }
}