import type { Route } from "./+types/app.origins"

import { getUserOrRedirect } from "~/lib/authGuard"

import OriginService from "~/services/OriginService"

export async function loader({ request }: Route.LoaderArgs) {
  await getUserOrRedirect(request)

  const includeInactive =
    new URL(request.url).searchParams.get("includeInactive") === "true"

  const origins = await OriginService.getOrigins({ includeInactive })

  return { origins }
}
