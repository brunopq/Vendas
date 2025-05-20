import type { Route } from "./+types/route"
import { UTCDate } from "@date-fns/utc"
import { useFetcher } from "react-router"
import { Edit, EllipsisVertical, Plus, Trash2 } from "lucide-react"
import type { useActionData } from "react-router"
import { format, isSameMonth, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { utc } from "@date-fns/utc"
import { z, ZodError } from "zod"

import { months, monthSchema } from "~/constants/months"
import { yearSchema } from "~/constants/years"

import { brl } from "~/lib/formatters"
import { cn, maxWidth } from "~/lib/utils"
import { getAdminOrRedirect } from "~/lib/authGuard"
import { currencyToNumeric } from "~/lib/formatters"
import { error, ok, type Result } from "~/lib/result"

import CampaignService, {
  type UpdateCampaign,
  type DomainCampaign,
} from "~/services/CampaignService"

import { Button, DropdownMenu, Table } from "~/components/ui"

import type { ErrorT } from "~/context/ErrorsContext"

import { loader } from "./loader"
import { CopyCampaignsModal } from "./components/CopyCampaignsModal"
import { NewCampaignModal } from "./components/NewCampaignModal"
import { EditCampaignModal } from "./components/EditCampaignModal"

export { loader }

/*
  It would've been better to move the action function to it's own
  file, but that messes up with the server/client bundle splitting
  and the app does not work. :(
*/

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

export async function action({ request }: Route.ActionArgs) {
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

export default function Campaigns({ loaderData }: Route.ComponentProps) {
  const { campaigns } = loaderData

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
              <Plus className="size-5" /> Novo
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
            <Table.Head>Premiação</Table.Head>
            <Table.Head>Premiação individual</Table.Head>
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
