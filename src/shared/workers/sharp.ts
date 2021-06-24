//@ts-nocheck
// 处理超过1000张图片时，sharp耗时仅为gm的1/3左右，且sharp不用额外安装软件
const sharp = require(process.env.NODE_ENV === 'development'
    ? '/Users/gf/Desktop/epicasa-next/node_modules/sharp'
    : 'sharp')
const fs = require('fs')

import { hashCode } from '../sharedLib'
let thumbnailsPath = ''
let fileList = []

self.onmessage = async (e: any) => {
    const data = e.data

    if (data.thumbnailsPath && data.fileList) {
        thumbnailsPath = data.thumbnailsPath
        fileList = data.fileList
        const thumbList = fs.readdirSync(data.thumbnailsPath)
        const size = data.thumbSize * data.thumbSizeBase
        const quilaty = data.thumbQuilaty
        let length = fileList.length
        for (let i = 0; i < length; i++) {
            let path = fileList[i]

            if (path) {
                let ext = path.substr(path.lastIndexOf('.') + 1)
                if (
                    ext &&
                    'jpg jpeg gif png webp'.includes(ext.toLowerCase())
                ) {
                    // gif需要另外处理，sharp要处理gif需要额外安装依赖
                    let imgName = hashCode(path).toString()
                    //  + '.webp'
                    // 已存在则不再生成缩略图
                    if (!thumbList.includes(imgName)) {
                        // resize为异步过程，同时处理过多图片会爆
                        await resizeImg(path, imgName, size, quilaty)
                    }
                }
            } else {
            }
        }
        self.close()
    }
}

function resizeImg(
    path: string,
    imgName: string,
    size: number,
    quilaty: number
) {
    return new Promise((resolve, reject) => {
        const buf = fs.readFileSync(path)
        const img = sharp(buf)
            .resize(null, size)
            .webp({ lossless: false, quilaty })
        try {
            img.toFile(
                thumbnailsPath + '/' + imgName,
                function (err: any, info: any) {
                    // console.log((info.size / 1000) + ' kb')
                    if (err) {
                        console.log('图片处理错误：', err, path)
                        reject(err)
                    } else {
                        resolve(true)
                    }
                }
            )
        } catch (e) {
            reject(e)
        }
    })
}
