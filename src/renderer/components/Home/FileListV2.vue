<template>
    <div class="file-list" v-if="list">
        <template v-for="item in renderList">
            <!-- typeof item ==='string'为文件夹分隔符。只有当下一个元素是图片时才渲染这个文件夹分割元素 -->
            <!-- <div
                class="folder-sign"
                v-if="typeof item === 'string'&&typeof list[index+1]==='number'"
                :key="item + index"
            ></div> -->
            <div
                class="folder-sign"
                v-if="item > 0 && item < 1000001"
                :id="item"
                :key="item"
            >
                <!-- :tabindex="item" 可使用 .focus() -->
            </div>
            <img v-else v-lazy="thumbnailsPath + item" :key="item" />
        </template>
    </div>
</template>
<script>
// import defaultImg from "../../assets/default.png";
import { mapGetters } from "vuex";
export default {
    // name: "item-component",
    name: "FileList",
    data() {
        return {
            // defaultImg: "this.src='" + defaultImg + "'",
            renderList: [],
            timer: 0,
            stepLength: 50,
        };
    },
    watch: {
        scrollTarget(e) {
            if (e) {
                // document.getElementById(e.hash).focus();
                const dom = document.getElementById(e.hash)
                dom&&dom.scrollIntoView();
            }
        },
        list(e) {
            this.renderList = [];
            this.renderList = this.list
            // this.renderDom()
        },
    },
    props: ["list", "thumbnailsPath"],
    mounted() {
        // console.log(this.scrollTarget);
        // console.log(JSON.parse(JSON.stringify(this.list)));
    },
    methods: {
        renderDom() {
            cancelAnimationFrame(this.timer);
            this.timer = this.raf();
            let startIndex=0,length=this.list.length,stepLength=this.stepLength
            this.raf(startIndex,length,stepLength);
        },
        raf(startIndex,length,stepLength) {
            if (startIndex < length) {
                this.renderList = this.renderList.concat(
                    this.list.slice(
                        startIndex,
                        startIndex + stepLength
                    )
                );
                startIndex += stepLength;
                return requestAnimationFrame(()=>{this.raf(startIndex,length,stepLength)});
            } else {
            }
        },
    },
    computed: {
        ...mapGetters(["scrollTarget"]),
    },
};
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
    .folder-sign {
        width: 100%;
        height: 2px;
        background-color: #efefef;
    }
    img {
        font-size: 0;
        max-width: 96vw;
        width: auto;
        height: 320px;
        object-fit: contain;
        border-radius: 2px;
        margin: 2px;
    }
}
.file-list::-webkit-scrollbar {
    width: 6px;
}
.file-list::-webkit-scrollbar-thumb {
    background-color: #efefef;
    border-radius: 3px;
}
</style>