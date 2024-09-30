import { endOfMonth, startOfMonth } from "date-fns"

import { db } from "~/db"
import { newSaleSchema, sale } from "~/db/schema"
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
      with: { seller: { columns: { name: true } } },
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
        seller: { columns: { name: true } },
      },
    })
  }

  async create(newSale: NewSale) {
    const [createdSale] = await db.insert(sale).values(newSale).returning()

    return createdSale
  }
}

export default new SalesService()
