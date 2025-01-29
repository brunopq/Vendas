import type { Route } from "./+types/app_.exportar-vendas"
import { format } from "date-fns"
import XLSX from "xlsx"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { extractDateFromRequest } from "~/lib/extractDateFromRequest"
import { autofitColumns } from "~/lib/autofitXLSXColumns"

import { brl } from "~/lib/formatters"

import SalesService from "~/services/SalesService"

export async function loader({ request }: Route.LoaderArgs) {
  await getAdminOrRedirect(request)

  const { month, year } = extractDateFromRequest(request)

  const sales = await SalesService.getByMonth(month, year)

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.sheet_new()

  XLSX.utils.sheet_add_aoa(ws, [
    [
      "Data",
      "Vendedor",
      "Campanha",
      "Área",
      "Tipo de Captação",
      "Recompra",
      "Cliente",
      "Parte Adversa",
      "Valor Estimado",
      "Indicação",
      "Comentários",
    ],
  ])

  for (const sale of sales) {
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          format(sale.date, "dd/MM/yyyy"),
          sale.seller.name,
          sale.campaign.name,
          sale.saleArea,
          sale.captationType === "ATIVO" ? "Ativo" : "Passivo",
          sale.isRepurchase ? "Sim" : "Não",
          sale.client,
          sale.adverseParty,
          sale.estimatedValue ? brl(sale.estimatedValue) : "",
          sale.indication,
          sale.comments,
        ],
      ],
      { origin: -1 },
    )
  }
  autofitColumns(ws, XLSX.utils.decode_range("A1:H1000"))

  XLSX.utils.book_append_sheet(wb, ws, "Relatório")
  const fileData = XLSX.write(wb, {
    bookType: "xlsx",
    type: "buffer",
    cellStyles: true,
  })

  return new Response(fileData, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      "Content-Disposition": `attachment; filename="vendas-${month}-${year}.xlsx"`,
    },
  })
}
