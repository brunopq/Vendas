import { endOfMonth, startOfMonth } from "date-fns"
import { eq } from "drizzle-orm"

import { db } from "~/db"
import {
  campaign,
  type Campaign,
  type NewCampaign as DbNewCampaign,
} from "~/db/schema"

type DomainCampaign = Campaign
type NewCampaign = DbNewCampaign

function validateDate(month: number, year: number): Date {
  if (month < 1 || month > 12 || year < 2000) {
    throw new Error("date out of range")
  }

  return new Date(year, month - 1)
}

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

  async delete(id: string) {
    await db.delete(campaign).where(eq(campaign.id, id))
  }
}

export default new CampaignService()
