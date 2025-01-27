import { z } from "zod"

const maybeNumber = z.coerce.number().nullable()

export function extractDateFromRequest(request: Request) {
  const url = new URL(request.url)

  let month = maybeNumber.parse(url.searchParams.get("mes"))
  if (!month) month = new Date().getMonth() + 1

  let year = maybeNumber.parse(url.searchParams.get("ano"))
  if (!year) year = new Date().getFullYear()

  return { month, year }
}
