import { defineConfig } from "vite"
import { reactRouter } from "@react-router/dev/vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [reactRouter(), tsconfigPaths()],
})
