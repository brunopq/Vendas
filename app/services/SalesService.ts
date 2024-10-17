import { endOfMonth, startOfMonth } from "date-fns"
import { between, eq, sql } from "drizzle-orm"

import { db } from "~/db"
import { campaign, newSaleSchema, sale } from "~/db/schema"
import type {
  Sale as DbSale,
  NewSale as DbNewSale,
  CaptationType as DbCaptationType,
} from "~/db/schema"
import CampaignService from "./CampaignService"

export type DomainSale = DbSale
export type NewSale = DbNewSale
export { newSaleSchema }

export type CaptationType = DbCaptationType

function validateDate(month: number, year: number): Date {
  if (month < 1 || month > 12 || year < 2000) {
    throw new Error("date out of range")
  }

  return new Date(year, month - 1)
}

class SalesService {
  async index() {
    return await db.query.sale.findMany({
      with: {
        campaign: { columns: { name: true } },
        seller: { columns: { name: true } },
      },
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
        seller: { columns: { name: true } },
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

  async getCommissionsByMonth(month: number, year: number) {
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
      if (percentage >= 1.1) {
        campaign.comission = Number(campaign.campaign.prize) * 1.1
      }
    }

    return comissions
  }

  async create(newSale: NewSale) {
    const campaign = await CampaignService.getById(newSale.campaign)

    if (!campaign) {
      throw new Error("invalid campaign id")
    }

    const campaignDate = new Date(campaign.month)
    const saleDate = new Date(newSale.date) // TODO: remove defaultNow from sale schema

    if (
      campaignDate.getUTCFullYear() !== saleDate.getUTCFullYear() ||
      campaignDate.getUTCMonth() !== saleDate.getUTCMonth()
    ) {
      throw new Error("campaign is not the same month as the sale")
    }

    const [createdSale] = await db.insert(sale).values(newSale).returning()

    return createdSale
  }
}

export default new SalesService()
