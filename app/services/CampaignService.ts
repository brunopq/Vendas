import { endOfMonth, startOfMonth } from "date-fns"
import { eq } from "drizzle-orm"

import { db } from "~/db"
import {
  campaign,
  type Campaign,
  type NewCampaign as DbNewCampaign,
} from "~/db/schema"
import { validateDate } from "~/lib/verifyMonthAndYear"

export type DomainCampaign = Campaign
export type NewCampaign = DbNewCampaign
export type UpdateCampaign = Partial<Omit<DomainCampaign, "id">>

class CampaignService {
  async index() {
    return await db.query.campaign.findMany({
      orderBy: (campaign, { asc, desc }) => [
        desc(campaign.month),
        asc(campaign.name),
      ],
    })
  }

  async getByMonth(month: number, year: number) {
    const date = validateDate(month, year)

    return await db.query.campaign.findMany({
      where: ({ month }, { between }) =>
        between(
          month,
          startOfMonth(date).toDateString(),
          endOfMonth(date).toDateString(),
        ),
      orderBy: ({ name }, { asc }) => asc(name),
    })
  }

  async getById(id: string) {
    return await db.query.campaign.findFirst({
      where: (campaign, { eq }) => eq(campaign.id, id),
    })
  }

  async create(newCampaign: NewCampaign) {
    if (!newCampaign.month) {
      throw new Error("Month is mandatory")
    }
    const date = new Date(newCampaign.month)

    validateDate(date.getMonth() + 1, date.getFullYear())

    const sameNameAndMonth = await db.query.campaign.findFirst({
      where: ({ name, month }, { eq, and }) =>
        and(eq(name, newCampaign.name), eq(month, newCampaign.month as string)),
    })

    if (sameNameAndMonth) {
      throw new Error("Campaign with same name in this month already")
    }

    return await db.insert(campaign).values(newCampaign).returning()
  }

  async createMany(campaigns: NewCampaign[]) {
    for (const campaign of campaigns) {
      if (!campaign.month) {
        throw new Error("Month is mandatory")
      }
      const date = new Date(campaign.month)

      validateDate(date.getMonth() + 1, date.getFullYear())

      // TODO: promise.all this
      const sameNameAndMonth = await db.query.campaign.findFirst({
        where: ({ name, month }, { eq, and }) =>
          and(eq(name, campaign.name), eq(month, campaign.month as string)),
      })

      if (sameNameAndMonth) {
        throw new Error("Campaign with same name in this month already")
      }
    }

    return await db.insert(campaign).values(campaigns).returning()
  }

  async update(id: string, updateCampaign: UpdateCampaign) {
    const originalCampaign = await this.getById(id)

    if (!originalCampaign) {
      throw new Error("Invalid campaign id")
    }

    const date = updateCampaign.month && new Date(updateCampaign.month)

    if (date) {
      validateDate(date.getMonth() + 1, date.getFullYear())
    }

    const sameNameAndMonth = await db.query.campaign.findFirst({
      where: ({ name, month }, { eq, and }) =>
        and(
          eq(name, updateCampaign.name || originalCampaign.name),
          eq(month, (updateCampaign.month as string) || originalCampaign.month),
        ),
    })

    if (sameNameAndMonth && sameNameAndMonth.id !== id) {
      throw new Error("Campaign with same name in this month already")
    }

    return await db
      .update(campaign)
      .set(updateCampaign)
      .where(eq(campaign.id, id))
      .returning()
  }

  async delete(id: string) {
    await db.delete(campaign).where(eq(campaign.id, id))
  }
}

export default new CampaignService()
