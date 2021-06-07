import fs from 'fs'
import { hashCode } from '../../../common-tools'


self.onmessage = e => {
    let data = e.data

    switch (data.cmd) {
        case 'readdir':
            readdir(data.paths)
            break
        case 'getFileList':
            const LIST = []
            // 树结构目录一维化
            getFileList(data.listArray, LIST)

            self.postMessage({
                type: 'FileList',
                FileList: LIST
            })
            break
        case 'getThumbList':
            // 同步
            // self.postMessage({
            //     type: 'ThumbList',
            //     ThumbList: fs.readdirSync(data.thumbnailsPath)
            // })

            // 异步
            fs.readdir(data.thumbnailsPath, (err, files) => {
                if (err) {
                    self.postMessage({
                        type: 'ThumbList',
                        ThumbList: []
                    })
                    throw err
                } else {
                    self.postMessage({
                        type: 'ThumbList',
                        ThumbList: files
                    })
                }
            })
            break
        default:
            console.log('default')
            break
    }
}

function getFileList(obj, LIST) {
    if (obj.type === 'file') {
        LIST.push(obj.path)
    } else if (obj.type === 'dir') {
        for (let i in obj.children) {
            getFileList(obj.children[i], LIST)
        }
    }
}

function readdir(paths) {
    console.time("读取目录耗时");
    let folder = []

    for (let i in paths) {
        const path = i
        const pathSplit = path.split('/')
        const name = pathSplit[pathSplit.length - 1]

        // 遍历目录树
        folder = getFolderContent(path, name);
    }

    console.timeEnd("读取目录耗时");

    self.postMessage({
        type: 'folder',
        folderJsonStr: folder
    })
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
                obj = {
                    name,
                    path,
                    type: "file",
                    pathHash: hashCode(path) + '.webp',
                };
            }
        } else if (stat.isDirectory()) {
            // console.log(name);
            obj = {
                name,
                path,
                children: {},
                type: "dir"
            };
            const folder = fs.readdirSync(path);
            folder.forEach((item) => {
                obj.children[item] = getFolderContent(path + '/' + item, item);
            })
        }
        // console.log(stat);
        // 应附加文件信息，但文件信息无需存入store，因为可能变更
        // 此方法耗时
        // Object.assign(obj)
        return obj
    } catch (e) {
        //   console.error(e);
    }
    // }
}
function isDir(path) {
    const stat = fs.statSync(path);
    return stat.isDirectory();
}
function isFile(path) {
    const stat = fs.statSync(path);
    return stat.isFile();
}