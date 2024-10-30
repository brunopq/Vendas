import React, {
  useEffect,
  useId,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react"
import { Plus, Trash2 } from "lucide-react"
import { maxWidth } from "~/lib/utils"
import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
} from "@remix-run/node"
import { z, ZodError } from "zod"
import { format } from "date-fns"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { error, ok, type Result } from "~/lib/result"
import { cpf, phone } from "~/lib/formatters"

import LeadStatusService from "~/services/LeadStatusService"
import LeadService, { type DomainNewLead } from "~/services/LeadService"

import { toast } from "~/hooks/use-toast"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import { Button, Dialog, Input, Popover, Select, Table } from "~/components/ui"
import FormGroup from "~/components/FormGroup"
import AuthService from "~/services/AuthService"

const phoneNumberSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 11, {
    message: "Telefone deve ter 11 dígitos, incluíndo o DDD",
  })

const cpfSchema = z
  .string()
  .transform((val) => val?.replace(/\D/g, ""))
  .refine((val) => val && val.length === 11, {
    message: "Cpf deve ter 11 dígitos",
  })
  .nullish()

const extraFieldSchema = z.object({
  name: z.string(),
  value: z.string(),
})

const payloadSchema = z.object({
  origin: z.string({ required_error: "Origem é obrigatório" }),
  date: z.string({ required_error: "Data é obrigatório" }).date(),
  name: z.string({ required_error: "Nome do cliente é obrigatório" }),
  cpf: cpfSchema,
  birthDate: z
    .string({ required_error: "Data de nascimento é obrigatória" })
    .date(),
  area: z.string().optional().nullable(),

  phoneNumbers: z
    .preprocess(
      (data) => JSON.parse(data as string),
      z.array(z.object({ phone: phoneNumberSchema })),
    )
    .transform((phones) => phones.map((p) => p.phone)),

  extraFields: z
    .preprocess((data) => JSON.parse(data as string), z.array(extraFieldSchema))
    .transform((fields) =>
      fields.reduce(
        (acc, field) => {
          acc[field.name] = field.value
          return acc
        },
        {} as Record<string, string>,
      ),
    ),
})

async function handle<const M, Res>(method: M, fn: () => Promise<Res>) {
  let result: Result<Res, ErrorT[]>

  try {
    result = ok(await fn())
  } catch (e) {
    if (e instanceof ZodError) {
      const errors = e.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      result = error(errors)
    } else {
      result = error([{ type: "backend", message: "unknown backend error" }])
      console.log(e)
    }
  }

  return { method, result }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  await getAdminOrRedirect(request)

  const formData = await request.formData()

  const data: Record<string, unknown> = {}

  for (const [field, value] of formData) {
    if (value) {
      data[field] = String(value)
    }
  }

  if (request.method === "PATCH") {
    return json(
      await handle("POST", async () => {
        const schema = z.object({
          id: z.string(),
          asignee: z.string(),
        })

        const { id, asignee } = schema.parse(data)

        return await LeadService.assign(id, asignee)
      }),
    )
  }

  if (request.method === "POST") {
    return json(
      await handle("POST", async () => {
        const parsed = payloadSchema.parse(data)

        const status = await LeadStatusService.getDefaultStatus()

        const dto = {
          area: parsed.area ?? null,
          asignee: null,
          birthDate: parsed.birthDate,
          comments: null,
          cpf: parsed.cpf ?? null,
          date: parsed.date,
          extraFields: parsed.extraFields,
          name: parsed.name,
          origin: parsed.origin,
          phoneNumbers: parsed.phoneNumbers,
          status: status.id,
        } satisfies DomainNewLead

        return await LeadService.create(dto)
      }),
    )
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminOrRedirect(request)

  const leads = await LeadService.index()
  const users = await AuthService.index()

  return json({ leads, users })
}

export default function Leads() {
  const { leads, users } = useLoaderData<typeof loader>()
  const fetcher = useFetcher({ key: useId() })

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Leads</h2>

        <div className="flex items-center justify-between gap-2">
          <NewLeadModal>
            <Button icon="left" className="text-sm">
              <Plus /> Novo
            </Button>
          </NewLeadModal>
        </div>
      </header>

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
          {leads.map((c) => (
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
                  {c.status.name}
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
    </section>
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
          <React.Fragment key={k}>
            <span>{k}</span>
            <span>{v}</span>
          </React.Fragment>
        ))}
      </Popover.Content>
    </Popover.Root>
  )
}

