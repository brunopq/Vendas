import type { Route } from "./+types/route"

import { getAdminOrRedirect } from "~/lib/authGuard"

import CampaignService from "~/services/CampaignService"

export async function loader({ request }: Route.LoaderArgs) {
  await getAdminOrRedirect(request)

  const campaigns = await CampaignService.index()

  return { campaigns }
}
