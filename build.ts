import { build } from "vite"
import viteConfig from "vite.config"

// cleanup
await Bun.$`rm -rf ./dist`
await Bun.$`rm -rf ./build`

console.log("Building application with Vite")

// build client and server bundles
await build({ ...viteConfig, build: { ...viteConfig.build, ssr: false } })
await build({ ...viteConfig, build: { ...viteConfig.build, ssr: true } })

console.log("Bundling application with Bun")

await Bun.build({
  entrypoints: ["./build/server/index.js"],
  outdir: "./dist",
  target: "node",
})

await Bun.$`cp -r --parents ./build/client/ ./dist`
await Bun.$`cp -r --parents ./drizzle ./dist`
await Bun.$`cp sa-east-1-bundle.pem ./dist`
await Bun.$`rm -rf ./build`

console.log("Application built!")
