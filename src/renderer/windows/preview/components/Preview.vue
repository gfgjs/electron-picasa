<template>
    <div
        class="preview"
        id="preview"
        @mousewheel.ctrl.exact="mousewheelCtrl"
        @keydown.left="keydownleft"
        @keydown.right="keydownright"
        @keydown.up="keydownup"
        @keydown.down="keydowndown"
        tabindex="0"
    >
        <div class="img-view" id="img-view">
            <div class="wrap" id="img-view-wrap">
                <img
                    id="img-preview"
                    :src="imgSrc"
                    alt=""
                    :style="imgStyle"
                    @mousewheel.exact.prevent="mousewheel"
                    @mousedown="imgmousedown"
                    @mousemove="imgmousemove"
                    @mouseup="imgmouseup"
                    ondragstart="return false;"
                    :onload="mainImgOnload"
                />
            </div>
        </div>
        <div class="bar-list">
            <img
                v-for="(hash, index) in hashList"
                :key="hash"
                :src="thumbsPath + hash"
                alt=""
                @click="clickBar(hash)"
                :class="imgIndex == index && 'current'"
                ondragstart="return false;"
                :id="hash"
            />
        </div>
        <div class="tools">
            <div class="tag" @click="showOriginScale">{{ imgScale }}</div>
            <div class="tag" @click="showItemInFolder">打开目录</div>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'

const ipc = window.electron.ipcRenderer
const shell = window.electron.shell

const es = new (require('electron-store'))()

// 拖动图片
let imgMoveStartX = 0,
    imgMoveStartY = 0,
    translateX = 0,
    translateY = 0,
    imgRealW = 0, //图片真实宽度
    imgRealH = 0, //图片真实高度
    imgMoveEnable = false // 是否按下鼠标

// 定点缩放
let offsetStartX = 0,
    offsetStartY = 0

// 图片缩放比例
let IMG_SCALE = 0, // 实时比例
    IMG_ADAPT_SCALE = 0 // 适应窗口的比例

/**
 * 原理：
 * 要放大图片上某一点A(offsetX,offsetY)
 * 先考虑水平方向，图片真实宽度为w；
 * 设点击点offsetX所占一侧宽度的比例 p = offsetX/(w/2)，(由于图片是朝4个方向缩放，所以水平方向只计算一侧，选左侧)
 * 缩放前实际显示宽度为a = w*IMG_SCALE，
 * 缩放后实际显示宽度为b = w*NEW_IMG_SCALE，(NEW_IMG_SCALE = IMG_SCALE + step)
 * 则
 * 缩放前，目标点到图片中轴线为x = a*(w*scale/2)
 * 缩放后，目标点到图片中轴线为newx = b*(w*scale/2)
 * 所以
 * 缩放后，目标点发生移动的量为 dx = newx - x
 * 要使点A保持不动，只需将图片整体朝缩放方向 反向 translate dx 像素即可
 *
 * 经过简化可得：dx = (1 - 2*offsetX/w)*(w*step/2)
 * **/

