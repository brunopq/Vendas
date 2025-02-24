import type { Route } from "./+types/login"
import type { MetaFunction } from "react-router"
import { Form, redirect, useNavigation } from "react-router"
import { z } from "zod"

import { commitSession, getSession } from "~/session"

import AuthService from "~/services/AuthService"

import { Button, Input } from "~/components/ui"
import { getUserOrRedirect } from "~/lib/authGuard"

export const meta: MetaFunction = () => [{ title: "Login | Vendas Iboti" }]

const formValidator = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
})

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request, { noredirect: true })

  if (user) {
    throw redirect("/app")
  }

  return null
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const session = await getSession(request)

    const rawForm = Object.fromEntries(await request.formData())

    const userInfo = formValidator.parse(rawForm)

    const login = await AuthService.login(userInfo)

    session.set("user", login)

    return redirect("/app", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    })
  } catch (e) {
    return { error: true }
  }
}

export default function Login({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation()

  const hasError = actionData?.error === true
  const isSubmitting = navigation.state === "submitting"

  return (
    <div className="grid h-screen place-items-center bg-zinc-300">
      <div className="max-w-[calc(100vw-1rem)] rounded bg-zinc-200 p-6 shadow-sm">
        <img
          src="logo.png"
          alt="logo iboti"
          className="-translate-x-1/2 pointer-events-none absolute top-8 left-1/2 h-auto w-64"
        />

        <h2 className="mb-6 text-center font-semibold text-primary-800 text-xl">
          Login
        </h2>

        <Form method="post" className="flex flex-col gap-2">
          <Input name="name" placeholder="Usuário" />
          <Input name="password" type="password" placeholder="Senha" />

          {hasError && <span className="text-red-600 text-sm">Erro!</span>}

          <Button disabled={isSubmitting} className="mt-2">
            Login
          </Button>
        </Form>
      </div>
    </div>
  )
}
