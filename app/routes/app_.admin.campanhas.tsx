import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import {
  Form,
  json,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react"
import { Edit, EllipsisVertical, Plus, Trash2 } from "lucide-react"
import React, { useEffect, useState } from "react"
import { format, intlFormat, isSameMonth, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { utc, UTCDate } from "@date-fns/utc"
import { z, ZodError } from "zod"

import { months, monthSchema } from "~/constants/months"

import type { DomainCampaign, UpdateCampaign } from "~/services/CampaignService"
import CampaignService from "~/services/CampaignService"

import { brl, currencyToNumber, currencyToNumeric } from "~/lib/formatters"
import { error, ok, type Result } from "~/lib/result"
import { getAdminOrRedirect } from "~/lib/authGuard"
import { cn, maxWidth } from "~/lib/utils"

import { toast } from "~/hooks/use-toast"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import type { loader as campaignLoader } from "~/routes/app.campaigns"

import FormGroup from "~/components/FormGroup"

import {
  BrlInput,
  Input,
  Button,
  DropdownMenu,
  Table,
  Dialog,
  Select,
} from "~/components/ui"
import { years, yearSchema } from "~/constants/years"

const campaignSchema = z.object({
  name: z.string({ required_error: "Insira um nome para a campanha" }),
  goal: z.coerce
    .number({ required_error: "Insira uma quantidade" })
    .positive("A quantidade deve ser maior que 0"),
  prize: z
    .string({ required_error: "Insira um valor para a meta" })
    .regex(/^\d+(\.\d{1,2})?$/, "O valor deve estar no formato correto"),
  individualPrize: z
    .string({ required_error: "Insira um valor para a meta individual" })
    .regex(/^\d+(\.\d{1,2})?$/, "O valor deve estar no formato correto"),
  month: monthSchema({
    required_error: "Insira um mês",
    invalid_type_error: "Mês inválido",
  }),
  year: yearSchema({
    required_error: "Selecione o ano",
    invalid_type_error: "Ano inválido",
  }),
})

async function handleNewCampaign(data: Record<string, unknown>) {
  if (data.prize) {
    data.prize = currencyToNumeric(String(data.prize))
  }
  if (data.individualPrize) {
    data.individualPrize = currencyToNumeric(String(data.individualPrize))
  }
  if (data.year) {
    data.year = Number(data.year)
  }

  const parsed = campaignSchema.parse(data)

  return await CampaignService.create({
    ...parsed,
    month: new Date(
      parsed.year,
      months.findIndex((m) => m === parsed.month),
      1,
    ).toDateString(),
  })
}

const updateCampaignFormSchema = campaignSchema.extend({
  id: z.string(),
})

async function handleUpdateCampaign(data: Record<string, unknown>) {
  if (data.prize) {
    data.prize = currencyToNumeric(String(data.prize))
  }
  if (data.individualPrize) {
    data.individualPrize = currencyToNumeric(String(data.individualPrize))
  }
  if (data.year) {
    data.year = Number(data.year)
  }

  const parsed = updateCampaignFormSchema.parse(data)

  const updateCampaign: UpdateCampaign = {
    goal: parsed.goal,
    name: parsed.name,
    prize: parsed.prize,
    individualPrize: parsed.individualPrize,
  }

  if (parsed.month && parsed.year) {
    updateCampaign.month = new Date(
      parsed.year,
      months.findIndex((m) => m === parsed.month),
      1,
    ).toDateString()
  }

  return await CampaignService.update(parsed.id, updateCampaign)
}

const copyCampaignsSchema = z.object({
  originMonth: z.coerce.number({
    invalid_type_error: "Mês de origem deve ser um número",
    required_error: "Forneça o mês de origem",
  }),
  originYear: z.coerce.number({
    invalid_type_error: "Ano de origem deve ser um número",
    required_error: "Forneça o ano de origem",
  }),
  destinationMonth: z.coerce.number({
    invalid_type_error: "Mês de destino deve ser um número",
    required_error: "Forneça o mês de destino",
  }),
  destinationYear: z.coerce.number({
    invalid_type_error: "Ano de destino deve ser um número",
    required_error: "Forneça o ano de destino",
  }),
})

async function handleCopyCampaigns(data: Record<string, unknown>) {
  const parsed = copyCampaignsSchema.parse(data)

  const campaigns = await CampaignService.getByMonth(
    parsed.originMonth + 1,
    parsed.originYear,
  )

  const newCampaigns = await CampaignService.createMany(
    campaigns.map((c) => ({
      ...c,
      id: undefined,
      month: new UTCDate(
        parsed.destinationYear,
        parsed.destinationMonth,
      ).toDateString(),
    })),
  )

  return newCampaigns
}

async function handleDeleteCampaign(data: Record<string, unknown>) {
  const { id } = data
  if (!id) return

  await CampaignService.delete(String(id))
}

async function handle<const M, const T, Res>(
  method: M,
  type: T,
  fn: () => Promise<Res>,
) {
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

  return { method, type, result }
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

  if (request.method === "DELETE" && data.actionType === "campaign") {
    return handle("DELETE", "campaign", () => handleDeleteCampaign(data))
  }
  if (request.method === "POST" && data.actionType === "campaign") {
    return handle("POST", "campaign", () => handleNewCampaign(data))
  }
  if (request.method === "POST" && data.actionType === "copy_campaigns") {
    return handle("POST", "copy_campaigns", () => handleCopyCampaigns(data))
  }
  if (request.method === "PUT" && data.actionType === "campaign") {
    return handle("PUT", "campaign", () => handleUpdateCampaign(data))
  }
  console.log("method not implemented")

  return {
    method: request.method,
    type: data.actionType,
    result: error([
      {
        type: "not implemented",
        message: `method: ${request.method}, type: ${data.actionType} is not implemented`,
      },
    ]),
  }
}

export function getResult<
  R extends ReturnType<typeof useActionData<typeof action>>,
  const M = R extends { method: infer M } ? M : never,
  const T = R extends { type: infer T } ? T : never,
>(
  response: R,
  method: M,
  type: T,
):
  | (R extends { method: M; type: T; result: infer Res } ? Res : never)
  | undefined {
  if (!response) {
    return undefined
  }

  if (response.method === method && response.type === type) {
    return response.result as R extends {
      method: M
      type: T
      result: infer Res
    }
      ? Res
      : never
  }
  return undefined
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminOrRedirect(request)

  const campaigns = await CampaignService.index()

  return json({ campaigns })
}

export default function Campaigns() {
  const { campaigns } = useLoaderData<typeof loader>()

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Campanhas e metas</h2>

        <div className="flex items-center justify-between gap-2">
          <CopyCampaignsModal>
            <Button variant="ghost">Copiar campanhas</Button>
          </CopyCampaignsModal>
          <NewCampaignModal>
            <Button icon="left" className="text-sm">
              <Plus /> Novo
            </Button>
          </NewCampaignModal>
        </div>
      </header>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Nome</Table.Head>
            <Table.Head>Mês</Table.Head>
            <Table.Head>Meta de vendas</Table.Head>
            <Table.Head>Comissão</Table.Head>
            <Table.Head>Comissão individual</Table.Head>
            <Table.Head className="w-0">{/*dropdown*/}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {campaigns.map((c) => (
            <Table.Row
              className={cn({
                "text-zinc-600/80": !isSameMonth(c.month, new Date(), {
                  in: utc,
                }),
              })}
              key={c.id}
            >
              <Table.Cell>{c.name}</Table.Cell>
              <Table.Cell>
                {format(
                  parse(c.month, "yyyy-MM-dd", new Date()),
                  "MMMM, yyyy",
                  { locale: ptBR },
                )}
              </Table.Cell>
              <Table.Cell>{c.goal}</Table.Cell>
              <Table.Cell>{brl(c.prize)}</Table.Cell>
              <Table.Cell>{brl(c.individualPrize)}</Table.Cell>
              <Table.Cell className="w-0">
                <CampaignDropdown campaign={c} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </section>
  )
}

type CampaignDropdownProps = {
  campaign: DomainCampaign
}

function CampaignDropdown({ campaign }: CampaignDropdownProps) {
  const fetcher = useFetcher({})

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" className="p-1">
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <EditCampaignModal campaign={campaign}>
          <DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
            <Edit className="size-5" />
            Editar
          </DropdownMenu.Item>
        </EditCampaignModal>
        <DropdownMenu.Item
          onClick={() =>
            fetcher.submit(
              { actionType: "campaign", id: campaign.id },
              { method: "delete" },
            )
          }
          variant="danger"
        >
          <Trash2 className="size-5" />
          Excluir
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}

type CampaiginFormFieldsProps = {
  campaign?: Partial<DomainCampaign>
}

function CampaiginFormFields({ campaign }: CampaiginFormFieldsProps) {
  const [goal, setGoal] = useState<number>(campaign?.goal ?? 0)
  const [prize, setPrize] = useState<number>(
    campaign?.prize ? currencyToNumber(campaign.prize) : 0,
  )
  const [individualPrize, setIndividualPrize] = useState<number>(
    campaign?.individualPrize ? currencyToNumber(campaign.individualPrize) : 0,
  )

  return (
    <>
      <FormGroup name="name" label="Nome da campanha">
        {(removeError) => (
          <Input
            defaultValue={campaign?.name}
            onInput={removeError}
            name="name"
            placeholder="Categoria..."
          />
        )}
      </FormGroup>

      <div className="grid grid-cols-2 gap-4">
        <FormGroup name="month" label="Mês de vigência">
          {(removeErrors) => (
            <Select.Root
              defaultValue={
                campaign?.month &&
                months[new Date(campaign.month).getUTCMonth()]
              }
              onValueChange={removeErrors}
              name="month"
            >
              <Select.Trigger>
                <Select.Value placeholder="Selecione" />
              </Select.Trigger>
              <Select.Content>
                {months.map((m) => (
                  <Select.Item value={m} key={m}>
                    {m}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        </FormGroup>

        <FormGroup name="year" label="Ano de vigência">
          {(removeErrors) => (
            <Select.Root
              defaultValue={
                campaign?.month &&
                new Date(campaign.month).getUTCFullYear().toString()
              }
              onValueChange={removeErrors}
              name="year"
            >
              <Select.Trigger>
                <Select.Value placeholder="Selecione" />
              </Select.Trigger>
              <Select.Content>
                {years.map((a) => (
                  <Select.Item value={a.toString()} key={a}>
                    {a}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        </FormGroup>
      </div>

      <FormGroup name="goal" label="Meta principal">
        {(removeError) => (
          <Input
            onInput={(e) => {
              removeError()
              if (!Number.isNaN(e.currentTarget.valueAsNumber)) {
                setGoal(e.currentTarget.valueAsNumber)
              }
            }}
            value={goal}
            name="goal"
            placeholder="Meta..."
            type="number"
            min={0}
          />
        )}
      </FormGroup>

      <div className="grid grid-cols-2 gap-4">
        <FormGroup name="prize" label="Comissão">
          {(removeError) => (
            <BrlInput
              onInput={(e) => {
                removeError()
                setPrize(currencyToNumber(e.currentTarget.value))
              }}
              defaultValue={brl(prize)}
              name="prize"
            />
          )}
        </FormGroup>

        <FormGroup name="individualPrize" label="Comissão individual">
          {(removeError) => (
            <BrlInput
              onInput={(e) => {
                removeError()
                setIndividualPrize(currencyToNumber(e.currentTarget.value))
              }}
              defaultValue={brl(individualPrize)}
              name="individualPrize"
            />
          )}
        </FormGroup>
      </div>

      <div className="mt-2 grid grid-cols-[repeat(4,_auto)] text-sm">
        <strong className="col-span-full mb-1 text-base">Metas: </strong>

        <span />

        <span>
          {Intl.NumberFormat("pt-br", { style: "percent" }).format(0.5)}
        </span>
        <span>
          {Intl.NumberFormat("pt-br", { style: "percent" }).format(0.75)}
        </span>
        <span>
          {Intl.NumberFormat("pt-br", { style: "percent" }).format(1)}
        </span>

        <hr className="-col-end-1 col-start-2 my-0.5 border-zinc-300" />

        <span className="text-zinc-600">Vendas totais</span>
        <span>{Math.round(goal * 0.5)}</span>
        <span>{Math.round(goal * 0.75)}</span>
        <span>{Math.round(goal * 1)}</span>

        <span className="text-zinc-600">Comissão geral</span>
        <span>{brl(prize * 0.5)}</span>
        <span>{brl(prize * 0.75)}</span>
        <span>{brl(prize * 1)}</span>

        <span className="text-zinc-600">Vendas usuário</span>
        <span>{Math.floor(goal * 0.5 * 0.1)}</span>
        <span>{Math.floor(goal * 0.75 * 0.1)}</span>
        <span>{Math.floor(goal * 1 * 0.1)}</span>

        <span className="text-zinc-600">Comissão individual</span>
        <span>{brl(individualPrize * Math.floor(goal * 0.5 * 0.1))}</span>
        <span>{brl(individualPrize * Math.floor(goal * 0.75 * 0.1))}</span>
        <span>{brl(individualPrize * Math.floor(goal * 1 * 0.1))}</span>
      </div>
    </>
  )
}

type EditCampaignModalProps = {
  children: JSX.Element
  campaign: DomainCampaign
}

function EditCampaignModal({ children, campaign }: EditCampaignModalProps) {
  const fetcher = useFetcher<typeof action>({ key: React.useId() })
  const actionResponse = fetcher.data

  const putCampaignResponse = getResult(actionResponse, "PUT", "campaign")

  let errors: ErrorT[] = []
  if (putCampaignResponse && !putCampaignResponse.ok) {
    errors = putCampaignResponse.error
  }

  useEffect(() => {
    if (!putCampaignResponse) return
    if (putCampaignResponse.ok) {
      toast({ title: "Campanha editada!" })
      console.log(putCampaignResponse.value)
    } else if (putCampaignResponse.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível editar a campanha :(",
        variant: "destructive",
      })
    }
  }, [putCampaignResponse])

  console.log(errors)

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Title>
          Editar campanha{" "}
          <strong className="font-semibold text-primary-600">
            {campaign.name}
          </strong>
        </Dialog.Title>

        <fetcher.Form method="PUT" className="flex flex-col gap-4">
          <ErrorProvider initialErrors={errors}>
            <input type="hidden" name="actionType" value="campaign" />
            <input type="hidden" name="id" value={campaign.id} />
            <CampaiginFormFields campaign={campaign} />

            <Dialog.Footer className="mt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit">Salvar alterações</Button>
            </Dialog.Footer>
          </ErrorProvider>
        </fetcher.Form>
      </Dialog.Content>
    </Dialog.Root>
  )
}

type MonthAndYear = {
  month: (typeof months)[number] | null
  year: number | null
}
function CopyCampaignsModal({ children }: { children: JSX.Element }) {
  const actionData = useActionData<typeof action>()
  const copyResopnse = getResult(actionData, "POST", "copy_campaigns")

  const originCampaignsFetcher = useFetcher<typeof campaignLoader>()
  const destinationCampaignsFetcher = useFetcher<typeof campaignLoader>()
  const [origin, setOrigin] = useState<MonthAndYear>({
    month: null,
    year: null,
  })
  const [destination, setDestination] = useState<MonthAndYear>({
    month: null,
    year: null,
  })

  let originCampaignsCount = 0
  let destinationCampaignsCount = 0

  if (originCampaignsFetcher.data) {
    originCampaignsCount = originCampaignsFetcher.data.campaigns.length
  }

  if (destinationCampaignsFetcher.data) {
    destinationCampaignsCount =
      destinationCampaignsFetcher.data.campaigns.length
  }

  const handleSetOrigin = (newOrigin: MonthAndYear) => {
    setOrigin(newOrigin)

    if (newOrigin.month && newOrigin.year) {
      originCampaignsFetcher.submit(
        {
          date: format(
            new Date(
              newOrigin.year,
              months.findIndex((m) => m === newOrigin.month),
            ),
            "yyyy-MM-dd",
            { in: utc },
          ),
        },
        { method: "GET", action: "/app/campaigns" },
      )
    }
  }

  useEffect(() => {
    if (!copyResopnse) return

    if (copyResopnse.ok) {
      toast({
        title: "Categorias copiadas!",
        // TODO: add from month and to month
      })
    } else if (copyResopnse.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível copiar as campanhas",
        variant: "destructive",
      })
    }
  }, [copyResopnse])

  const handleSetDestination = (newDestination: MonthAndYear) => {
    setDestination(newDestination)

    if (newDestination.month && newDestination.year) {
      destinationCampaignsFetcher.submit(
        {
          date: format(
            new Date(
              newDestination.year,
              months.findIndex((m) => m === newDestination.month),
            ),
            "yyyy-MM-dd",
            { in: utc },
          ),
        },
        { method: "GET", action: "/app/campaigns" },
      )
    }
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Header>
          <Dialog.Title>Copiar campanhas</Dialog.Title>
          <Dialog.Description>
            Copie todas as campanhas de um mês para o outro, sem precisar
            criá-las manualmente
          </Dialog.Description>
        </Dialog.Header>

        <Form method="POST">
          <input type="hidden" name="actionType" value="copy_campaigns" />
          <div className="grid gap-x-2 gap-y-4 sm:grid-cols-[1fr_1fr_auto]">
            <div className="col-span-full grid grid-cols-subgrid items-end gap-y-1">
              <span className="col-span-full">Origem:</span>
              <FormGroup name="originMonth" label="Mês">
                {(removeErrors) => (
                  <Select.Root
                    name="originMonth"
                    onValueChange={(m) => {
                      removeErrors()
                      handleSetOrigin({
                        month: months[Number(m)],
                        year: origin.year,
                      })
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione..." />
                    </Select.Trigger>
                    <Select.Content>
                      {months.map((m, i) => (
                        <Select.Item value={i.toString()} key={m}>
                          {m}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              </FormGroup>

              <FormGroup name="originYear" label="Ano">
                {(removeErrors) => (
                  <Select.Root
                    name="originYear"
                    onValueChange={(y) => {
                      removeErrors()
                      handleSetOrigin({ month: origin.month, year: Number(y) })
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione..." />
                    </Select.Trigger>

                    <Select.Content>
                      {years.map((y) => (
                        <Select.Item value={y.toString()} key={y}>
                          {y}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              </FormGroup>

              <span>{originCampaignsCount} campanhas</span>
            </div>

            <div className="col-span-full grid grid-cols-subgrid items-end gap-y-1">
              <span className="col-span-full">Destino:</span>
              <FormGroup name="destinationMonth" label="Mês">
                {(removeErrors) => (
                  <Select.Root
                    name="destinationMonth"
                    onValueChange={(m) => {
                      removeErrors()
                      handleSetDestination({
                        month: months[Number(m)],
                        year: destination.year,
                      })
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione..." />
                    </Select.Trigger>
                    <Select.Content>
                      {months.map((m, i) => (
                        <Select.Item value={i.toString()} key={m}>
                          {m}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              </FormGroup>

              <FormGroup name="destinationYear" label="Ano">
                {(removeErrors) => (
                  <Select.Root
                    name="destinationYear"
                    onValueChange={(y) => {
                      removeErrors()
                      handleSetDestination({
                        month: destination.month,
                        year: Number(y),
                      })
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione..." />
                    </Select.Trigger>

                    <Select.Content>
                      {years.map((y) => (
                        <Select.Item value={y.toString()} key={y}>
                          {y}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              </FormGroup>

              <span>{destinationCampaignsCount} campanhas</span>
            </div>
          </div>

          <Dialog.Footer className="mt-8">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit">Copiar</Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function NewCampaignModal({ children }: { children: JSX.Element }) {
  const response = useActionData<typeof action>()

  const newCampaignAction = getResult(response, "POST", "campaign")

  let errors: ErrorT[] = []
  if (newCampaignAction && !newCampaignAction.ok) {
    errors = newCampaignAction.error
  }

  useEffect(() => {
    if (!newCampaignAction) return
    if (newCampaignAction.ok) {
      toast({ title: "Campanha registrada com sucesso!" })
    } else if (newCampaignAction.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível registrar nova campanha :(",
        variant: "destructive",
      })
    }
  }, [newCampaignAction])

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Title>Nova campanha</Dialog.Title>

        <ErrorProvider initialErrors={errors}>
          <Form method="post" className="flex flex-col gap-4">
            <input type="hidden" name="actionType" value="campaign" />

            <CampaiginFormFields />

            <Dialog.Footer className="mt-4">
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
