import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { readFileSync } from "node:fs"
import postgres from "postgres"

import * as schema from "./schema"

const caCertificatePath = process.env.CA_CERTIFICATE_PATH

const connection = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === "production" && {
    rejectUnauthorized: true,
    // biome-ignore lint/style/noNonNullAssertion: should break everything
    ca: readFileSync(caCertificatePath!),
  },
}

const migration = postgres({ ...connection, max: 1 })
const sql = postgres({ ...connection })

export const db = drizzle(sql, { schema })

await migrate(drizzle(migration, { schema }), { migrationsFolder: "./drizzle" })
await migration.end()
