import type { Route } from "./+types/app.campaigns"
import { isValid, parse } from "date-fns"

import { getUserOrRedirect } from "~/lib/authGuard"

import CampaignService from "~/services/CampaignService"

/**
 * Loads the campaigns on the same month as the `date` search param, encoded as yyyy-MM-dd.
 *
 * If `date` is not set or invalid, the current (server) date is used instead.
 *
 * Date is returned as a javascript `Date`, encoded with `JSON.stringify`
 */
export async function loader({ request }: Route.LoaderArgs) {
  await getUserOrRedirect(request)

  const urlDate = new URL(request.url).searchParams.get("date")

  let date: Date | null = null
  if (urlDate) {
    date = parse(urlDate, "yyyy-MM-dd", new Date())
  }
  if (!date || !isValid(date)) {
    date = new Date()
  }

  const campaigns = await CampaignService.getByMonth(
    date.getUTCMonth() + 1,
    date.getUTCFullYear(),
  )

  return { campaigns, date }
}
