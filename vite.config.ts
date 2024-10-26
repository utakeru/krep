import { crx, defineManifest } from "@crxjs/vite-plugin";

import { defineConfig } from "vite";
const manifest = defineManifest({
    manifest_version: 3,
    name: "krep",
    version: "1.0.0",
    permissions: [],
    icons: {
        "128": "krep-icon128.png"
    },
    content_scripts: [
        {
            "all_frames": true,
            matches: [
                "https://*.cybozu.com/k/*",
                "https://*.cybozu-dev.com/k/*",
                "https://*.kintone.com/k/*",
                "https://*.kintone-dev.com/k/*"
            ],
            js: [ "src/js/contentScript.ts" ],
        }
    ]
});
  
export default defineConfig({
    plugins: [crx({ manifest })],
    build: {
        rollupOptions: {
            input: ["src/js/contentScript.ts"],
            output: {
            chunkFileNames: "[name].[hash].js",
            assetFileNames: "[name].[hash].[ext]",
            entryFileNames: "[name].js",
            dir: "dist",
            }
        },
    },
});