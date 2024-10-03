import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node"
import { z, ZodError } from "zod"

import { userRoleSchmea } from "~/db/schema"

import AuthService from "~/services/AuthService"
import SaleAreaService from "~/services/SaleAreaService"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { currencyToNumeric } from "~/lib/formatters"
import { typedError, typedOk } from "~/lib/result"
import { maxWidth } from "~/lib/utils"

import { UsersSection } from "./UsersSection"
import { SellTypesSection } from "./SellTypesSection"

const userSchema = z.object({
  name: z.string({ required_error: "Insira o nome do usuário" }),
  password: z.string({ required_error: "Insira uma senha para o usuário" }),
  role: userRoleSchmea({ invalid_type_error: "Tipo de usuário inválido" }),
})

const sellTypeSchema = z.object({
  category: z.string({ required_error: "Insira um nome para a categoria" }),
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

async function handleNewSellType(data: Record<string, unknown>) {
  if (data.prize) {
    data.prize = currencyToNumeric(String(data.prize))
  }

  const parsed = sellTypeSchema.parse(data)

  return typedOk(
    await SaleAreaService.create({ ...parsed, name: parsed.category }),
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "DELETE") {
    const form = await request.formData()
    const type = form.get("type")
    const id = form.get("id")

    if (!type || (type !== "area" && type !== "user")) {
      return typedOk({})
    }
    if (!id) {
      return typedOk({})
    }

    if (type === "user") {
      await AuthService.delete(String(id))
    }
    if (type === "area") {
      await SaleAreaService.delete(String(id))
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
    if (data.actionType === "sellType") {
      return await handleNewSellType(data)
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
  const sellTypes = await SaleAreaService.index()

  return json({ users, sellTypes })
}

export default function Admin() {
  return (
    <>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-4")}>
        <strong className="font-semibold text-lg">Admin</strong>
      </nav>
      <hr className="border-primary-300" />

      <UsersSection />

      <SellTypesSection />
    </>
  )
}
