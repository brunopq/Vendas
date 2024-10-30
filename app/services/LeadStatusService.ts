import { db } from "~/db"

import { leadStatus, type LeadStatus, type NewLeadStatus } from "~/db/schema"
import AuthService from "./AuthService"

export type DomainLeadStatus = LeadStatus
export type DomainNewLeadStatus = Omit<NewLeadStatus, "id">

class LeadStatusService {
  async index() {
    const leadStatus = await db.query.leadStatus.findMany()

    return leadStatus
  }

  async getDefaultStatus() {
    let defaultStatus = await db.query.leadStatus.findFirst({
      where: (table, { eq }) => eq(table.isDefault, true),
    })

    if (defaultStatus) {
      return defaultStatus
    }

    const admin = await AuthService.getByName("admin")
    if (!admin) {
      throw new Error("No admin user")
    }

    ;[defaultStatus] = await db
      .insert(leadStatus)
      .values({
        isDefault: true,
        active: true,
        name: "Não iniciado",
        owner: admin.id,
      })
      .returning()

    return defaultStatus
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
