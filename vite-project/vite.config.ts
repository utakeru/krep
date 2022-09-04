import { crx, defineManifest } from "@crxjs/vite-plugin";

import { defineConfig } from "vite";
const manifest = defineManifest({
    manifest_version: 3,
    name: "krep",
    version: "1.0.0",
    permissions: [],
    content_scripts: [
        {
            "all_frames": true,
            matches: [
                "https://*.cybozu.com/k/*",
                "https://*.cybozu-dev.com/k/*",
                "https://*.kintone.com/k/*",
                "https://*.kintone-dev.com/k/*"
            ],
            js: [ "dist/contentScript.js" ],
            run_at: "document_end"
        }
    ]
});
  
export default defineConfig({
    plugins: [crx({ manifest })],
    build: {
        rollupOptions: {
            input: ["src/js/contentScript.js"],
            output: {
            chunkFileNames: "[name].[hash].js",
            assetFileNames: "[name].[hash].[ext]",
            entryFileNames: "[name].js",
            dir: "dist",
            }
        },
    },
});