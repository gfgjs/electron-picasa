// 处理超过1000张图片时，sharp耗时仅为gm的1/3左右，且sharp不用额外安装软件


// 开发环境下只能通过绝对路径引入sharp，但打包后白屏；
// 常规引入在开发时，会提示 Uncaught Error: Cannot find module 'sharp'；
// 可能是webpack的问题
// 
const sharp = require(process.env.NODE_ENV !== 'production' ? '../../../../node_modules/sharp' : 'sharp')
// 暂时解决

import { hashCode } from '../../../common-tools'
import fs from "fs";
let thumbnailsPath = '', FileList = []

self.onmessage = async e => {
    if (e.data.thumbnailsPath && e.data.FileList) {
        thumbnailsPath = e.data.thumbnailsPath
        FileList = e.data.FileList
        const thumbList = fs.readdirSync(thumbnailsPath)
        // const flag = 'gm线程：' + e.data.threadId + ' ' + '处理数量：' + FileList.length

        // console.log(flag)
        // console.time(flag)
        let length = FileList.length
        for (let i = 0; i < length; i++) {
            let path = FileList[i]

            if (path) {
                let ext = path.substr(path.lastIndexOf(".") + 1);
                if (ext && 'jpg jpeg gif png webp'.includes(ext.toLowerCase())) {
                    // gif需要另外处理，sharp要处理gif需要额外安装依赖
                    let imgName = hashCode(path) + '.webp'
                    if (!(thumbList.includes(imgName))) {
                        // resize为异步过程，同时处理过多图片会爆
                        await resizeImg(path, imgName, i)
                    }
                }
            } else {
                continue
            }
        }
        // console.timeEnd(flag)
        self.close()
    }
}

function resizeImg(path, imgName, i) {
    return new Promise((resolve, reject) => {
        const buf = fs.readFileSync(path);
        sharp(buf)
            .resize(null, 640)
            .webp({ lossless: false, quality: 60 })
            .toFile(thumbnailsPath + '/' + imgName, function (err, info) {
                // console.log((info.size / 1000).toFixed(3) + ' kb')
                if (err) {
                    console.log(err, thumbnailsPath + '/' + imgName)
                    reject(err)
                } else {
                    resolve()
                    // console.log(i,imgName)
                }
            })
    })
}
