import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { getAdminOrRedirect } from "~/lib/authGuard"

import CampaignService from "~/services/CampaignService"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminOrRedirect(request)

  const campaigns = await CampaignService.index()

  return json({ campaigns })
}
