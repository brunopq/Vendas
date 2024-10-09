import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import { z, ZodError } from "zod"

import { userRoleSchmea } from "~/db/schema"

import AuthService from "~/services/AuthService"
import CampaignService from "~/services/CampaignService"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { currencyToNumeric } from "~/lib/formatters"
import { typedError, typedOk } from "~/lib/result"
import { maxWidth } from "~/lib/utils"

import { UsersSection } from "./UsersSection"
import { CampaignsSection } from "./CampaignsSection"

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

const campaignSchema = z.object({
  name: z.string({ required_error: "Insira um nome para a campanha" }),
  goal: z.coerce
    .number({ required_error: "Insira uma quantidade" })
    .positive("A quantidade deve ser maior que 0"),
  prize: z
    .string({ required_error: "Insira um valor para a meta" })
    .regex(/^\d+(\.\d{1,2})?$/, "O valor deve estar no formato correto"),
})

async function handleNewUser(data: Record<string, unknown>) {
  if (data.role === "on") {
    data.role = "ADMIN"
  } else {
    data.role = "SELLER"
  }

  const parsed = userSchema.parse(data)

  return typedOk(await AuthService.create(parsed))
}

async function handleNewCampaign(data: Record<string, unknown>) {
  if (data.prize) {
    data.prize = currencyToNumeric(String(data.prize))
  }

  const parsed = campaignSchema.parse(data)

  return typedOk(await CampaignService.create(parsed))
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "DELETE") {
    const form = await request.formData()
    const type = form.get("type")
    const id = form.get("id")

    if (!type || (type !== "campaign" && type !== "user")) {
      return typedOk({})
    }
    if (!id) {
      return typedOk({})
    }

    if (type === "user") {
      await AuthService.delete(String(id))
    }
    if (type === "campaign") {
      await CampaignService.delete(String(id))
    }

    return typedOk({})
  }
  try {
    await getAdminOrRedirect(request)

    const formData = await request.formData()

    const data: Record<string, unknown> = {}

    for (const [field, value] of formData) {
      if (value) {
        data[field] = String(value)
      }
    }

    if (data.actionType === "user") {
      return await handleNewUser(data)
    }
    if (data.actionType === "campaign") {
      return await handleNewCampaign(data)
    }

    throw new Error("Invalid form type")
  } catch (e) {
    if (e instanceof ZodError) {
      const errors = e.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      return typedError(errors)
    }

    return typedError([{ type: "backend", message: "unknown backend error" }])
  }
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
    </>
  )
}
