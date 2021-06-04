import fs from 'fs'
import { hashCode } from '../tools'

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
                }else{
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
    if (obj.type === 'file') {
        list.push(obj.path)
    } else if (obj.type === 'dir') {
        for (let i in obj.children) {
            getFileList(obj.children[i], list)
        }
    }
}

function readdir(selectedPath) {
    console.time("读取目录树耗时");
    // const files = getFolderContent(path, "SynologyDrive/pixiv tags");
    const index = selectedPath.lastIndexOf("\\") + 1
    
    const name = selectedPath.substr(index);
    const path = selectedPath.slice(0,index)
    
    // 递归遍历目录树
    const files = getFolderContent(path, name);

    console.timeEnd("读取目录树耗时");
    self.postMessage({
        type: 'folder',
        files
    })
}
function getFolderContent(basePath, name) {
    let obj = {};
    let path = basePath + name;

    if (isFile(path)) {
        let ext = path.substr(path.lastIndexOf(".") + 1);
        if (ext && 'jpg jpeg gif png'.includes(ext.toLowerCase())) {
            obj = {
                name,
                path,
                type: "file",
                pathHash: hashCode(path) + '.webp',
                // path64: (new Buffer(path).toString('base64')).replace(/\//g,'')
            };
        }
    } else if (isDir(path)) {
        path = path + "/";
        obj = {
            name,
            path,
            children: {},
            type: "dir",
        };
        const folder = fs.readdirSync(path);
        folder.forEach((item, index) => {
            obj.children[item] = getFolderContent(path, item);
        });
    }
    return obj;
}
function isDir(path) {
    const stat = fs.statSync(path);
    return stat.isDirectory();
}
function isFile(path) {
    const stat = fs.statSync(path);
    return stat.isFile();
}