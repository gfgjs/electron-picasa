import fs from "fs"

// 处理超过1000张图片时，sharp耗时仅为gm的1/3左右，且sharp不用额外安装软件
// 开发环境下只能通过相对路径引入sharp，但打包后白屏
// 常规引入在开发时，会提示 Uncaught Error: Cannot find module 'sharp'
// 可能是webpack的问题，暂时解决
const sharp = require(process.env.NODE_ENV !== 'production' ? '../../../../node_modules/sharp' : 'sharp')
// import sharp from 'sharp'
import { hashCode } from '../../../common-tools'
let thumbnailsPath = '',
    fileList = []

self.onmessage = async e => {
    const data = e.data
    if (data.thumbnailsPath && data.fileList) {
        thumbnailsPath = data.thumbnailsPath
        fileList = data.fileList
        const thumbList = fs.readdirSync(thumbnailsPath)

        let length = fileList.length
        for (let i = 0; i < length; i++) {
            let path = fileList[i]

            if (path) {
                let ext = path.substr(path.lastIndexOf(".") + 1);
                if (ext && 'jpg jpeg gif png webp'.includes(ext.toLowerCase())) {
                    // gif需要另外处理，sharp要处理gif需要额外安装依赖
                    let imgName = hashCode(path)
                    //  + '.webp'
                    // 已存在则不再生成缩略图
                    if (!(thumbList.includes(imgName))) {
                        // resize为异步过程，同时处理过多图片会爆
                        await resizeImg(path, imgName, i)
                    }
                }
            } else {
                continue
            }
        }
        self.close()
    }
}

function resizeImg(path, imgName, i) {
    return new Promise((resolve, reject) => {
        const buf = fs.readFileSync(path);
        const img = sharp(buf)
            .resize(null, 64)
            .webp({ lossless: false, quality: 1 })
        try {
            img.toFile(thumbnailsPath + '/' + imgName, function (err, info) {
                // console.log((info.size / 1000) + ' kb')
                if (err) {
                    console.log('图片处理错误：', err, path)
                    reject(err)
                } else {
                    resolve()
                }
            })
        } catch (e) {
            reject(err)
        }
    })
}