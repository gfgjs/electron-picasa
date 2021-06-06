import fs from 'fs'
import { hashCode } from '../../../common-tools'

self.onmessage = e => {
    const data = e.data

    switch (data.cmd) {
        case 'readdir':
            readdir(data.path)
            break
        case 'getFileList':
            const list = []
            getFileList(data.listObject, list)

            self.postMessage({
                type: 'FileList',
                FileList: list
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
            console.log(3)
            break
    }
}

function getFileList(obj, list) {
    // console.log(obj);
    if (obj.type === 'file') {
        list.push(obj.path)
    } else if (obj.type === 'dir') {
        for (let i in obj.children) {
            getFileList(obj.children[i], list)
        }
    }
}

function readdir(path) {
    console.time("读取目录树耗时");
    const pathSplit = path.split('/')
    const name = pathSplit[pathSplit.length - 1]

    // 遍历目录树
    const folder = getFolderContent(path, name);
    console.log(folder);

    console.timeEnd("读取目录树耗时");

    self.postMessage({
        type: 'folder',
        folder
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
            obj = {
                name,
                path,
                children: {},
                type: "dir"
            };
            const folder = fs.readdirSync(path);
            folder.forEach((item) => {
                obj.children[item] = getFolderContent(path + '/' + item, name);
            })
        }
        Object.assign(obj,stat)

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