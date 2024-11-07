import { Form, json, useFetcher, useLoaderData } from "@remix-run/react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { Fragment, useState, type ChangeEvent } from "react"
import Papa from "papaparse"

import { maxWidth } from "~/lib/utils"

import AuthService, { type DomainUser } from "~/services/AuthService"

import { Button, Input, Popover, Select, Table, Tabs } from "~/components/ui"
import FormGroup from "~/components/FormGroup"
import { getAdminOrRedirect } from "~/lib/authGuard"
import { error } from "~/lib/result"
// import LeadTable from "~/components/LeadTable"
import type { DomainLead, DomainNewLead } from "~/services/LeadService"
import { cpf, phone } from "~/lib/formatters"
import LeadStatusService from "~/services/LeadStatusService"
import { z } from "zod"
import { leadSchema, newLeadSchema } from "~/db/schema"
import LeadService from "~/services/LeadService"
import { format, parse } from "date-fns"

async function handle<const M, Res>(method: M, fn: () => Promise<Res>) {}

const schema = z.object({
  file: z.instanceof(File),
  asignee: z.string(), // asignee ID
  date: z.string(), // date field from file
  origin: z.string(), // field from file
  name: z.string(), // field from file
  cpf: z.string(), // field from file
  birthDate: z.string(), // field from file
  phoneNumbers: z.string(), // fff
  status: z.string().optional(), // status id
  area: z.string().optional(),
})

export const action = async ({ request }: ActionFunctionArgs) => {
  await getAdminOrRedirect(request)

  const formData = await request.formData()

  const data: Record<string, unknown> = {}

  for (const [field, value] of formData) {
    if (value) {
      data[field] = value
    }
  }

  console.log(data)

  const parsed = schema.parse(data)

  console.log(parsed)

  const buf = await parsed.file.arrayBuffer()
  const textDecoder = new TextDecoder()
  const str = textDecoder.decode(buf)

  const defaultStatus = await LeadStatusService.getDefaultStatus()

  Papa.parse(str, {
    header: true,
    skipEmptyLines: true,
    async complete(results) {
      console.log(results)
      if (results.errors.length > 0) {
        return
      }
      const headers = results.meta.fields
      const extraFields = headers?.filter(
        (h) =>
          h !== parsed.area &&
          h !== parsed.birthDate &&
          h !== parsed.cpf &&
          h !== parsed.date &&
          h !== parsed.name &&
          h !== parsed.origin &&
          h !== parsed.phoneNumbers,
      )

      const get = (
        from: Record<string, string | undefined>,
        field: string | null | undefined,
      ): string | undefined => {
        if (!field) return undefined
        const val = from[field]
        if (!val) return undefined
        return val
      }

      const leads = (results.data as Record<string, string | undefined>[]).map(
        (d) => {
          const extraFieldsValues: Record<string, string> = {}

          for (const [k, v] of Object.entries(d)) {
            if (v && extraFields?.find((f) => f === k)) {
              extraFieldsValues[k] = v
            }
          }

          let date = get(d, parsed.date)

          if (date) {
            date = format(parse(date, "dd/MM/yyyy", new Date()), "yyyy-MM-dd")
          }

          let birthDate = get(d, parsed.birthDate)

          if (birthDate) {
            birthDate = format(
              parse(birthDate, "dd/MM/yyyy", new Date()),
              "yyyy-MM-dd",
            )
          }

          const lead = {
            area: get(d, parsed.area),
            asignee: parsed.asignee,
            birthDate,
            comments: null,
            cpf: get(d, parsed.cpf),
            date: date,
            name: get(d, parsed.name),
            phoneNumbers:
              get(d, parsed.phoneNumbers)
                ?.split(",")
                .map((a) => a.trim()) || [],
            origin: get(d, parsed.origin),
            status: defaultStatus.id,
            extraFields: extraFieldsValues,
          } satisfies Partial<DomainNewLead>

          return lead
        },
      )

      console.log(leads)

      const created = await LeadService.createMany(leads)
      console.log(created)
    },
  })

  return json(error([{}]))
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const users = await AuthService.index()
  const defaultStatus = await LeadStatusService.getDefaultStatus()

  return json({ users, defaultStatus })
}

type Field = {
  name: string
  displayName: string
  value: string | null
}

