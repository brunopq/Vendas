import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { readFileSync } from "node:fs"
import postgres from "postgres"

import { env } from "node:process"

import * as schema from "./schema"

const caCertificatePath = env.CA_CERTIFICATE_PATH

const connection = {
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.NODE_ENV === "production" && {
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