export default defineComponent({
    name: 'Preview',
    data() {
        return {
            hashList: [],
            hashForUrlList: {},
            thumbsPath: '',

            // 图片缩放
            defaultTransition: 'linear 0.15s all',

            imgIndex: null,
            imgSrc: '',
            imgStyle: {
                transform: '',
                margin: '',
                transition: '',
            },
            imgScale: 0,
        }
    },
    async mounted() {
        this.thumbsPath = await ipc.invoke('getThumbsPath')

        // const json = JSON.parse(es.get('jsonStr'))

        // for (let i in json.hashList) {
        //     const hash = json.hashList[i]
        //     if (typeof hash === 'number') {
        //         this.hashList.push(hash)
        //     }
        // }
        // this.hashForUrlList = json.hashForUrlList

        ipc.on('preview', (e, hash) => {
            this.imgSrc = this.hashForUrlList[hash]
            this.imgIndex = this.hashList.indexOf(hash)
        })
        ipc.on('preview-init', (e, jsonStr) => {
            const json = JSON.parse(jsonStr)

            // es.set('jsonStr', jsonStr)

            this.hashList = json.hashList
            this.hashForUrlList = json.hashForUrlList
        })

        this.imgIndex = 0
        this.imgStyle.transition = this.defaultTransition
        document.getElementById('preview').focus()
    },
    watch: {
        imgIndex(index) {
            this.initImgPosition()

            const hash = this.hashList[index]
            this.imgSrc = this.hashForUrlList[hash]

            const dom = document.getElementById(hash)

            setTimeout(() => {
                dom &&
                    dom.scrollIntoView({
                        inline: 'center',
                    })
            })

            // const image = new Image()
            // image.onload = () => {
            //     this.handleImg(image)
            //     image.src = ''
            // }
            // image.src = this.imgSrc
        },
    },
    methods: {
        util(e) {
            const {
                altKey,
                button,
                buttons,
                clientX,
                clientY,
                ctrlKey,
                fromElement,
                getModifierState,
                initMouseEvent,
                length,
                name,
                layerX,
                layerY,
                metaKey,
                movementX,
                movementY,
                offsetX,
                offsetY,
                pageX,
                pageY,
                relatedTarget,
                screenX,
                screenY,
                shiftKey,
                toElement,
                x,
                y,
            } = e
            // console.log({
            //     offsetX,
            //     offsetY,
            //     x,
            //     y,
            // })
        },
        showItemInFolder() {
            shell.openPath(this.imgSrc)
        },
        handleImg(image) {
            imgRealW = image.width
            imgRealH = image.height

            let scale
            let imgViewWrap = document.getElementById('img-view-wrap')

            if (image.width > image.height) {
                scale = imgViewWrap.offsetWidth / image.width
                if (scale * image.height > imgViewWrap.offsetHeight) {
                    scale = imgViewWrap.offsetHeight / image.height
                }
            } else {
                scale = imgViewWrap.offsetHeight / image.height
                if (scale * image.width > imgViewWrap.offsetWidth) {
                    scale = imgViewWrap.offsetWidth / image.width
                }
            }
            IMG_SCALE = scale
            this.transform()
            IMG_ADAPT_SCALE = scale
            imgViewWrap = null
        },
        mainImgOnload(e) {
            this.handleImg(e.target)
        },
        initImgPosition() {
            imgMoveStartX = 0
            imgMoveStartY = 0
            translateX = 0
            translateY = 0
            imgRealW = 0
            imgRealH = 0
            imgMoveEnable = false
            offsetStartX = 0
            offsetStartY = 0
            IMG_SCALE = 0
            IMG_ADAPT_SCALE = 0
        },
        transform(step, isWhell) {
            if (isWhell && offsetStartX && offsetStartY) {
                let dx = (step / 2) * (imgRealW - 2 * offsetStartX)
                let dy = (step / 2) * (imgRealH - 2 * offsetStartY)

                translateX += dx
                translateY += dy
            }
            this.imgStyle.transform = `translate(${translateX}px,${translateY}px) scale(${IMG_SCALE})`

            this.$nextTick(() => {
                this.imgScale = Math.round(IMG_SCALE * 100) + '%'
            })
        },
        showOriginScale() {
            if (IMG_SCALE === 1) {
                IMG_SCALE = IMG_ADAPT_SCALE
                // 显示适应比例时，使图片居中
                translateX = 0
                translateY = 0
                this.transform()
            } else {
                IMG_SCALE = 1
                this.transform()
            }
        },
        imgmousedown(e) {
            imgMoveEnable = true

            imgMoveStartX = e.x
            imgMoveStartY = e.y

            this.imgStyle.transition = ''
            // this.util(e)
        },
        imgmousemove(e) {
            offsetStartX = e.offsetX
            offsetStartY = e.offsetY

            // 拖动图片
            if (imgMoveEnable) {
                let dx, dy
                dx = e.x - imgMoveStartX
                dy = e.y - imgMoveStartY
                translateX += dx
                translateY += dy
                this.transform()

                imgMoveStartX = e.x
                imgMoveStartY = e.y
            }
        },
        imgmouseup() {
            this.imgStyle.transition = this.defaultTransition

            imgMoveEnable = false
        },
        mousewheel(e) {
            if (e.wheelDelta > 0) {
                this.keydownup(null, 0.05, true)
            } else {
                this.keydowndown(null, -0.05, true)
            }
        },
        mousewheelCtrl(e) {
            if (e.wheelDelta > 0) {
                this.keydownleft()
            } else {
                this.keydownright()
            }
        },
        clickBar(hash) {
            this.imgSrc = this.hashForUrlList[hash]
            this.imgIndex = this.hashList.indexOf(hash)
        },
        keydownleft() {
            this.imgIndex > 0 && this.imgIndex--
        },
        keydownright() {
            this.imgIndex < this.hashList.length - 1 && this.imgIndex++
        },
        keydownup(e, step = 0.1) {
            step = IMG_SCALE * step

            if (IMG_SCALE < 30) {
                let oldScale = IMG_SCALE
                let newScale = IMG_SCALE + step

                if (oldScale < 1 && newScale > 1) {
                    // 原始比例
                    IMG_SCALE = 1
                    step = 1 - oldScale
                } else if (newScale > 30) {
                    IMG_SCALE = 30
                    step = 30 - oldScale
                } else {
                    IMG_SCALE = newScale
                }

                this.transform(step, true)
            }
        },
        keydowndown(e, step = -0.1) {
            step = IMG_SCALE * step
            if (IMG_SCALE > 0) {
                let oldScale = IMG_SCALE
                let newScale = IMG_SCALE + step

                if (oldScale > 1 && newScale < 1) {
                    // 原始比例
                    IMG_SCALE = 1
                    step = oldScale - 1
                } else if (newScale < 0) {
                    IMG_SCALE = 0.01
                } else {
                    IMG_SCALE = newScale
                }

                this.transform(step, true)
            }
        },
    },
})
</script>
<style lang="scss" scoped>
* {
    margin: 0;
    padding: 0;
}