export default function List() {
  const { users, defaultStatus } = useLoaderData<typeof loader>()

  const [headers, setHeaders] = useState<string[]>()
  const [data, setData] = useState<Record<string, string>[]>([])

  const [asignee, setAsignee] = useState<DomainUser>()
  const [fieldsMapping, setFieldsMapping] = useState<Field[]>([
    { name: "date", displayName: "Data", value: null },
    { name: "origin", displayName: "Fonte", value: null },
    { name: "area", displayName: "Área", value: null },
    { name: "name", displayName: "Cliente", value: null },
    { name: "cpf", displayName: "CPF", value: null },
    { name: "birthDate", displayName: "Data de nascimento", value: null },
    { name: "phoneNumbers", displayName: "Números de telefone", value: null },
  ])

  console.log({ asignee })

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0)
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          console.log(results)
          setHeaders(results.meta.fields)
          setData(results.data as Record<string, string>[])
        },
        error(error) {
          console.log(error)
        },
      })
    }
  }

  const get = (map: Record<string, string>, field: string) => {
    const fm = fieldsMapping.find((f) => f.name === field)
    if (fm?.value) {
      return map[fm.value]
    }
    return undefined
  }

  const extraFields = headers?.filter(
    (h) => !fieldsMapping.find((f) => f.value === h),
  )

  const previewLeads: Partial<DomainLead>[] = data.map((raw, i) => {
    const extraFieldsValues: Record<string, string> = {}

    for (const [k, v] of Object.entries(raw)) {
      if (extraFields?.find((f) => f === k)) {
        extraFieldsValues[k] = v
      }
    }

    return {
      area: get(raw, "area"),
      asignee,
      birthDate: get(raw, "birthDate"),
      comments: get(raw, "comments"),
      cpf: get(raw, "cpf"),
      date: get(raw, "date"),
      id: get(raw, "id"),
      name: get(raw, "name"),
      origin: get(raw, "origin"),
      phoneNumbers: [],
      status: defaultStatus,
      extraFields: extraFieldsValues,
    }
  })

  console.log(previewLeads)

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Carregar lista</h2>
      </header>
      <Form
        className="grid grid-cols-2 gap-4"
        method="POST"
        encType="multipart/form-data"
      >
        <Input
          onChange={handleChange}
          className="col-span-full"
          name="file"
          type="file"
          accept=".csv"
        />

        {headers && (
          <>
            <FormGroup name="asignee" label="Vendedor">
              <Select.Root
                value={asignee?.id}
                onValueChange={(a) => setAsignee(users.find((u) => u.id === a))}
                name="asignee"
              >
                <Select.Trigger>
                  <Select.Value placeholder="Escolha o vendedor..." />
                </Select.Trigger>
                <Select.Content>
                  {users.map((u) => (
                    <Select.Item value={u.id} key={u.id}>
                      {u.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </FormGroup>

            {fieldsMapping.map((field) => (
              <FormGroup
                key={field.name}
                name={field.name}
                label={field.displayName}
              >
                <Select.Root
                  onValueChange={(value) => {
                    setFieldsMapping((prev) => {
                      prev.splice(
                        prev.findIndex((p) => p.name === field.name),
                        1,
                        { ...field, value },
                      )
                      return [...prev]
                    })
                  }}
                  name={field.name}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Selecione..." />
                  </Select.Trigger>
                  <Select.Content>
                    {headers.map((h) => (
                      <Select.Item value={h || "no_value"} key={h}>
                        {h}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </FormGroup>
            ))}

            <Button className="col-span-full justify-self-end">
              Criar {previewLeads.length} leads
            </Button>
          </>
        )}
      </Form>

      <div className="mt-16" />

      <Tabs.Root>
        <Tabs.List>
          <Tabs.Trigger value="original">Original</Tabs.Trigger>
          <Tabs.Trigger value="final">Final</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className="p-0" value="original">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                {headers?.map((h, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  <Table.Head key={i}>{h}</Table.Head>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data?.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <Table.Row key={i}>
                  {headers?.map((c, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <Table.Cell key={i}>{d[c]}</Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Tabs.Content>

        <Tabs.Content className="p-0" value="final">
          <LeadTable data={previewLeads} />
        </Tabs.Content>
      </Tabs.Root>
    </section>
  )
}

export type LeadTableProps = {
  data: Partial<DomainLead>[]
}

function LeadTable({ data }: LeadTableProps) {
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
            <Table.Cell className="text-nowrap">{c.asignee?.name}</Table.Cell>
            <Table.Cell>
              {c.status && (
                <span className="h-min text-nowrap rounded-full bg-primary-100 px-3 py-1 text-primary-800 text-sm">
                  {c.status.name}
                </span>
              )}
            </Table.Cell>
            <Table.Cell>{c.cpf && cpf(c.cpf)}</Table.Cell>
            <Table.Cell>{c.date}</Table.Cell>
            <Table.Cell>{c.area}</Table.Cell>
            <Table.Cell>
              {c.phoneNumbers?.map((p) => (
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
      <Popover.Content className="grid max-w-lg grid-cols-2 gap-x-4 gap-y-1">
        <div className="text-sm text-zinc-600">Campo</div>
        <div className="text-sm text-zinc-600">Valor</div>

        <hr className="col-span-full border-primary-400 border-dashed" />

        {Object.entries(fields).map(([k, v]) => (
          <Fragment key={k}>
            <span>{k}</span>
            <span>{v}</span>
            <hr className="col-span-full border-zinc-200 last-of-type:border-none" />
          </Fragment>
        ))}
      </Popover.Content>
    </Popover.Root>
  )
}
