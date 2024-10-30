import { eq } from "drizzle-orm"
import { db } from "~/db"

import { lead, type Lead, type NewLead } from "~/db/schema"

export type DomainLead = Lead
export type DomainNewLead = Omit<NewLead, "id" | "phoneNumbers"> & {
  phoneNumbers: string[]
}

class LeadService {
  async index() {
    const leads = await db.query.lead.findMany({
      with: { asignee: true, status: true },
    })

    return leads
  }

  async getByUser(id: string) {
    const leads = await db.query.lead.findMany({
      with: { asignee: true, status: true },
      where: ({ asignee }, { eq }) => eq(asignee, id),
    })

    return leads
  }

  async create(newLead: DomainNewLead) {
    const [created] = await db.insert(lead).values(newLead).returning()

    return created
  }

  async assign(leadId: string, asignee: string) {
    const [updated] = await db
      .update(lead)
      .set({ asignee })
      .where(eq(lead.id, leadId))
      .returning()

    return updated
  }
}

export default new LeadService()
