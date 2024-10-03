import { eq } from "drizzle-orm"

import { db } from "~/db"
import { area, type Area, type NewArea as DbNewArea } from "~/db/schema"

type DomainArea = Area
type NewArea = DbNewArea

class SaleAreaService {
  async index() {
    return await db.query.area.findMany({ orderBy: (sale) => sale.name })
  }

  async create(newArea: NewArea) {
    return await db.insert(area).values(newArea).returning()
  }

  async delete(id: string) {
    await db.delete(area).where(eq(area.id, id))
  }
}

export default new SaleAreaService()
