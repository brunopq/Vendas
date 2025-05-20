import type { Route } from "./+types/app_.admin_.relatorio"
import { UTCDate } from "@date-fns/utc"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import XLSX from "xlsx"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { extractDateFromRequest } from "~/lib/extractDateFromRequest"
import { autofitColumns, excelCurrency } from "~/lib/XLSXUtils"

import UserService from "~/services/UserService"

export async function loader({ request }: Route.LoaderArgs) {
  await getAdminOrRedirect(request)

  const { month, year } = extractDateFromRequest(request)

  const data = await UserService.listWithComissions(month, year)

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.sheet_new()

  let row = 1

  XLSX.utils.sheet_add_aoa(ws, [["Relatório de premiações"]], {
    origin: `A${row}`,
  })
  ws["!merges"] = [XLSX.utils.decode_range("A1:E1")]
  row++
  XLSX.utils.sheet_add_aoa(
    ws,
    [
      [
        "Data",
        format(new UTCDate(year, month - 1), "MMMM, yyyy", { locale: ptBR }),
      ],
    ],
    {
      origin: `A${row}`,
    },
  )
  row += 2

  for (const d of data) {
    XLSX.utils.sheet_add_aoa(ws, [["Usuário", d.fullName || d.name]], {
      origin: `A${row}`,
    })
    row++
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          "Campanha",
          "Premiação geral",
          "Vendas do usuário",
          "Premiação do usuário",
          "Premiação total",
        ],
      ],
      {
        origin: `A${row}`,
      },
    )
    row++
    for (const c of d.comission.campaigns) {
      XLSX.utils.sheet_add_aoa(
        ws,
        [
          [
            c.campaing.name,
            excelCurrency(c.generalComission),
            c.userSellCount,
            excelCurrency(c.userComission),
            excelCurrency(c.comission),
          ],
        ],
        { origin: `A${row}` },
      )
      row++
    }
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          "Total",
          excelCurrency(d.comission.totalGeneralComission),
          d.totalSales,
          excelCurrency(d.comission.totalUserComission),
          excelCurrency(d.comission.totalComission),
        ],
      ],
      { origin: `A${row}` },
    )
    row += 2
  }

  // start at 2nd row because the header is merged
  autofitColumns(ws, XLSX.utils.decode_range("A2:H1000"))

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
      "Content-Disposition": `attachment; filename="Relatório de comissões ${month}-${year}.xlsx"`,
    },
  })
}
