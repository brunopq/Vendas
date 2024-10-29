import { db } from "~/db"

import { leadStatus, type LeadStatus, type NewLeadStatus } from "~/db/schema"

export type DomainLeadStatus = LeadStatus
export type DomainNewLeadStatus = Omit<NewLeadStatus, "id">

class LeadStatusService {
  async index() {
    const leadStatus = await db.query.leadStatus.findMany()

    return leadStatus
  }

  async getByUser(id: string) {
    const leadStatus = await db.query.leadStatus.findMany({
      where: ({ owner }, { eq }) => eq(owner, id),
    })

    return leadStatus
  }

  async create(newStatus: DomainNewLeadStatus) {
    const [created] = await db.insert(leadStatus).values(newStatus).returning()

    return created
  }
}

export default new LeadStatusService()
