import { eq } from "drizzle-orm"

import { db } from "~/db"
import {
  campaign,
  type Campaign,
  type NewCampaign as DbNewCampaign,
} from "~/db/schema"

type DomainCampaign = Campaign
type NewCampaign = DbNewCampaign

class CampaignService {
  async index() {
    return await db.query.campaign.findMany({
      orderBy: (campaign) => campaign.name,
    })
  }

  async create(newCampaign: NewCampaign) {
    return await db.insert(campaign).values(newCampaign).returning()
  }

  async delete(id: string) {
    await db.delete(campaign).where(eq(campaign.id, id))
  }
}

export default new CampaignService()
