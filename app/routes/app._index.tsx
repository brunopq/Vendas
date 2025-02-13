import type { Route } from "./+types/app._index"
import { Link, useFetcher, useLoaderData, useSearchParams } from "react-router"
import { memo, useEffect, useState } from "react"
import { ChevronDown, EllipsisVertical } from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table"
import { format, isBefore, isSameDay, parse } from "date-fns"
import { z } from "zod"
import { utc } from "@date-fns/utc"

import { extractDateFromRequest } from "~/lib/extractDateFromRequest"
import { getUserOrRedirect } from "~/lib/authGuard"
import { brl } from "~/lib/formatters"
import { cn } from "~/lib/utils"
import { error } from "~/lib/result"

import SalesService, {
  type DomainSale,
  type CaptationType,
} from "~/services/SalesService"

import { Button, Table, DropdownMenu, Dialog, Tabs } from "~/components/ui"

import { PieChart } from "~/components/charts/pie"
import { BarChart } from "~/components/charts/bar"
import { HorizontalBarChart } from "~/components/charts/horizontal-bar"
import { DateSelection } from "~/components/DateSelection"
import { toast } from "~/hooks/use-toast"

const maybeNumber = z.coerce.number().nullable()

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request)

  const { year, month } = extractDateFromRequest(request)

  const [data, userData, newClients, commissions, userComissions] =
    await Promise.all([
      SalesService.getByMonth(month, year),
      SalesService.getByMonthAndUser(month, year, user.id),
      SalesService.getNewClientsByMonth(month, year),
      SalesService.getCommissionsByMonth(month, year),
      SalesService.getUserSales(month, year, user.id),
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

  return {
    user,
    month,
    year,
    data: {
      total: data,
      user: userData,
      newClients,
      clients,
      repurchase,
      commissions: commissions.map((c) => {
        const userSellCount =
          userComissions.find((uc) => uc.campaign.id === c.campaign.id)
            ?.sellCount || 0

        // TODO: organize this mess
        return {
          ...c,
          userSellCount: userSellCount,
          userComission: userSellCount * Number(c.campaign.individualPrize),
        }
      }),
    },
  }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getUserOrRedirect(request)

  const formData = await request.formData()

  const data: Record<string, unknown> = {}

  for (const [field, value] of formData) {
    if (value) {
      data[field] = String(value)
    }
  }

  if (request.method === "DELETE") {
    const { id } = z
      .object({
        id: z.string(),
      })
      .parse(data)

    const sale = await SalesService.getById(id)

    if (!sale) {
      return error({
        method: "DELETE",
        type: "not_found" as const,
        message: `Sale ${id} not found`,
      })
    }

    if (user.role !== "ADMIN" && sale.seller !== user.id) {
      return error({
        method: "DELETE",
        type: "forbidden" as const,
        message: `User ${user.id} is not allowed to delete sale ${id}`,
      })
    }

    await SalesService.delete(id)
  }
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { data, month, year, user } = loaderData
  const [_, setSearchParams] = useSearchParams()

  const salesByCampaign: Record<string, number> = {}
  for (const sale of data.total) {
    salesByCampaign[sale.campaign.name] =
      salesByCampaign[sale.campaign.name] + 1 || 1
  }
  const salesByOrigin: Record<string, number> = {}
  for (const sale of data.total) {
    const name = sale.origin?.name || "Sem origem"
    salesByOrigin[name] = salesByOrigin[name] + 1 || 1
  }

  const newClientsByType: Record<CaptationType, number> = {
    ATIVO: 0,
    PASSIVO: 0,
  }
  for (const sale of data.newClients) {
    newClientsByType[sale.captationType] =
      newClientsByType[sale.captationType] + 1 || 1
  }

  const salesByDate = [] as { date: Date; count: number; id: string }[]
  for (const sale of data.total) {
    let index = salesByDate.findIndex((a) => isSameDay(a.date, sale.date))

    if (index === -1) {
      index = 0

      while (
        index < salesByDate.length &&
        isBefore(salesByDate[index].date, sale.date)
      ) {
        index++
      }

      salesByDate.splice(index, 0, {
        date: parse(sale.date, "yyyy-MM-dd", new Date(), { in: utc }),
        count: 0,
        id: sale.date,
      })
    }
    salesByDate[index].count++
  }

  return (
    <div>
      <div className="mb-16">
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-medium text-2xl">Este mês</h2>

          <span className="flex items-center gap-4">
            {user.role === "ADMIN" && (
              <Button size="sm">
                <Link
                  reloadDocument
                  to={`/app/exportar-vendas?mes=${month}&ano=${year}`}
                >
                  Exportar dados
                </Link>
              </Button>
            )}

            <DateSelection
              month={month}
              year={year}
              onChange={({ month, year }) => {
                setSearchParams({ mes: String(month), ano: String(year) })
              }}
            />
          </span>
        </header>

        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-2 row-span-2 flex flex-col items-center rounded-md border border-primary-200 bg-primary-100 p-4 shadow-sm">
            <Tabs.Root className="w-full" defaultValue="campaigns">
              <Tabs.List>
                <Tabs.Trigger value="campaigns">Áreas</Tabs.Trigger>
                <Tabs.Trigger value="origins">Origens</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="campaigns">
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
              </Tabs.Content>
              <Tabs.Content value="origins">
                <PieChart
                  data={Object.entries(salesByOrigin).map(([k, v]) => ({
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
              </Tabs.Content>
            </Tabs.Root>
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
                  markers={[0.5, 0.75, 1]}
                  colorStops={[
                    "var(--color-teal-300)",
                    "var(--color-teal-600)",
                  ]}
                  renderTooltip={(item) => (
                    <>
                      <p className="flex items-center justify-between gap-2">
                        {item.campaign.name}
                        <strong className=" text-primary-700">
                          {Math.round(
                            (item.sellCount / item.campaign.goal) * 100,
                          )}
                          %
                        </strong>
                      </p>
                      <p className="text-sm">
                        Meta: {item.sellCount} / {item.campaign.goal}
                      </p>
                      <p className="text-sm">
                        Comissão: {brl(item.comission)} /{" "}
                        {brl(item.campaign.prize)}
                      </p>

                      <p className="text-sm">
                        Suas vendas: {item.userSellCount}
                      </p>

                      {item.userSellCount > 0 && (
                        <p className="text-sm">
                          Sua comissão: {brl(item.userComission)}
                        </p>
                      )}
                    </>
                  )}
                />
              )}
            </div>

            <div className="row-span-2 grid grid-rows-subgrid text-center">
              <h3>Meta geral</h3>

              <strong className="self-center text-xl">
                {brl(data.commissions.reduce((acc, c) => acc + c.comission, 0))}
              </strong>
            </div>
            <div className="row-span-2 grid grid-rows-subgrid text-center">
              <h3>Sua comissão</h3>

              <strong className="self-center text-xl">
                {brl(
                  data.commissions.reduce(
                    (acc, c) => acc + c.comission + c.userComission,
                    0,
                  ),
                )}
              </strong>
            </div>
          </div>

          {/* <div className="col-span-4 grid grid-cols-subgrid gap-2 rounded-md border border-primary-200 bg-primary-100 p-6 shadow-sm">
            <h3 className="col-span-full mt-2 font-semibold text-lg text-primary-800">
              Vendas durante o mês
            </h3>

            <div className="col-span-full">
              <LineChart
                color="var(--color-accent-500)"
                data={salesByDate}
                h={50}
                name={(d) => {
                  return d.date
                }}
                value={(d) => d.count}
              />
            </div>
          </div> */}

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

      <RecentSales key={`${month}/${year}-${data.total.length}`} />

      <footer className="mt-16 py-16" />
    </div>
  )
}

// holy shit
const defaultColumns: ColumnDef<
  Awaited<ReturnType<typeof loader>>["data"]["total"][number]
>[] = [
  {
    id: "dropdown",
    header: "",
    accessorKey: "id",
    enableHiding: false,
    enableSorting: false,
    cell: memo(({ cell, row }) => {
      const fetcher = useFetcher<typeof action>({})

      useEffect(() => {
        if (fetcher.data?.ok === false) {
          let message = "Erro desconhecido"

          if (fetcher.data.error.type === "forbidden") {
            message = "Você não tem permissão para excluir essa venda"
          } else if (fetcher.data.error.type === "not_found") {
            message = "Venda não encontrada"
          }

          toast({
            title: "Erro ao excluir",
            description: message,
            variant: "destructive",
          })
        }
      }, [fetcher.data])

      return (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" className="p-1">
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item asChild>
              <Link to={`venda/${cell.getValue()}`}>Editar</Link>
            </DropdownMenu.Item>

            <Dialog.Root>
              <Dialog.Trigger asChild>
                <DropdownMenu.Item
                  onSelect={(e) => e.preventDefault()}
                  variant="danger"
                >
                  Excluir
                </DropdownMenu.Item>
              </Dialog.Trigger>

              <Dialog.Content className="[--dialog-content-max-width:32rem]">
                <Dialog.Header>
                  <Dialog.Title>Excluir venda</Dialog.Title>
                  <Dialog.Description>
                    Você tem certeza que deseja excluir esta venda?
                  </Dialog.Description>
                </Dialog.Header>

                <div className="space-y-1">
                  <p>
                    Criado por:{" "}
                    <strong className="font-semibold text-primary-700">
                      {row.original.seller.name}
                    </strong>{" "}
                    em{" "}
                    <strong className="font-semibold text-primary-700">
                      {format(new Date(row.original.date), "dd/MM/yyyy")}
                    </strong>
                  </p>
                  <p>
                    Cliente:{" "}
                    <strong className="font-semibold text-primary-700">
                      {row.original.client}
                    </strong>
                  </p>
                  <p>
                    Parte adversa:{" "}
                    <strong className="font-semibold text-primary-700">
                      {row.original.adverseParty}
                    </strong>
                  </p>
                  <p>
                    Campanha:{" "}
                    <strong className="font-semibold text-primary-700">
                      {row.original.campaign.name}
                    </strong>
                  </p>
                </div>

                <Dialog.Footer>
                  <Button variant="ghost">Cancelar</Button>
                  <Button
                    onClick={() =>
                      fetcher.submit(
                        { id: row.original.id },
                        { method: "DELETE" },
                      )
                    }
                    variant="destructive"
                  >
                    Excluir
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Root>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )
    }),
  },
  {
    id: "date",
    header: "Data",
    accessorKey: "date",
    cell: ({ cell }) =>
      format(
        parse(String(cell.getValue()), "yyyy-MM-dd", new Date()),
        "dd/MM/yyyy",
      ),
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
    header: "Área",
    accessorKey: "campaign.name",
  },
  {
    id: "saleArea",
    header: "Origem",
    accessorKey: "origin.name",
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
              Selecione colunas (
              {
                table.getVisibleLeafColumns().filter((c) => c.getCanHide())
                  .length
              }
              /{table.getAllColumns().filter((c) => c.getCanHide()).length})
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content>
            {table.getAllLeafColumns().map(
              (column) =>
                column.getCanHide() && (
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
                ),
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </fieldset>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            {table.getHeaderGroups().map((group) =>
              group.headers.map((c) => (
                <Table.Head
                  onPointerDown={c.column.getToggleSortingHandler()}
                  key={c.id}
                  className={
                    c.column.getCanSort() ? "group cursor-pointer" : undefined
                  }
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
