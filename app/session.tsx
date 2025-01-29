import { createCookieSessionStorage } from "react-router"

import { env } from "./lib/envConfig"

import type { DomainUser } from "~/services/AuthService"

const cookieSecret = env.COOKIE_SECRET

export type SessionData = {
  user: DomainUser
}

export const {
  commitSession,
  destroySession,
  getSession: _getSession,
} = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: false,
    secrets: [cookieSecret],
    secure: env.NODE_ENV === "production",
  },
})

export async function getSession(request: Request) {
  return await _getSession(request.headers.get("Cookie"))
}

export async function getUser(request: Request): Promise<DomainUser | null> {
  const session = await getSession(request)

  const user = session.get("user")

  return user ?? null
}
