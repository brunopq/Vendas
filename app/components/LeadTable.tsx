import type { DomainLead } from "~/services/LeadService"
import { Button, Popover, Select, Table } from "./ui"
import { cpf, phone } from "~/lib/formatters"
import { format } from "date-fns"
import { Fragment, useId } from "react"
import { useFetcher } from "@remix-run/react"
import type { DomainUser } from "~/services/AuthService"

export type LeadTableProps = {
  data: DomainLead[]
  users: DomainUser[]
}

export default function LeadTable({ data, users }: LeadTableProps) {
  const fetcher = useFetcher({ key: useId() })

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head className="w-0">Fonte</Table.Head>
          <Table.Head>Cliente</Table.Head>
          <Table.Head>Vendedor</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head>CPF</Table.Head>
          <Table.Head>Data</Table.Head>
          <Table.Head>Área</Table.Head>
          <Table.Head>Contato</Table.Head>
          <Table.Head>Outras informações</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((c) => (
          <Table.Row key={c.id}>
            <Table.Cell>{c.origin}</Table.Cell>
            <Table.Cell>{c.name}</Table.Cell>
            <Table.Cell className="text-nowrap">
              {c.asignee ? (
                c.asignee.name
              ) : (
                <Select.Root
                  onValueChange={(v) => {
                    fetcher.submit(
                      { id: c.id, asignee: v },
                      { method: "PATCH" },
                    )
                  }}
                >
                  <Select.Trigger className="px-2 py-1 text-sm">
                    <Select.Value placeholder="Não designado" />
                  </Select.Trigger>
                  <Select.Content className="text-sm">
                    {users.map((u) => (
                      <Select.Item key={u.id} value={u.id}>
                        {u.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            </Table.Cell>
            <Table.Cell>
              <span className="h-min text-nowrap rounded-full bg-primary-100 px-3 py-1 text-primary-800 text-sm">
                {c.status?.name}
              </span>
            </Table.Cell>
            <Table.Cell>{c.cpf && cpf(c.cpf)}</Table.Cell>
            <Table.Cell>{format(c.date, "dd/MM/yyyy")}</Table.Cell>
            <Table.Cell>{c.area}</Table.Cell>
            <Table.Cell>
              {c.phoneNumbers.map((p) => (
                <p key={p} className="text-nowrap">
                  {phone(p)}
                </p>
              ))}
            </Table.Cell>
            <Table.Cell>
              <ExtraFields fields={c.extraFields as Record<string, string>} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

type ExtraFieldsProps = {
  fields: Record<string, string>
}

function ExtraFields({ fields }: ExtraFieldsProps) {
  return (
    <Popover.Root>
      <Button variant="secondary" size="sm" asChild>
        <Popover.Trigger>
          {Object.entries(fields).length} campo
          {Object.entries(fields).length !== 1 && "s"}
        </Popover.Trigger>
      </Button>
      <Popover.Content className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="text-sm text-zinc-600">Campo</div>
        <div className="text-sm text-zinc-600">Valor</div>

        <hr className="col-span-full border-primary-400 border-dashed" />

        {Object.entries(fields).map(([k, v]) => (
          <Fragment key={k}>
            <span>{k}</span>
            <span>{v}</span>
          </Fragment>
        ))}
      </Popover.Content>
    </Popover.Root>
  )
}
