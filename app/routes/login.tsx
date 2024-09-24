import type { ActionFunction } from "@remix-run/node"
import {
  Form,
  json,
  redirect,
  useActionData,
  useNavigation,
  useRouteError,
} from "@remix-run/react"
import { z } from "zod"

import { commitSession, getSession } from "~/session"

import AuthService from "~/services/AuthService"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"

const formValidator = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
})

export const action: ActionFunction = async ({ request }) => {
  try {
    const session = await getSession(request.headers.get("Cookie"))

    if (session.data.user) {
      return redirect("/app")
    }

    const rawForm = Object.fromEntries(await request.formData())

    const userInfo = formValidator.parse(rawForm)

    const login = await AuthService.login(userInfo)

    session.set("user", login)

    return redirect("/app", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    })
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return json({ error: true })
  }
}

export default function Login() {
  const response = useActionData<typeof action>()
  const navigation = useNavigation()

  const hasError = response?.error === true
  const isSubmitting = navigation.state === "submitting"

  return (
    <div className="grid h-screen place-items-center bg-zinc-300">
      <div className="max-w-[calc(100vw-2rem)] rounded bg-zinc-200 p-8 shadow-sm ">
        <h2 className="mb-4 font-semibold text-primary-800 text-xl">Login</h2>

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
