import { redirect, type Session } from "react-router"

import AuthService, { type DomainUser } from "~/services/AuthService"
import { destroySession, getSession, type SessionData } from "~/session"

export async function getUserOrRedirect(
  request: Request,
  redirectPath: { noredirect: true },
): Promise<DomainUser | null>
export async function getUserOrRedirect(
  request: Request,
  redirectPath?: string,
): Promise<DomainUser>
export async function getUserOrRedirect(
  request: Request,
  redirectPath?: string | { noredirect: true },
): Promise<DomainUser | null> {
  const session = await getSession(request)

  if (typeof redirectPath === "object" && "noredirect" in redirectPath) {
    try {
      return await assertUser(session)
    } catch (redirect) {
      return null
    }
  }

  return await assertUser(session, redirectPath)
}

export async function getAdminOrRedirect(
  request: Request,
  redirectPath: { noredirect: true },
): Promise<DomainUser | null>
export async function getAdminOrRedirect(
  request: Request,
  redirectPath?: string,
): Promise<DomainUser>
export async function getAdminOrRedirect(
  request: Request,
  redirectPath?: string | { noredirect: true },
): Promise<DomainUser | null> {
  const session = await getSession(request)

  if (typeof redirectPath === "object" && "noredirect" in redirectPath) {
    try {
      return await assertAdmin(session)
    } catch (redirect) {
      return null
    }
  }

  return await assertAdmin(session, redirectPath)
}

export async function assertUser(
  session: Session<SessionData>,
  redirectPath = "/",
): Promise<DomainUser> {
  const user = session.data.user
  if (!user) {
    throw redirect(redirectPath, {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    })
  }
  try {
    const dbUser = await AuthService.getByName(user.name)

    if (!dbUser.accountActive) {
      throw redirect(redirectPath)
    }

    return dbUser
  } catch (e) {
    throw redirect(redirectPath)
  }
}
export async function assertAdmin(
  session: Session<SessionData>,
  redirectPath = "/",
): Promise<DomainUser> {
  const dbUser = await assertUser(session, redirectPath)

  if (dbUser.role !== "ADMIN") {
    throw redirect(redirectPath)
  }

  return dbUser
}
