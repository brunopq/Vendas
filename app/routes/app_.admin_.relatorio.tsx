import { UTCDate } from "@date-fns/utc"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { useNavigate } from "@remix-run/react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import XLSX from "xlsx"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { extractDateFromRequest } from "~/lib/extractDateFromRequest"

import UserService from "~/services/UserService"

function autofitColumns(
  worksheet: XLSX.WorkSheet,
  range = XLSX.utils.decode_range("A1:ZZ1000"),
) {
  const maxLengths: number[] = []

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })]
      if (!cell) continue
      const cellText = cell.v
      if (!cellText) continue
      const cellTextLength = cellText.toString().length
      if (!maxLengths[C] || maxLengths[C] < cellTextLength) {
        maxLengths[C] = cellTextLength
      }
    }
  }

  for (let C = range.s.c; C <= range.e.c; ++C) {
    worksheet["!cols"] = worksheet["!cols"] || []
    worksheet["!cols"][C] = { wch: maxLengths[C] }
  }
}

function excelCurrency(value: number) {
  return { v: value, t: "n", z: "R$ #,##0.00" }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminOrRedirect(request)

  const { month, year } = extractDateFromRequest(request)

  const data = await UserService.listWithComissions(month, year)

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.sheet_new()

  let row = 1

  XLSX.utils.sheet_add_aoa(ws, [["Relatório de comissões"]], {
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
    XLSX.utils.sheet_add_aoa(ws, [["Usuário", d.name]], {
      origin: `A${row}`,
    })
    row++
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          "Campanha",
          "Comissão geral",
          "Vendas do usuário",
          "Comissão do usuário",
          "Comissão total",
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
      "Content-Disposition": `attachment; filename="Relatório de comissões ${month}-${year}"`,
    },
  })
}
