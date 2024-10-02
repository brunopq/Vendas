import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node"
import { z } from "zod"

import { userRoleSchmea } from "~/db/schema"

import AuthService from "~/services/AuthService"
import SaleAreaService from "~/services/SaleAreaService"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { typedError, typedOk } from "~/lib/result"
import { maxWidth } from "~/lib/utils"

import { UsersSection } from "./UsersSection"
import { SellTypesSection } from "./SellTypesSection"

const formSchema = z.object({
  name: z.string({ required_error: "Insira o nome do usuário" }),
  password: z.string({ required_error: "Insira uma senha para o usuário" }),
  role: userRoleSchmea({ invalid_type_error: "Tipo de usuário inválido" }),
})

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    await getAdminOrRedirect(request)

    const formData = await request.formData()

    const data: Record<string, unknown> = {}

    for (const [field, value] of formData) {
      if (value) {
        data[field] = String(value)
      }
    }

    if (data.role === "on") {
      data.role = "ADMIN"
    } else {
      data.role = "SELLER"
    }

    const parsed = formSchema.safeParse(data)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      return typedError(errors)
    }

    return typedOk(await AuthService.create(parsed.data))
  } catch (e) {
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
