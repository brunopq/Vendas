import type { Route } from "./+types/app.origins"

import { getUserOrRedirect } from "~/lib/authGuard"

import OriginService from "~/services/OriginService"

export async function loader({ request }: Route.LoaderArgs) {
  await getUserOrRedirect(request)

  const origins = await OriginService.getOrigins()

  return { origins }
}
