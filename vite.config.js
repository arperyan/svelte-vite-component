import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";
import typescript from "@rollup/plugin-typescript";

const __dirname = resolve();

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    if (command === "serve") {
        return {
            plugins: [svelte()],
        };
    } else {
        return {
            build: {
                lib: {
                    entry: resolve(__dirname, "src/lib/components.module.ts"),
                    name: "SvelteComp",
                    fileName: (format) => `index.${format}.js`,
                },
            },
            plugins: [typescript({ tsconfig: "./tsconfig.json" }), svelte({ emitCss: false })],
        };
    }
});
