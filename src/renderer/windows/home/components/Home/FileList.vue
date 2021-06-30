<template>
    <div class="file-list" id="file-list" v-if="list">
        <template v-for="(item, index) in renderList">
            <template v-if="typeof item === 'string'">
                <div
                    class="folder-sign"
                    :id="item.split('folder-path:')[0]"
                    :key="item"
                    @click="clickTitle(item, index)"
                >
                    {{ item.split('folder-path:')[1] }}
                </div>
            </template>
            <template v-else>
                <img
                    :src="thumbnailsPath + item"
                    :key="item"
                    :style="imgStyle"
                    @click="clickImg(item, index)"
                />
            </template>
        </template>
        <!-- <div v-html="html"></div> -->
    </div>
</template>
<script>
// import defaultImg from "../../assets/default.png";
import { mapGetters, mapActions } from 'vuex'
export default {
    // name: "item-component",
    name: 'FileList',
    data() {
        return {
            // defaultImg: "this.src='" + defaultImg + "'",
            renderList: [],
            timer: 0,
            stepLength: 600, // 分片渲染片段长度
            imgStyle: '', // 可以动态改变缩略图大小
            html: '',
        }
    },
    watch: {
        scrollTarget(target) {
            if (target) {
                if (target.action === 'scroll-to-img') {
                    // document.getElementById(e.hash).focus();
                    const dom = document.getElementById(target.hash)
                    dom && dom.scrollIntoView()
                }
            }
        },
        list(list) {
            // 一次性渲染
            // this.renderList = list
            this.renderList = []
            this.renderDom()
            //     let html = ''
            //     list.forEach((item) => {
            //         html += `<img src='${
            //             this.thumbnailsPath + item
            //         }' style='box-sizing: border-box;
            // font-size: 0;
            // max-width: 98%;
            // width: auto;
            // height: auto;
            // object-fit: contain;
            // border-radius: 2px;
            // margin: 2px;'/>`
            //     })
            //     document.getElementById('file-list').innerHTML = html
        },
        // 拖动大小滑条，页面实时缩放，图片多了会卡
        // 'userConfig.thumbSize'(size) {
        //     this.imgStyle =
        //         'height:' + size * this.userConfig.thumbSizeBase + 'px'
        // },
        userConfig(config) {
            this.imgStyle =
                'height:' + config.thumbSize * config.thumbSizeBase + 'px'

            // document.querySelectorAll('.file-list img').style = this.imgStyle
        },
    },
    props: ['list', 'thumbnailsPath'],
    mounted() {
        this.imgStyle =
            'height:' +
            this.userConfig.thumbSize * this.userConfig.thumbSizeBase +
            'px'

        // document.querySelectorAll('.file-list img').style = this.imgStyle
    },
    methods: {
        ...mapActions(['SCROLL_TARGET']),
        clickImg(item, index) {
            // 找到所在目录，并展开在左侧
            let hash

            // 点击了标题栏
            if (typeof item === 'string') {
                hash = item.split('folder-path:')[0]
                this.SCROLL_TARGET({
                    hash,
                    action: 'open-tree',
                })
            } else {
                // 点击了图片，从点击处向前查找直到找到文件夹
                for (let i = index; i >= 0; i--) {
                    const result = this.renderList[i]
                    if (typeof result === 'string') {
                        hash = result.split('folder-path:')[0]
                        this.SCROLL_TARGET({
                            hash,
                            imgHash: item,
                            action: 'open-tree',
                        })
                        break
                    }
                }
            }
        },
        clickTitle(item, index) {
            this.clickImg(item, index)
        },
        renderDom() {
            cancelAnimationFrame(this.timer)
            this.timer = this.raf()
            let startIndex = 0,
                length = this.list.length,
                stepLength = this.stepLength
            this.raf(startIndex, length, stepLength)
        },
        raf(startIndex, length, stepLength) {
            if (startIndex < length) {
                this.renderList = this.renderList.concat(
                    this.list.slice(startIndex, startIndex + stepLength)
                )
                startIndex += stepLength
                return requestAnimationFrame(() => {
                    this.raf(startIndex, length, stepLength)
                })
            } else {
            }
        },
    },
    computed: {
        ...mapGetters(['scrollTarget', 'userConfig']),
    },
}
</script>
<style lang="scss" scoped>
.file-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    scroll-behavior: smooth;
    box-sizing: border-box;
    background-color: #fefefe;
    transform: translateZ(0);

    .folder-sign {
        width: 100%;
        height: 24px;
        margin: 10px;
        border-radius: 2px;
        background-color: #ffffff;
        box-shadow: 0 0 2px 0 #efefef;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #444444;
    }
    img,
    .img {
        box-sizing: border-box;
        font-size: 0;
        max-width: 98%;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 2px;
        margin: 2px;
        // transform: translateZ(0);
        // transform: translate3d(0, 0, 0);
    }
}
.file-list::-webkit-scrollbar {
    width: 6px;
}
.file-list::-webkit-scrollbar-thumb {
    background-color: #bde05a;
    border-radius: 3px;
}
</style>