.preview {
    width: 100vw;
    height: 100vh;
    outline: none;

    .img-view {
        height: calc(100% - 96px);
        width: 100%;
        overflow: scroll;
        background-color: #efefef;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #2b2b2b;
        .wrap {
            width: 98%;
            height: 98%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            img {
                margin-left: 0;
                margin-top: 0;
            }
        }
    }
    .bar-list {
        height: 96px;
        width: 100%;
        position: fixed;
        bottom: 0;
        left: 0;
        display: flex;
        flex-shrink: 0;
        overflow-x: scroll;
        align-items: center;
        background-color: #2b2b2b;
        scroll-behavior: smooth;

        img {
            height: 72px;
            border-radius: 2px;
            margin: 0 2px;
            transition: ease-in 0.09s all;
            box-shadow: 0 0 3px #dfdfdf;
            opacity: 0.6;
            z-index: 0;
        }
        img:hover,
        .current {
            transition: ease-out 0.16s all;
            transform: scale(1.1);
            opacity: 1;
            z-index: 1;
        }
    }
    .img-view::-webkit-scrollbar {
        width: 0;
        height: 0;
    }
    .bar-list::-webkit-scrollbar {
        width: 6px;
        height: 0;
    }
    .bar-list::-webkit-scrollbar-thumb {
        background-color: #b5dd57;
        border-radius: 3px;
    }
    .tools {
        position: fixed;
        z-index: 1;
        bottom: 100px;
        left: 10px;
        font-size: 12px;
        display: flex;

        .tag {
            margin-right: 6px;
            border-radius: 2px;
            border: 1px solid #2b2b2b;
            box-shadow: 0 0 2px black;
            padding: 1px 4px;
            cursor: pointer;
            user-select: none;
            min-width: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
}
</style>
