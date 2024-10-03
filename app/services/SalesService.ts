import { endOfMonth, startOfMonth } from "date-fns"
import { between, eq, sql } from "drizzle-orm"

import { db } from "~/db"
import { area, newSaleSchema, sale } from "~/db/schema"
import type { Sale as DbSale, NewSale as DbNewSale } from "~/db/schema"

export type DomainSale = DbSale
export type NewSale = DbNewSale
export { newSaleSchema }

class SalesService {
  private validateDate(month: number, year: number): Date {
    if (month < 1 || month > 12 || year < 2000) {
      throw new Error("date out of range")
    }

    return new Date(year, month - 1)
  }

  async index() {
    return await db.query.sale.findMany({
      with: {
        area: { columns: { name: true } },
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
    const date = this.validateDate(month, year)

    return await db.query.sale.findMany({
      where: (sales, { between }) =>
        between(
          sales.date,
          startOfMonth(date).toDateString(),
          endOfMonth(date).toDateString(),
        ),
      with: {
        area: { columns: { name: true } },
        seller: { columns: { name: true } },
      },
    })
  }

  async getByMonthAndUser(month: number, year: number, userId: string) {
    const date = this.validateDate(month, year)

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
        area: { columns: { name: true } },
        seller: { columns: { name: true } },
      },
    })
  }

  async getNewClientsByMonth(month: number, year: number) {
    const date = this.validateDate(month, year)

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
        area: { columns: { name: true } },
        seller: { columns: { name: true } },
      },
    })
  }

  async getCommissionsByMonth(month: number, year: number) {
    const date = this.validateDate(month, year)

    const a = await db
      .select({
        area,
        sellCount: sql<number>`cast(count(${sale.id}) as int)`,
        comission: sql<number>`cast(0 as int)`,
      })
      .from(area)
      .leftJoin(sale, eq(area.id, sale.area))
      .where(
        between(
          sale.date,
          startOfMonth(date).toDateString(),
          endOfMonth(date).toDateString(),
        ),
      )
      .groupBy(area.id)

    for (const area of a) {
      const percentage = area.sellCount / area.area.goal

      if (percentage >= 0.5) {
        area.comission = Number(area.area.prize) * 0.5
      }
      if (percentage >= 0.75) {
        area.comission = Number(area.area.prize) * 0.75
      }
      if (percentage >= 1) {
        area.comission = Number(area.area.prize) * 1
      }
      if (percentage >= 1.1) {
        area.comission = Number(area.area.prize) * 1.1
      }
    }

    return a
  }

  async create(newSale: NewSale) {
    const [createdSale] = await db.insert(sale).values(newSale).returning()

    return createdSale
  }
}

export default new SalesService()
