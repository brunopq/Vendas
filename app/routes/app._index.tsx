import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react"
import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { getUserOrRedirect } from "~/lib/authGuard"
import { brl } from "~/lib/formatters"
import { cn } from "~/lib/utils"

import SalesService, {
  type DomainSale,
  type CaptationType,
} from "~/services/SalesService"

import { Button, Table, Select, DropdownMenu } from "~/components/ui"

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

  const salesByCampaign: Record<string, number> = {}
  for (const sale of data.total) {
    salesByCampaign[sale.campaign.name] =
      salesByCampaign[sale.campaign.name] + 1 || 1
  }

  const newClientsByType: Record<CaptationType, number> = {
    ATIVO: 0,
    PASSIVO: 0,
  }
  for (const sale of data.newClients) {
    newClientsByType[sale.captationType] =
      newClientsByType[sale.captationType] + 1 || 1
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
            <h3>Campanhas</h3>

            <PieChart
              data={Object.entries(salesByCampaign).map(([k, v]) => ({
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
                  data={data.commissions.map((c) => ({
                    ...c,
                    id: c.campaign.id,
                  }))}
                  name={(c) => c.campaign.name}
                  value={(c) => c.sellCount / c.campaign.goal}
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

      <RecentSales />

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

const defaultColumns: ColumnDef<DomainSale>[] = [
  {
    id: "date",
    header: "Data",
    accessorKey: "date",
  },
  {
    id: "seller",
    header: "Vendedor",
    accessorKey: "seller.name",
  },
  {
    id: "client",
    header: "Cliente",
    accessorKey: "client",
  },
  {
    id: "adverseParty",
    header: "Parte adversa",
    accessorKey: "adverseParty",
  },
  {
    id: "campaign",
    header: "Campanha",
    accessorKey: "campaign.name",
  },
  {
    id: "saleArea",
    header: "Área",
    accessorKey: "saleArea",
  },
  {
    id: "isRepurchase",
    header: "Recompra?",
    accessorKey: "isRepurchase",
    cell: (info) => (info.getValue() ? "Sim" : "Não"),
  },
  {
    id: "captationType",
    header: "Tipo",
    accessorKey: "captationType",
  },
  {
    id: "estimatedValue",
    header: "Valor estimado",
    accessorKey: "estimatedValue",
    cell: (info) =>
      info.getValue() === null
        ? "Sem estimativa"
        : brl(String(info.getValue())),
  },

  {
    id: "indication",
    header: "Indicação",
    accessorKey: "indication",
  },
  {
    id: "comments",
    header: "Observações",
    accessorKey: "comments",
  },
]

function RecentSales() {
  const { data } = useLoaderData<typeof loader>()

  const [tableData, setTableData] = useState(data.total)
  const [visibleColumns, setVisibleColumns] = useState<VisibilityState>({
    indication: false,
    captationType: false,
    isRepurchase: false,
    saleArea: false,
    comments: false,
  })

  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ])

  const table = useReactTable({
    data: tableData,
    columns: defaultColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnVisibility: visibleColumns,
      sorting,
    },
    onColumnVisibilityChange: setVisibleColumns,
    onSortingChange: setSorting,
  })

  return (
    <div>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Vendas recentes</h2>

        <Button variant="link" asChild>
          <Link to="venda">Nova venda</Link>
        </Button>
      </header>
      <fieldset className="mb-4">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button size="sm" variant="ghost">
              Selecione colunas ({table.getVisibleLeafColumns().length}/
              {table.getAllColumns().length})
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content>
            {table.getAllLeafColumns().map((column) => (
              <DropdownMenu.CheckboxItem
                key={column.id}
                {...{
                  type: "checkbox",
                  checked: column.getIsVisible(),
                  onSelect: (e) => {
                    e.preventDefault()
                    column.getToggleVisibilityHandler()(e)
                  },
                }}
                className="px-1"
              >
                {typeof column.columnDef.header === "string" &&
                  column.columnDef.header}
              </DropdownMenu.CheckboxItem>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </fieldset>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            {table.getHeaderGroups().map((group) =>
              group.headers.map((c) => (
                <Table.Head
                  onClick={c.column.getToggleSortingHandler()}
                  key={c.id}
                  className="group cursor-pointer"
                >
                  <span className="flex select-none items-center gap-2">
                    {c.isPlaceholder
                      ? null
                      : flexRender(c.column.columnDef.header, c.getContext())}

                    <ChevronDown
                      data-sort={c.column.getIsSorted()}
                      className={cn(
                        "transition-transform duration-300 data-[sort='desc']:rotate-180 data-[sort=false]:scale-0 data-[sort=false]:group-hover:scale-50",
                      )}
                    />
                  </span>
                </Table.Head>
              )),
            )}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </div>
  )
}
