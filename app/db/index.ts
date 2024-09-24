import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import * as schema from "./schema"

const connection = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

const migration = postgres({ ...connection, max: 1 })
const sql = postgres({ ...connection })

export const db = drizzle(sql, { schema })

await migrate(drizzle(migration, { schema }), { migrationsFolder: "./drizzle" })
await migration.end()
