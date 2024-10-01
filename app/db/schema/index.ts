import {
  char,
  date,
  pgTable,
  pgEnum,
  text,
  boolean,
  numeric,
  integer,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { customAlphabet } from "nanoid"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

const idLength = 12
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  idLength,
)

export const sellTypes = pgEnum("sell_type", ["ATIVO", "PASSIVO"])

export const userRoles = pgEnum("user_roles", ["ADMIN", "SELLER"])

export const user = pgTable("users", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  name: text("name").notNull().unique(),
  role: userRoles("user_role").notNull(),
  passwordHash: text("password_hash").notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
  sales: many(sale),
}))

export const area = pgTable("areas", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  name: text("name").notNull(),
  goal: integer("goal").notNull(),
  prize: numeric("prize", { precision: 16, scale: 2 }).notNull(),
})

export const areaRelations = relations(area, ({ many }) => ({
  sales: many(sale),
}))

export const sale = pgTable("sales", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  date: date("date").defaultNow().notNull(),
  seller: char("seller", { length: idLength })
    .references(() => user.id)
    .notNull(),
  sellType: sellTypes("sell_type").notNull(),
  area: char("area", { length: idLength })
    .references(() => area.id)
    .notNull(),
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
  area: one(area, { fields: [sale.area], references: [area.id] }),
}))

//
// types and schemas

export const sellTypeSchema = (params?: z.RawCreateParams) =>
  z.enum(sellTypes.enumValues, params)
export const userRoleSchmea = (params?: z.RawCreateParams) =>
  z.enum(userRoles.enumValues, params)

export const userSchema = createSelectSchema(user)
export const newUserSchema = createInsertSchema(user)

export const saleSchema = createSelectSchema(sale)
export const newSaleSchema = createInsertSchema(sale)

export type User = z.infer<typeof userSchema>
export type NewUser = z.infer<typeof newUserSchema>

export type Sale = z.infer<typeof saleSchema>
export type NewSale = z.infer<typeof newSaleSchema>
