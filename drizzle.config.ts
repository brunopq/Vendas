import { defineConfig } from "drizzle-kit"

import { env } from "~/lib/envConfig"

export default defineConfig({
  schema: "./app/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT,
  },
})
