import { useLoaderData } from "@remix-run/react"
import { Plus } from "lucide-react"
import { maxWidth } from "~/lib/utils"
import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { getAdminOrRedirect } from "~/lib/authGuard"

import LeadService from "~/services/LeadService"

import { Button, Table } from "~/components/ui"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminOrRedirect(request)

  const leads = await LeadService.index()

  return json({ leads })
}

export default function Leads() {
  const { leads } = useLoaderData<typeof loader>()

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Leads</h2>

        <div className="flex items-center justify-between gap-2">
          <Button icon="left" className="text-sm">
            <Plus /> Novo
          </Button>
        </div>
      </header>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-0">Fonte</Table.Head>
            <Table.Head>Cliente</Table.Head>
            <Table.Head>Data</Table.Head>
            <Table.Head>Área</Table.Head>
            <Table.Head>Comissão</Table.Head>
            <Table.Head className="w-0">{/*dropdown*/}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {leads.map((c) => (
            <Table.Row key={c.id}>
              <Table.Cell>{c.origin}</Table.Cell>
              <Table.Cell>{c.name}</Table.Cell>
              <Table.Cell>{c.date}</Table.Cell>
              <Table.Cell>{c.area}</Table.Cell>
              <Table.Cell>{c.phoneNumbers.map((p) => p)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </section>
  )
}
