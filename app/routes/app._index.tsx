import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react"

import { getUser } from "~/session"

import SalesService from "~/services/SalesService"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Button } from "~/components/ui/button"

import { PieChart } from "~/components/charts/pie"
import { BarChart } from "~/components/charts/bar"
import { z } from "zod"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"

const maybeNumber = z.coerce.number().nullable()

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request)

  const url = new URL(request.url)
  let month = maybeNumber.parse(url.searchParams.get("mes"))

  if (!month) {
    month = new Date().getMonth() + 1
  }

  const [data, userData, newClients] = await Promise.all([
    SalesService.getByMonth(month, 2024),
    SalesService.getByMonthAndUser(month, 2024, user.id),
    SalesService.getNewClientsByMonth(month, 2024),
  ])

  const repurchase: { total: number; user: number } = { total: 0, user: 0 }

  for (const d of data) {
    if (d.isRepurchase) {
      d.seller === user.id && repurchase.user++
      repurchase.total++
    }
  }

  return json({
    month,
    data: {
      total: data,
      user: userData,
      newClients,
      repurchase,
    },
  })
}

export default function App() {
  const { data, month } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams()

  const salesByArea = Object.entries(
    data.total.reduce(
      (acc, i) => {
        acc[i.area.name] = acc[i.area.name] + 1 || 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([k, v]) => ({ id: k, area: k, value: v }))

  const salesByType = Object.entries(
    data.newClients.reduce(
      (acc, i) => {
        acc[i.sellType] = acc[i.sellType] + 1 || 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([k, v]) => ({ id: k, type: k, value: v }))

  return (
    <div>
      <div className="mb-16">
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-medium text-2xl">Este mês</h2>

          <Select
            onValueChange={(v) => setSearchParams({ mes: v })}
            name="mes"
            defaultValue={`${month}`}
          >
            <SelectTrigger showIcon={false} className="w-fit py-1.5 text-sm">
              <SelectValue placeholder="Trocar mês" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {[
                "Janeiro",
                "Fevereiro",
                "Março",
                "Abril",
                "Maio",
                "Junho",
                "Julho",
                "Agosto",
                "Setembro",
                "Outubro",
                "Novembro",
                "Dezembro",
              ].map((m, i) => (
                <SelectItem key={m} value={`${i + 1}`}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-2 grid grid-cols-subgrid gap-2 rounded-md border border-primary-200 bg-primary-100 p-6 shadow-sm">
            <h3 className="col-span-2 text-center text-lg">Vendas</h3>
            <hr className="col-span-2 mb-2 border-primary-400 border-dashed" />

            <div className="flex flex-col items-center justify-between gap-6">
              Você
              <strong className="text-3xl text-primary-700">
                {data.user.length}
              </strong>
            </div>
            <div className="flex flex-col items-center justify-between gap-6">
              Total
              <strong className="text-3xl text-primary-700">
                {data.total.length}
              </strong>
            </div>
          </div>

          <div className="col-span-2 row-span-2 flex flex-col items-center justify-between gap-6 rounded-md border border-primary-200 bg-primary-100 p-6 shadow-sm">
            <h3>Áreas de venda</h3>

            <PieChart
              data={salesByArea}
              name={(i) => i.area}
              value={(i) => i.value}
              colorStops={[
                "var(--color-accent-300)",
                "var(--color-accent-700)",
              ]}
            />
          </div>

          <div className="col-span-2 row-span-2 flex flex-col items-center justify-between gap-6 rounded-md border border-primary-200 bg-primary-100 p-6 shadow-sm">
            <h3>Clientes novos</h3>

            <BarChart
              data={salesByType}
              name={(i) => i.type}
              value={(i) => i.value}
              w={100}
              h={75}
              colorStops={[
                "var(--color-accent-300)",
                "var(--color-accent-600)",
              ]}
            />
          </div>

          <div className="col-span-2 grid grid-cols-subgrid gap-2 rounded-md border border-primary-200 bg-primary-100 p-6 shadow-sm">
            <h3 className="col-span-2 text-center text-lg">Recompras</h3>
            <hr className="col-span-2 mb-2 border-primary-400 border-dashed" />

            <div className="flex flex-col items-center justify-between gap-6">
              Você
              <strong className="text-3xl text-primary-700">
                {data.repurchase.user}
              </strong>
            </div>
            <div className="flex flex-col items-center justify-between gap-6">
              Total
              <strong className="text-3xl text-primary-700">
                {data.repurchase.total}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div>
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-medium text-2xl">Vendas recentes</h2>

          <Button variant="link" asChild>
            <Link to="venda">Nova venda</Link>
          </Button>
        </header>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Parte adversária</TableHead>
              <TableHead>Valor estimado</TableHead>
              <TableHead>Recompra</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.total.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.date}</TableCell>
                <TableCell>{d.seller.name}</TableCell>
                <TableCell>{d.area.name}</TableCell>
                <TableCell>{d.adverseParty}</TableCell>
                <TableCell>{d.estimatedValue}</TableCell>
                <TableCell>{d.isRepurchase ? "Sim" : "Não"}</TableCell>
                <TableCell>{d.client}</TableCell>
                <TableCell>{d.sellType}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <footer className="mt-16 py-16" />
    </div>
  )
}
