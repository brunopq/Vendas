import {
  char,
  date,
  pgTable,
  pgEnum,
  text,
  boolean,
  numeric,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { customAlphabet } from "nanoid"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

const idLength = 12
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  idLength,
)

export const sellTypes = pgEnum("sell_type", ["ATIVO", "PASSIVO"])

export const areas = pgEnum("areas", [
  "TRABALHISTA",
  "CÍVEL",
  "PREVIDENCIÁRIO",
  "TRIBUTÁRIO",
  "PENAL",
])

export const user = pgTable("users", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  name: text("name").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
  sales: many(sale),
}))

export const sale = pgTable("sales", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  date: date("date").defaultNow(),
  seller: char("seller", { length: idLength })
    .references(() => user.id)
    .notNull(),
  sellType: sellTypes("sell_type").notNull(),
  area: areas("area").notNull(),
  // TODO: make a separate table, integrate with CRM...
  client: text("client").notNull(),
  adverseParty: text("adverse_party").notNull(),
  isRepurchase: boolean("is_repurchase").notNull(),
  estimatedValue: numeric("estimated_value", {
    precision: 16,
    scale: 2,
  }).notNull(),
  comments: text("comments"),
})

export const saleRelations = relations(sale, ({ one }) => ({
  seller: one(user, { fields: [sale.seller], references: [user.id] }),
}))

//
// types and schemas

export const userSchema = createSelectSchema(user)
export const newUserSchema = createInsertSchema(user)

export const saleSchema = createSelectSchema(sale)
export const newSaleSchema = createInsertSchema(sale)

export type User = z.infer<typeof userSchema>
export type NewUser = z.infer<typeof newUserSchema>

export type Sale = z.infer<typeof saleSchema>
export type NewSale = z.infer<typeof newSaleSchema>
