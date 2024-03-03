import { defineConfig } from "vite";
import {resolve} from "path"

export default defineConfig({
    build:{
        target: "esnext",
        minify: true,
        lib: {
            entry: resolve(__dirname, "./src/lite-vue.js"),
            name: "LiteVue",
            formats: ["es"]
        }
    }
})