import type { LoaderFunctionArgs } from "@remix-run/node"
import { format } from "date-fns"
import { z } from "zod"

import { brl } from "~/lib/formatters"

import SalesService from "~/services/SalesService"

const maybeNumber = z.coerce.number().nullable()

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)

  let month = maybeNumber.parse(url.searchParams.get("mes"))
  if (!month) month = new Date().getMonth() + 1

  let year = maybeNumber.parse(url.searchParams.get("ano"))
  if (!year) year = new Date().getFullYear()

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
