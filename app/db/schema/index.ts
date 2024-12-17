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

export const captationTypes = pgEnum("captation_type", ["ATIVO", "PASSIVO"])
export const saleArea = pgEnum("sale_area", [
  "Cível estadual",
  "Cível federal",
  "Penal",
  "Previdenciário",
  "Trabalhista",
  "Tributário",
])

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

export const campaign = pgTable("campaigns", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  name: text("name").notNull(),
  goal: integer("goal").notNull(),
  prize: numeric("prize", { precision: 16, scale: 2 }).notNull(),
  month: date("month").defaultNow().notNull(),
})

export const campaignRelations = relations(campaign, ({ many }) => ({
  sales: many(sale),
}))

export const sale = pgTable("sales", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  date: date("date").notNull(),
  seller: char("seller", { length: idLength })
    .references(() => user.id)
    .notNull(),
  captationType: captationTypes("captation_type").notNull(),
  campaign: char("campaign", { length: idLength })
    .references(() => campaign.id)
    .notNull(),
  saleArea: saleArea("sale_area").notNull(),
  // TODO: make a separate table, integrate with CRM...
  client: text("client").notNull(),
  adverseParty: text("adverse_party").notNull(),
  isRepurchase: boolean("is_repurchase").notNull(),
  estimatedValue: numeric("estimated_value", {
    precision: 16,
    scale: 2,
  }),
  comments: text("comments"),
  indication: text("indication"),
})

export const saleRelations = relations(sale, ({ one }) => ({
  seller: one(user, { fields: [sale.seller], references: [user.id] }),
  campaign: one(campaign, {
    fields: [sale.campaign],
    references: [campaign.id],
  }),
}))

//
// types and schemas

export const captationTypeSchema = (params?: z.RawCreateParams) =>
  z.enum(captationTypes.enumValues, params)
export const saleAreaSchema = (params?: z.RawCreateParams) =>
  z.enum(saleArea.enumValues, params)
export const userRoleSchmea = (params?: z.RawCreateParams) =>
  z.enum(userRoles.enumValues, params)

export const userSchema = createSelectSchema(user)
export const newUserSchema = createInsertSchema(user)

export const campaignSchema = createSelectSchema(campaign)
export const newCampaignSchema = createInsertSchema(campaign)

export const saleSchema = createSelectSchema(sale)
export const newSaleSchema = createInsertSchema(sale)

export type CaptationType = z.infer<ReturnType<typeof captationTypeSchema>>
export type SaleArea = z.infer<ReturnType<typeof saleAreaSchema>>
export type UserRole = z.infer<ReturnType<typeof userRoleSchmea>>

export type User = z.infer<typeof userSchema>
export type NewUser = z.infer<typeof newUserSchema>

export type Sale = z.infer<typeof saleSchema>
export type NewSale = z.infer<typeof newSaleSchema>

export type Campaign = z.infer<typeof campaignSchema>
export type NewCampaign = z.infer<typeof newCampaignSchema>
