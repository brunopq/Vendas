import { db } from "~/db"
import { newSaleSchema, sale, type NewSale as DbNewSale } from "~/db/schema"

export type NewSale = DbNewSale
export { newSaleSchema }

class SalesService {
  async index() {
    return await db.query.sale.findMany({
      with: { seller: { columns: { name: true } } },
    })
  }

  async create(newSale: NewSale) {
    const createdSale = await db.insert(sale).values(newSale).returning()

    return createdSale
  }
}

export default new SalesService()
