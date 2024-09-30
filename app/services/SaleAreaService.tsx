import { db } from "~/db"

class SaleAreaService {
  async index() {
    return await db.query.area.findMany({ orderBy: (sale) => sale.name })
  }
}

export default new SaleAreaService()
