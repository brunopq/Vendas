import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react"
import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { z } from "zod"

import { getUserOrRedirect } from "~/lib/authGuard"
import { brl } from "~/lib/formatters"

import SalesService, { type SellType } from "~/services/SalesService"

import { Button, Table, Select } from "~/components/ui"

import { PieChart } from "~/components/charts/pie"
import { BarChart } from "~/components/charts/bar"
import { HorizontalBarChart } from "~/components/charts/horizontal-bar"

const maybeNumber = z.coerce.number().nullable()

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUserOrRedirect(request)

  const url = new URL(request.url)

  let month = maybeNumber.parse(url.searchParams.get("mes"))
  if (!month) {
    month = new Date().getMonth() + 1
  }

  let year = maybeNumber.parse(url.searchParams.get("ano"))
  if (!year) {
    year = new Date().getFullYear()
  }
  const [data, userData, newClients, commissions] = await Promise.all([
    SalesService.getByMonth(month, year),
    SalesService.getByMonthAndUser(month, year, user.id),
    SalesService.getNewClientsByMonth(month, year),
    SalesService.getCommissionsByMonth(month, year),
  ])

  const repurchase: { total: number; user: number } = { total: 0, user: 0 }

  for (const d of data) {
    if (d.isRepurchase) {
      d.seller === user.id && repurchase.user++
      repurchase.total++
    }
  }

  const clients: { repurchase: number; new: number } = { repurchase: 0, new: 0 }

  for (const d of data) {
    if (d.isRepurchase) {
      clients.repurchase++
    } else {
      clients.new++
    }
  }

  return json({
    month,
    year,
    data: {
      total: data,
      user: userData,
      newClients,
      clients,
      repurchase,
      commissions,
    },
  })
}

export default function App() {
  const { data } = useLoaderData<typeof loader>()

  const salesByArea: Record<string, number> = {}
  for (const sale of data.total) {
    salesByArea[sale.area.name] = salesByArea[sale.area.name] + 1 || 1
  }

  const newClientsByType: Record<SellType, number> = { ATIVO: 0, PASSIVO: 0 }
  for (const sale of data.newClients) {
    newClientsByType[sale.sellType] = newClientsByType[sale.sellType] + 1 || 1
  }

  return (
    <div>
      <div className="mb-16">
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-medium text-2xl">Este mês</h2>

          <DateSelection />
        </header>

        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-2 row-span-2 flex flex-col items-center justify-between gap-6 rounded-md border border-primary-200 bg-primary-100 p-6 shadow-sm">
            <h3>Áreas de venda</h3>

            <PieChart
              data={Object.entries(salesByArea).map(([k, v]) => ({
                id: k,
                area: k,
                value: v,
              }))}
              name={(i) => i.area}
              value={(i) => i.value}
              colorStops={[
                "var(--color-accent-300)",
                "var(--color-accent-700)",
              ]}
            />
          </div>

          <div className="col-span-4 grid grid-cols-subgrid gap-2 rounded-md border border-teal-300 bg-teal-100 p-6 shadow-sm">
            <h3 className="col-span-2 text-lg">Comissões</h3>

            <div className="col-span-2 row-start-2">
              {data.commissions.length === 0 ? (
                <span className="block py-8 font-semibold">
                  Nenhuma venda realizada até agora...
                </span>
              ) : (
                <HorizontalBarChart
                  w={100}
                  h={50}
                  markerFormat={(m) => `${Math.round(m * 100)}%`}
                  data={data.commissions.map((c) => ({ ...c, id: c.area.id }))}
                  name={(c) => c.area.name}
                  value={(c) => c.sellCount / c.area.goal}
                  markers={[0.5, 0.75, 1, 1.1]}
                  colorStops={[
                    "var(--color-teal-300)",
                    "var(--color-teal-600)",
                  ]}
                />
              )}
            </div>

            <div className="col-span-2 row-span-2 grid grid-rows-subgrid text-center">
              <h3>Total</h3>

              <strong className="self-center text-xl">
                {brl(data.commissions.reduce((acc, c) => acc + c.comission, 0))}
              </strong>
            </div>
          </div>

          <div className="col-span-2 row-span-2 grid grid-cols-subgrid gap-2 rounded-md border border-primary-200 bg-primary-100 p-6 shadow-sm">
            <div className="col-span-2">
              <h3 className="text-center text-lg">Vendas</h3>
              <hr className="mb-4 border-primary-400 border-dashed" />

              <div className="flex items-center justify-around">
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
            </div>
            <div className="col-span-2">
              <h3 className="text-center text-lg">Novos clientes</h3>
              <hr className="mb-4 border-primary-400 border-dashed" />

              <div className="flex items-center justify-around">
                <div className="flex flex-col items-center justify-between gap-6">
                  Recompra
                  <strong className="text-3xl text-primary-700">
                    {data.clients.repurchase}
                  </strong>
                </div>
                <div className="flex flex-col items-center justify-between gap-6">
                  Novos
                  <strong className="text-3xl text-primary-700">
                    {data.clients.new}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 row-span-2 flex flex-col items-center justify-between gap-6 rounded-md border border-primary-200 bg-primary-100 p-6 shadow-sm">
            <h3>Fonte dos clientes novos</h3>

            <BarChart
              data={Object.entries(newClientsByType).map(([k, v]) => ({
                id: k,
                type: k,
                value: v,
              }))}
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

        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Data</Table.Head>
              <Table.Head>Vendedor</Table.Head>
              <Table.Head>Área</Table.Head>
              <Table.Head>Parte adversária</Table.Head>
              <Table.Head>Valor estimado</Table.Head>
              <Table.Head>Recompra</Table.Head>
              <Table.Head>Cliente</Table.Head>
              <Table.Head>Tipo</Table.Head>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {data.total.map((d) => (
              <Table.Row key={d.id}>
                <Table.Cell>{d.date}</Table.Cell>
                <Table.Cell>{d.seller.name}</Table.Cell>
                <Table.Cell>{d.area.name}</Table.Cell>
                <Table.Cell>{d.adverseParty}</Table.Cell>
                <Table.Cell>{brl(d.estimatedValue)}</Table.Cell>
                <Table.Cell>{d.isRepurchase ? "Sim" : "Não"}</Table.Cell>
                <Table.Cell>{d.client}</Table.Cell>
                <Table.Cell>{d.sellType}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>

      <footer className="mt-16 py-16" />
    </div>
  )
}

function DateSelection() {
  const { month, year } = useLoaderData<typeof loader>()
  const [_, setSearchParams] = useSearchParams()

  return (
    <Form className="flex gap-1">
      <Select.Root
        onValueChange={(v) => setSearchParams({ mes: v })}
        name="mes"
        defaultValue={`${month}`}
      >
        <Select.Trigger showIcon={false} className="w-fit py-1.5 text-sm">
          <Select.Value placeholder="Trocar mês" />
        </Select.Trigger>
        <Select.Content className="max-h-64">
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
            <Select.Item key={m} value={`${i + 1}`}>
              {m}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root
        onValueChange={(v) => setSearchParams({ ano: v })}
        name="ano"
        defaultValue={`${year}`}
      >
        <Select.Trigger showIcon={false} className="w-fit py-1.5 text-sm">
          <Select.Value placeholder="Trocar ano" />
        </Select.Trigger>
        <Select.Content className="max-h-64">
          {[2023, 2024, 2025].map((a) => (
            <Select.Item key={a} value={`${a}`}>
              {a}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Form>
  )
}
