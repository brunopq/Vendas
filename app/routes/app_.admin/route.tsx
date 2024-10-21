import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import { z, ZodError } from "zod"
import type { useActionData } from "@remix-run/react"

import { userRoleSchmea } from "~/db/schema"

import AuthService from "~/services/AuthService"
import CampaignService from "~/services/CampaignService"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { currencyToNumeric } from "~/lib/formatters"
import { error, ok, type Result, typedError } from "~/lib/result"
import { maxWidth } from "~/lib/utils"

import type { ErrorT } from "~/context/ErrorsContext"

import { UsersSection } from "./UsersSection"
import { CampaignsSection } from "./CampaignsSection"
import { months, monthSchema } from "~/constants/months"

export const meta: MetaFunction = () => [
  {
    title: "Admin | Vendas Iboti",
  },
]

const userSchema = z.object({
  name: z.string({ required_error: "Insira o nome do usuário" }),
  password: z.string({ required_error: "Insira uma senha para o usuário" }),
  role: userRoleSchmea({ invalid_type_error: "Tipo de usuário inválido" }),
})
const updateUserSchema = userSchema.partial().extend({
  id: z.string(),
})

const campaignSchema = z.object({
  name: z.string({ required_error: "Insira um nome para a campanha" }),
  goal: z.coerce
    .number({ required_error: "Insira uma quantidade" })
    .positive("A quantidade deve ser maior que 0"),
  prize: z
    .string({ required_error: "Insira um valor para a meta" })
    .regex(/^\d+(\.\d{1,2})?$/, "O valor deve estar no formato correto"),
  month: monthSchema({
    required_error: "Insira um mês",
    invalid_type_error: "Mês inválido",
  }),
  year: z.literal(2024, {
    required_error: "Selecione o ano",
    invalid_type_error: "Ano inválido",
  }),
})

async function handleNewUser(data: Record<string, unknown>) {
  if (data.role === "on") {
    data.role = "ADMIN"
  } else {
    data.role = "SELLER"
  }

  const parsed = userSchema.parse(data)

  return await AuthService.create(parsed)
}

async function handleUpdateUser(data: Record<string, unknown>) {
  if (data.role === "on") {
    data.role = "ADMIN"
  } else {
    data.role = "SELLER"
  }

  const parsed = updateUserSchema.parse(data)

  if (parsed.password) {
    await AuthService.changePassword(parsed.id, parsed.password)
  }

  return await AuthService.updateUser(parsed.id, parsed)
}

async function handleNewCampaign(data: Record<string, unknown>) {
  if (data.prize) {
    data.prize = currencyToNumeric(String(data.prize))
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
      month: new Date(
        Date.UTC(parsed.destinationYear, parsed.destinationMonth + 1),
      ).toDateString(),
    })),
  )

  return newCampaigns
}

async function handleDeleteUser(data: Record<string, unknown>) {
  const { id } = data
  if (!id) return

  await AuthService.delete(String(id))
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

  if (request.method === "DELETE" && data.actionType === "user") {
    return handle("DELETE", "user", () => handleDeleteUser(data))
  }
  if (request.method === "DELETE" && data.actionType === "campaign") {
    return handle("DELETE", "campaign", () => handleDeleteCampaign(data))
  }
  if (request.method === "POST" && data.actionType === "user") {
    return handle("POST", "user", () => handleNewUser(data))
  }
  if (request.method === "POST" && data.actionType === "campaign") {
    return handle("POST", "campaign", () => handleNewCampaign(data))
  }
  if (request.method === "POST" && data.actionType === "copy_campaigns") {
    return handle("POST", "copy_campaigns", () => handleCopyCampaigns(data))
  }
  if (request.method === "PUT" && data.actionType === "user") {
    return handle("PUT", "user", () => handleUpdateUser(data))
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
  // case { method: "PUT", type: "campaign" }:
  //   return typedOk({
  //     method: "PUT" as const,
  //     type: "campaign" as const,
  //     response: await handleUpdateCampaign(data),
  //   })
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

  const users = await AuthService.index()
  const campaigns = await CampaignService.index()

  return json({ users, campaigns })
}

export default function Admin() {
  return (
    <>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-4")}>
        <strong className="font-semibold text-lg">Admin</strong>
      </nav>
      <hr className="border-primary-300" />

      <UsersSection />

      <CampaignsSection />

      <footer className="mt-16 py-16" />
    </>
  )
}
