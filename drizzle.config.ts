import { defineConfig } from "drizzle-kit"

const connection = {
  // assertion is fine because it will be checked
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
}

Object.entries(connection).map(([k, v]) => {
  if (!v) throw new Error(`${k} is not defined in .env file.`)
})

export default defineConfig({
  schema: "./app/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    ...connection,
  },
})
