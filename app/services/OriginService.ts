import { eq } from "drizzle-orm"
import { db } from "~/db"
import { type Origin, origin } from "~/db/schema"

export type DomainOrigin = Origin
type NewOrigin = Omit<DomainOrigin, "id">

class OriginService {
  async getOrigins(): Promise<Origin[]> {
    return await db.query.origin.findMany({
      orderBy: (origin, { asc }) => asc(origin.name),
    })
  }

  async getOriginById(id: string): Promise<Origin | undefined> {
    return await db.query.origin.findFirst({
      where: (origin, { eq }) => eq(origin.id, id),
    })
  }

  async createOrigin(newOrigin: NewOrigin): Promise<Origin> {
    const [createdOrigin] = await db
      .insert(origin)
      .values(newOrigin)
      .returning()

    return createdOrigin
  }

  async updateOrigin(
    id: string,
    newOrigin: Partial<NewOrigin>,
  ): Promise<Origin> {
    const [updatedOrigin] = await db
      .update(origin)
      .set(newOrigin)
      .where(eq(origin.id, id))
      .returning()
    return updatedOrigin
  }

  async deleteOrigin(id: string) {
    await db.delete(origin).where(eq(origin.id, id))
  }
}

export default new OriginService()
