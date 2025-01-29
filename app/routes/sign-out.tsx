import type { Route } from "./+types/sign-out"
import { redirect } from "react-router"

import { destroySession, getSession } from "~/session"

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request)

  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  })
}
