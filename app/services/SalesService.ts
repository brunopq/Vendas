import { endOfMonth, isSameMonth, startOfMonth } from "date-fns"
import { and, between, eq, sql, sum } from "drizzle-orm"

import { db } from "~/db"
import { campaign, newSaleSchema, sale } from "~/db/schema"
import type {
  Sale as DbSale,
  NewSale as DbNewSale,
  CaptationType as DbCaptationType,
} from "~/db/schema"
import CampaignService from "./CampaignService"
import { utc } from "@date-fns/utc"
import { validateDate } from "~/lib/verifyMonthAndYear"
import { s } from "node_modules/vite/dist/node/types.d-aGj9QkWt"

export type DomainSale = DbSale
export type NewSale = DbNewSale
export { newSaleSchema }

export type CaptationType = DbCaptationType

class SalesService {
  async index() {
    return await db.query.sale.findMany({
      with: {
        campaign: { columns: { name: true } },
        seller: { columns: { name: true } },
      },
    })
  }

  async getById(id: string) {
    return await db.query.sale.findFirst({
      where: (sale, { eq }) => eq(sale.id, id),
    })
  }

  async getBySeller(sellerId: string) {
    await db.query.sale.findMany({
      where: (sales, { eq }) => eq(sales.seller, sellerId),
    })
  }

  async getByMonth(month: number, year: number) {
    const date = validateDate(month, year)

    return await db.query.sale.findMany({
      where: (sales, { between }) =>
        between(
          sales.date,
          startOfMonth(date).toDateString(),
          endOfMonth(date).toDateString(),
        ),
      with: {
        campaign: { columns: { name: true } },
        seller: { columns: { name: true, fullName: true } },
      },
    })
  }

  async getByMonthAndUser(month: number, year: number, userId: string) {
    const date = validateDate(month, year)

    return await db.query.sale.findMany({
      where: (sales, { between, and, eq }) =>
        and(
          eq(sales.seller, userId),
          between(
            sales.date,
            startOfMonth(date).toDateString(),
            endOfMonth(date).toDateString(),
          ),
        ),
      with: {
        campaign: { columns: { name: true } },
        seller: { columns: { name: true } },
      },
    })
  }

  async getNewClientsByMonth(month: number, year: number) {
    const date = validateDate(month, year)

    return await db.query.sale.findMany({
      where: (sales, { between, and, eq }) =>
        and(
          eq(sales.isRepurchase, false),
          between(
            sales.date,
            startOfMonth(date).toDateString(),
            endOfMonth(date).toDateString(),
          ),
        ),
      with: {
        campaign: { columns: { name: true } },
        seller: { columns: { name: true } },
      },
    })
  }

  /**
   * Get the collective commissions for each campaign in a given month
   *
   * @param month
   * @param year
   * @returns
   */
  async getCommissionsByMonth(month: number, year: number, userId = "") {
    const date = validateDate(month, year)

    const comissions = await db
      .select({
        campaign: campaign,
        sellCount: sql<number>`cast(count(${sale.id}) as int)`,
        comission: sql<number>`cast(0 as int)`,
      })
      .from(campaign)
      .leftJoin(sale, eq(campaign.id, sale.campaign))
      .where(
        between(
          sale.date,
          startOfMonth(date).toDateString(),
          endOfMonth(date).toDateString(),
        ),
      )
      .groupBy(campaign.id)
      .orderBy(
        sql`cast(count(${sale.id}) as double precision) / ${campaign.goal} desc`,
      )

    for (const campaign of comissions) {
      const percentage = campaign.sellCount / campaign.campaign.goal

      if (percentage >= 0.5) {
        campaign.comission = Number(campaign.campaign.prize) * 0.5
      }
      if (percentage >= 0.75) {
        campaign.comission = Number(campaign.campaign.prize) * 0.75
      }
      if (percentage >= 1) {
        campaign.comission = Number(campaign.campaign.prize) * 1
      }
    }

    return comissions
  }

  async getUserSales(month: number, year: number, userId: string) {
    const date = validateDate(month, year)

    const campaigns = await db
      .select({
        campaign: campaign,
        sellCount: sql<number>`cast(count(${sale.id}) as int)`,
      })
      .from(campaign)
      .leftJoin(sale, eq(campaign.id, sale.campaign))
      .where(
        and(
          eq(sale.seller, userId),
          between(
            sale.date,
            startOfMonth(date).toDateString(),
            endOfMonth(date).toDateString(),
          ),
        ),
      )
      .groupBy(campaign.id)
    return campaigns
  }

  async getTotalEstimatedValueByMonth(month: number, year: number) {
    const date = validateDate(month, year)

    const [{ totalValue }] = await db
      .select({
        totalValue: sum(sale.estimatedValue),
      })
      .from(sale)
      .where(
        and(
          between(
            sale.date,
            startOfMonth(date).toDateString(),
            endOfMonth(date).toDateString(),
          ),
        ),
      )

    return totalValue
  }

  async create(newSale: NewSale) {
    const campaign = await CampaignService.getById(newSale.campaign)

    if (!campaign) {
      throw new Error("invalid campaign id")
    }

    const campaignDate = new Date(campaign.month)
    const saleDate = new Date(newSale.date)

    if (!isSameMonth(campaignDate, saleDate, { in: utc })) {
      throw new Error("campaign is not the same month as the sale")
    }

    const [createdSale] = await db.insert(sale).values(newSale).returning()

    return createdSale
  }

  async update(id: string, data: Partial<NewSale>) {
    const [updated] = await db
      .update(sale)
      .set(data)
      .where(eq(sale.id, id))
      .returning()
    return updated
  }

  async delete(id: string) {
    return await db.delete(sale).where(eq(sale.id, id))
  }
}

export default new SalesService()
