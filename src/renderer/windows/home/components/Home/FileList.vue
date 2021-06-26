<template>
    <div class="file-list" v-if="list">
        <template v-for="(item, index) in renderList">
            <!-- typeof item ==='string'为文件夹分隔符。只有当下一个元素是图片时才渲染这个文件夹分割元素 -->
            <!-- <div
                class="folder-sign"
                v-if="typeof item === 'string'&&typeof list[index+1]==='number'"
                :key="item + index"
            ></div> -->

            <template v-if="item > 0 && item < 1000001">
                <div
                    class="folder-sign"
                    :id="item"
                    :key="item"
                    @click="clickTitle(item, index)"
                >
                    <!-- 添加属性 :tabindex="item" 可使用 .focus() -->
                </div>
            </template>
            <template v-else>
                <img
                    v-lazy="thumbnailsPath + item"
                    :key="item"
                    :style="imgStyle"
                    @click="clickImg(item, index)"
                />
            </template>
        </template>
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
            stepLength: 100, // 分片渲染片段长度
            imgStyle: '', // 可以动态改变缩略图大小
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
            // 分片渲染，然鹅没啥用，倒是不会卡住几秒，但加载的时间太长了
            // this.renderList = []
            // this.renderDom()
        },
        // 拖动大小滑条，页面实时缩放，图片多了会卡
        // 'userConfig.thumbSize'(size) {
        //     this.imgStyle =
        //         'height:' + size * this.userConfig.thumbSizeBase + 'px'
        // },
        userConfig(config) {
            this.imgStyle =
                'height:' + config.thumbSize * config.thumbSizeBase + 'px'
        },
    },
    props: ['list', 'thumbnailsPath'],
    mounted() {
        this.imgStyle =
            'height:' +
            this.userConfig.thumbSize * this.userConfig.thumbSizeBase +
            'px'
    },
    methods: {
        ...mapActions(['SCROLL_TARGET']),
        clickImg(item, index) {
            // 找到所在目录，并展开在左侧
            for (let i = index; i >= 0; i--) {
                const hash = this.renderList[i]
                if (hash > 0 && hash < 1000001) {
                    this.SCROLL_TARGET({ hash, action: 'open-tree' })
                    break
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
* {
    font-size: 0;
}
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

    .folder-sign {
        width: 100%;
        height: 22px;
        margin: 10px;
        border-radius: 2px;
        background-color: #efefef;
    }
    img {
        box-sizing: border-box;
        font-size: 0;
        max-width: 98%;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 2px;
        margin: 2px;
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
