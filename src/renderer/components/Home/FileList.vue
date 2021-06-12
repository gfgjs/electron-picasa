<template>
    <div class="file-list" v-if="list">
        <template v-for="(item, index) in list" >
            <img
                v-if="item.hash"
                v-lazy="thumbnailsPath  + item.hash"
                :key="item.hash"
            />
            <file-list
            :key="index"
                v-if="item.children"
                :list="item.children"
                :thumbnailsPath="thumbnailsPath"
            />
        </template>
    </div>
</template>
<script>
//  +'?t=' +Math.random()
// import FileList from "./FileList";
import defaultImg from "../../assets/default.png";
export default {
    // name: "item-component",
    name: "FileList",
    data() {
        return {
            defaultImg: "this.src='" + defaultImg + "'",
        };
    },
    // components: {
    //     "file-list": FileList,
    // },
    props: ["list", "thumbnailsPath"],
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
        // console.log(JSON.parse(JSON.stringify(this.list)));
    },
};
</script>
<style lang="scss" scoped>
.file-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 0;
    width: 100%;
    img {
        max-width: 96vw;
        width: auto;
        height: 320px;
        object-fit: contain;
        border-radius: 2px;
        margin: 2px;
    }
}
</style>