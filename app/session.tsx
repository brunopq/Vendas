import { createCookieSessionStorage } from "@remix-run/node"

import type { DomainUser } from "~/services/AuthService"

const cookieSecret = process.env.COOKIE_SECRET

if (!cookieSecret) {
  throw new Error("COOKIE_SECRET should be present in .env file")
}

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
    secure: process.env.NODE_ENV === "production",
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
