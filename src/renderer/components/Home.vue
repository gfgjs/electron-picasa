<template>
    <div class="home">
        
        <!-- <h2 style="font-size: 100px" @click="selectDir">欢迎使用</h2> -->
        <div class="menus">
            <menus @updateFiles="updateFiles" />
        </div>
        <div class="file">
            <file-list :list="FilesRender" :thumbnailsPath="thumbnailsPath" />
        </div>
    </div>
</template>
<script>
import FileListEm from "@/components/Home/FileList.vue";
import Menus from "@/components/Home/Menus.vue";
import { ipcRenderer } from "electron";

export default {
    name: "Home",
    components: {
        "file-list": FileListEm,
        menus: Menus,
    },
    data() {
        return {
            FilesRender: {},
            thumbnailsPath: "",
            renderList: [],
        };
    },
    computed: {},
    watch: {
        // FilesRender: {
            // handler(current, old) {
                // console.log(Date.now());
                // console.log(current.children);
                // console.log(old);
            // },
            // deep: true,
        // },
    },
    async mounted() {
        this.thumbnailsPath =
            (await ipcRenderer.invoke("getUserDataPath")) + "/thumbnails/";
            // this.thumbnailsPath = thumbnailsPath.replace(/\\/g,'/')
    },
    methods: {
        updateFiles({ folder, cmd }) {
            if (cmd === "delete") {
                console.log(this.FilesRender);
                this.$delete(this.FilesRender, folder.path);
            } else {
                // this.renderList.push(folder);
                this.renderFiles(folder);
            }
        },
        renderFiles(folder) {
            // console.log(JSON.parse(JSON.stringify(folder)));

            // folder.path && this.$set(this.FilesRender, folder.path, folder);
            // console.log(JSON.parse(JSON.stringify(this.FilesRender)));

            // return

            const list = [];
            for (let i in folder.children) {
                // console.log(JSON.parse(JSON.stringify(folder.children[i])));
                list.push(folder.children[i]);
            }

            // console.log(JSON.parse(JSON.stringify(list)));

            let { name, type, path } = folder;
            // this.FilesRender[path] = { children: {}, name, type, path };
            this.$set(this.FilesRender, path, {
                children: {},
                name,
                type,
                path,
            });

            const total = list.length;
            total &&
                this.lazyRender({
                    list,
                    index: 0,
                    total,
                    parentPath: path,
                    timer: null,
                });
        },
        lazyRender(params) {
            let { list, index, total, timer, parentPath } = params;
            // list or object循环 或者 list递归？效果一样吗？
            // let folder = list[index];

            // this.$set(this.FilesRender[parentPath].children, folder.name, folder);

            // params.index++;
            // if (params.index < total) {
            //     timer = requestAnimationFrame(() => this.lazyRender(params));
            // } else {
            //     cancelAnimationFrame(timer);
            // }

            let ind = 0;
            let time = setInterval(() => {
                let folder = list[ind];
                    console.log(ind);

                if (ind < total) {
                    this.$set(
                        this.FilesRender[parentPath].children,
                        folder.name,
                        folder
                    );
                    ind++;
                } else {
                    clearInterval(time);
                }
            }, );
        },
    },
};
</script>
<style lang="scss" scoped>
.home {
    position: fixed;
    width: 100vw;
    height: 100vh;
    display: flex;
    .menus {
        width: 240px;
        height: 100%;
        border-right: solid 1px #cecece;
    }
    .file {
        width: calc(100% - 200px);
        height: 100%;
        overflow-y: scroll;
    }
}
</style>