function BaseLeadFormFields() {
  const [cpfField, setCpfField] = useState<string>()
  const [phoneNumbers, setPhoneNumbers] = useState<
    { phone: string; id: number }[]
  >([])

  const [extraFields, setExtraFields] = useState<
    { id: number; name: string; value: string }[]
  >([])

  const setById = <T extends { id: number }>(
    setter: Dispatch<SetStateAction<T[]>>,
    prev: T,
    value: Partial<T>,
  ) => {
    setter((prevState) => {
      prevState.splice(
        prevState.findIndex(({ id }) => id === prev.id),
        1,
        { ...prev, ...value },
      )
      return [...prevState]
    })
  }

  return (
    <>
      <FormGroup name="origin" label="Origem do lead">
        {(removeErrors) => (
          <Input
            onChange={removeErrors}
            placeholder="Origem..."
            name="origin"
          />
        )}
      </FormGroup>

      <FormGroup name="date" label="Data">
        {(removeErrors) => (
          <Input onChange={removeErrors} name="date" type="date" />
        )}
      </FormGroup>

      <FormGroup name="name" label="Nome do cliente">
        {(removeErrors) => (
          <Input onChange={removeErrors} name="name" placeholder="Nome..." />
        )}
      </FormGroup>

      <FormGroup name="cpf" label="CPF">
        <Input
          name="cpf"
          placeholder="000.000.000-00"
          value={cpfField}
          onChange={(e) => setCpfField(cpf(e.target.value))}
        />
      </FormGroup>

      <FormGroup name="birthDate" label="Data de nascimento">
        {(removeErrors) => (
          <Input onChange={removeErrors} name="birthDate" type="date" />
        )}
      </FormGroup>

      <FormGroup name="area" label="Área">
        <Input name="area" placeholder="Área..." />
      </FormGroup>

      <FormGroup
        className="col-span-2 grid grid-cols-subgrid"
        name="phoneNumbers"
        label="Número(s) de telefone"
      >
        <input
          type="hidden"
          name="phoneNumbers"
          value={JSON.stringify(phoneNumbers.map((p) => ({ phone: p.phone })))}
        />
        {phoneNumbers.map((p) => (
          <span className="mb-1 flex justify-between gap-1" key={p.id}>
            <Input
              onChange={(e) =>
                setById(setPhoneNumbers, p, {
                  phone: phone(e.target.value),
                })
              }
              value={p.phone}
            />

            <Button
              type="button"
              variant="destructive"
              className="border border-red-300 bg-zinc-100 p-2 text-red-400 hover:text-red-200"
              onClick={() =>
                setPhoneNumbers((prev) => prev.filter(({ id }) => id !== p.id))
              }
            >
              <Trash2 />
            </Button>
          </span>
        ))}
        <Button
          onClick={() =>
            setPhoneNumbers((prev) => [
              ...prev,
              { phone: "", id: Math.random() },
            ])
          }
          variant="outline"
          className="mt-1 w-full"
          type="button"
        >
          <Plus /> Novo telefone
        </Button>
      </FormGroup>

      <FormGroup
        className="col-span-2 grid grid-cols-[1fr_1fr_auto] gap-x-2 gap-y-4"
        name="extraFields"
        label="Campos extra"
      >
        <input
          type="hidden"
          name="extraFields"
          value={JSON.stringify(
            extraFields.map((f) => ({ name: f.name, value: f.value })),
          )}
        />
        {extraFields.map((f, i) => (
          <FormGroup
            className="col-span-full grid grid-cols-subgrid"
            name="extraField"
            label={f.name}
            key={f.id}
          >
            <Input
              onChange={(e) =>
                setById(setExtraFields, f, { name: e.target.value })
              }
              value={f.name}
            />
            <Input
              onChange={(e) =>
                setById(setExtraFields, f, { value: e.target.value })
              }
              value={f.value}
            />
            <Button
              type="button"
              variant="destructive"
              className="border border-red-300 bg-zinc-100 p-2 text-red-400 hover:text-red-200"
              onClick={() =>
                setExtraFields((prev) => prev.filter(({ id }) => id !== f.id))
              }
            >
              <Trash2 />
            </Button>
          </FormGroup>
        ))}

        <Button
          onClick={() =>
            setExtraFields((prev) => [
              ...prev,
              { name: "Campo", value: "valor", id: Math.random() },
            ])
          }
          variant="outline"
          className="mt-1 w-full"
          type="button"
        >
          <Plus /> Novo campo
        </Button>
      </FormGroup>
    </>
  )
}

type NewLeadModalProps = {
  children: JSX.Element
}
function NewLeadModal({ children }: NewLeadModalProps) {
  const response = useActionData<typeof action>()

  let errors: ErrorT[] = []
  if (response && !response.result.ok) {
    errors = response.result.error
  }

  useEffect(() => {
    if (!response) return
    if (response.result.ok) {
      toast({ title: "Lead criado com sucesso!" })
    } else if (response.result.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível criar o lead :(",
        variant: "destructive",
      })
    }
  }, [response])

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content className="max-h-[75dvh] overflow-y-scroll [--dialog-content-max-width:42rem]">
        <Dialog.Title>Novo lead</Dialog.Title>

        <ErrorProvider initialErrors={errors}>
          <Form method="POST" className="grid grid-cols-2 gap-x-2 gap-y-4">
            <BaseLeadFormFields />

            <Dialog.Footer className="col-span-full mt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit">Criar</Button>
            </Dialog.Footer>
          </Form>
        </ErrorProvider>
      </Dialog.Content>
    </Dialog.Root>
  )
}
