import { eq } from "drizzle-orm"
import { db } from "~/db"

import { lead, type Lead, type NewLead } from "~/db/schema"

import type { DomainUser } from "./AuthService"
import type { DomainLeadStatus } from "./LeadStatusService"

export type DomainLead = Omit<
  Lead,
  "phoneNumbers" | "status" | "extraFields" | "asignee"
> & {
  phoneNumbers: string[]
  asignee: DomainUser | null
  status: DomainLeadStatus | null
  extraFields?: unknown
}
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

  async createMany(newLeads: DomainNewLead[]) {
    const created = await db.insert(lead).values(newLeads).returning()

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
