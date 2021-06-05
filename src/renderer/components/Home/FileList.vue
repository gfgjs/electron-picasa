<template>
    <div class="file-list" v-if="list">
        <div class="item" v-for="(item, index) in list" :key="index">
            <!-- <p style="font-size:20px;">{{ item.name }}</p> -->
            <!-- <div class="img-box" v-if="item.pathHash"> -->
            <img
                v-if="item.pathHash"
                v-lazy="thumbnailsPath + '/' + item.pathHash"
                :onerror="defaultImg"
                :key="item.pathHash"
            />
            <!-- </div> -->
            <file-list
                v-if="item.children"
                :list="item.children"
                :thumbnailsPath="thumbnailsPath"
            />
        </div>
    </div>
</template>
<script>

//  +'?t=' +Math.random()
// import FileList from "./FileList";
import defaultImg from "../../assets/default.png";
export default {
    // name: "item-component",
    name:'FileList',
    data() {
        return {
            defaultImg: "this.src='" + defaultImg + "'",
        };
    },
    // components: {
    //     "file-list": FileList,
    // },
    props:['list','thumbnailsPath'],
    // props: {
    //     list: [Object, Array],
    //     thumbnailsPath: [String],
    //     // index: {
    //     //     // index of current item
    //     //     type: Number,
    //     // },
    //     // source: {
    //     //     // here is: {uid: 'unique_1', text: 'abc'}
    //     //     type: Object,
    //     //     default() {
    //     //         return {};
    //     //     },
    //     // },
    // },
    mounted() {
        // console.log(this.list);
    },
};
</script>
<style lang="scss">
.file-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 0;
    // .img-box,
    img {
        max-width: 96vw;
        width: auto;
        height: 320px;
        object-fit: contain;
        float: left;
    }
}

</style>