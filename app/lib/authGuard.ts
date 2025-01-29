import { redirect } from "react-router";

import type { DomainUser } from "~/services/AuthService"
import { getUser } from "~/session"

export async function getUserOrRedirect(
  request: Request,
  redirectPath?: string,
): Promise<DomainUser> {
  const user = await getUser(request)

  assertUser(user, redirectPath)

  return user
}

export async function getAdminOrRedirect(
  request: Request,
  redirectPath?: string,
): Promise<DomainUser> {
  const user = await getUser(request)

  assertAdmin(user, redirectPath)

  return user
}

export function assertUser(
  user: DomainUser | null,
  redirectPath = "/",
): asserts user is DomainUser {
  if (!user) {
    throw redirect(redirectPath)
  }
}
export function assertAdmin(
  user: DomainUser | null,
  redirectPath = "/",
): asserts user is DomainUser {
  if (!user || user.role !== "ADMIN") {
    throw redirect(redirectPath)
  }
}
