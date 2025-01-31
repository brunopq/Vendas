import { defineConfig } from "vite"
import { reactRouter } from "@react-router/dev/vite"
import { reactRouterHonoServer } from "react-router-hono-server/dev"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    reactRouterHonoServer({ runtime: "node" }),
    reactRouter(),
    tsconfigPaths(),
  ],
})
