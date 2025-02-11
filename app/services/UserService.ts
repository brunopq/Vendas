import { and, between, desc, eq, not, sql } from "drizzle-orm"
import { endOfMonth, startOfMonth } from "date-fns"

import { sale, user } from "~/db/schema"
import { db } from "~/db"

import { validateDate } from "~/lib/verifyMonthAndYear"

import CalculateUserComissionUseCase from "./useCases/CalculateUserComissionUseCase"
import type { DomainUser } from "./AuthService"

class UserService {
  async index() {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        fullName: user.fullName,
        role: user.role,
        totalSales: sql<number>`cast(count(${sale.id}) as int)`,
      })
      .from(user)
      .leftJoin(sale, eq(user.id, sale.seller))
      .groupBy(user.id)

    return users
  }

  async listByMonth(
    month: number,
    year: number,
    options = { onlyActive: true },
  ) {
    const date = validateDate(month, year)

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        fullName: user.fullName,
        role: user.role,
        accountActive: user.accountActive,
        totalSales: sql<number>`cast(count(${sale.id}) as int)`,
      })
      .from(user)
      .where(options.onlyActive ? eq(user.accountActive, true) : undefined)
      .leftJoin(
        sale,
        and(
          eq(user.id, sale.seller),
          between(
            sale.date,
            startOfMonth(date).toDateString(),
            endOfMonth(date).toDateString(),
          ),
        ),
      )
      .groupBy(user.id)
      .orderBy(desc(user.accountActive))

    return users
  }

  async listWithComissions(
    month: number,
    year: number,
    options = { onlyActive: false },
  ) {
    const users = await this.listByMonth(month, year, options)

    const usersWithComissions = await Promise.all(
      users.map(async (user) => {
        const comission = await CalculateUserComissionUseCase.execute(
          user.id,
          month,
          year,
        )

        return {
          ...user,
          comission,
        }
      }),
    )

    return usersWithComissions
  }

  async getByName(name: string): Promise<DomainUser> {
    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.name, name),
      columns: {
        id: true,
        name: true,
        fullName: true,
        role: true,
        passwordHash: false,
        accountActive: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    return user
  }
}

export default new UserService()
