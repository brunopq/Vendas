import { encryptPassword, verifyPassword } from "~/lib/hashing"
import { eq, sql } from "drizzle-orm"

import { db } from "~/db"
import { sale, user, type User } from "~/db/schema"

export type DomainUser = Omit<User, "passwordHash">
export type NewUser = Omit<DomainUser, "id"> & { password: string }
export type LoginUser = {
  name: string
  password: string
}
export type UpdateUser = Partial<Omit<DomainUser, "id">>

class AuthService {
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

  async login(userInfo: LoginUser): Promise<DomainUser> {
    const user = await db.query.user.findFirst({
      where: ({ name }, { eq }) => eq(name, userInfo.name),
    })

    if (!user) {
      throw new Error("User not found")
    }

    if (!user.accountActive) {
      throw new Error("User account not active")
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
      fullName: user.fullName,
      role: user.role,
      accountActive: user.accountActive,
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
        fullName: userInfo.fullName,
        passwordHash: hashedPassword,
        role: userInfo.role,
      })
      .returning()

    // removes the password hash
    return {
      id: createdUser.id,
      name: createdUser.name,
      fullName: createdUser.fullName,
      role: createdUser.role,
      accountActive: createdUser.accountActive,
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
      fullName: updated.fullName,
      role: updated.role,
    }
  }

  async updateUser(id: string, fields: UpdateUser) {
    const [updated] = await db
      .update(user)
      .set({
        name: fields.name,
        fullName: fields.fullName,
        role: fields.role,
        accountActive: fields.accountActive,
      })
      .where(eq(user.id, id))
      .returning()

    return {
      id: updated.id,
      name: updated.name,
      fullName: updated.fullName,
      role: updated.role,
      accountActive: updated.accountActive,
    }
  }

  async delete(id: string) {
    await db.delete(user).where(eq(user.id, id))
  }
}

export default new AuthService()
