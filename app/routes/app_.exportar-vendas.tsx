import type { LoaderFunctionArgs } from "@remix-run/node"
import { format } from "date-fns"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { extractDateFromRequest } from "~/lib/extractDateFromRequest"

import { brl } from "~/lib/formatters"

import SalesService from "~/services/SalesService"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminOrRedirect(request)

  const { month, year } = extractDateFromRequest(request)

  const sales = await SalesService.getByMonth(month, year)

  let csv =
    "Data,Vendedor,Campanha,Área,Tipo de Captação,Recompra,Cliente,Parte Adversa,Valor Estimado,Indicação,Comentários\n"

  // e as in escape
  const e = (s: string) => `"${s}",`
  for (const sale of sales) {
    csv += e(format(sale.date, "dd/MM/yyyy"))
    csv += e(sale.seller.name)
    csv += e(sale.campaign.name)
    csv += e(sale.saleArea)
    csv += e(sale.captationType === "ATIVO" ? "Ativo" : "Passivo")
    csv += e(sale.isRepurchase ? "Sim" : "Não")
    csv += e(sale.client)
    csv += e(sale.adverseParty)
    csv += e(sale.estimatedValue ? brl(sale.estimatedValue) : "")
    csv += e(sale.indication ? sale.indication : "")
    csv += e(sale.comments ? sale.comments : "")
    csv += "\n"
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="vendas-${month}-${year}.csv"`,
    },
  })
}
