import { encryptPassword, verifyPassword } from "~/lib/hashing"

import type { User } from "~/db/schema"
import { sale, user } from "~/db/schema"
import { db } from "~/db"
import { eq, sql } from "drizzle-orm"

export type DomainUser = Omit<User, "passwordHash">
export type NewUser = Omit<DomainUser, "id"> & { password: string }
export type LoginUser = Omit<DomainUser, "id" | "role"> & { password: string }

class AuthService {
  async index() {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        role: user.role,
        totalSales: sql<number>`cast(count(${sale.id}) as int)`,
      })
      .from(user)
      .leftJoin(sale, eq(user.id, sale.seller))
      .groupBy(user.id)

    return users
  }

  async login(userInfo: LoginUser): Promise<DomainUser> {
    const user = await db.query.user.findFirst({
      where: ({ name }, { eq }) => eq(name, userInfo.name),
    })

    if (!user) {
      throw new Error("User not found")
    }

    const passwordMatches = await verifyPassword(
      userInfo.password,
      user.passwordHash,
    )

    if (!passwordMatches) throw new Error("Password is incorrect")

    // removes the password hash
    return {
      id: user.id,
      name: user.name,
      role: user.role,
    }
  }

  async passwordMatches(id: string, password: string): Promise<boolean> {
    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    })

    if (!user) return false

    return await verifyPassword(password, user.passwordHash)
  }

  async create(userInfo: NewUser): Promise<DomainUser> {
    const userExists = await db.query.user.findFirst({
      where: ({ name }, { eq }) => eq(name, userInfo.name),
    })

    if (userExists) {
      throw new Error("User already exists")
    }

    const hashedPassword = await encryptPassword(userInfo.password)

    const [createdUser] = await db
      .insert(user)
      .values({
        name: userInfo.name,
        passwordHash: hashedPassword,
        role: userInfo.role,
      })
      .returning()

    // removes the password hash
    return {
      id: createdUser.id,
      name: createdUser.name,
      role: createdUser.role,
    }
  }

  async changePassword(id: string, newPassword: string) {
    const hashedPassword = await encryptPassword(newPassword)

    const [updated] = await db
      .update(user)
      .set({
        passwordHash: hashedPassword,
      })
      .where(eq(user.id, id))
      .returning()

    return {
      id: updated.id,
      name: updated.name,
      role: updated.role,
    }
  }

  async delete(id: string) {
    await db.delete(user).where(eq(user.id, id))
  }
}

export default new AuthService()
