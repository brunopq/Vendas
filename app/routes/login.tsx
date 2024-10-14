import type {
  ActionFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import {
  Form,
  json,
  redirect,
  useActionData,
  useNavigation,
} from "@remix-run/react"
import { z } from "zod"

import { commitSession, getSession, getUser } from "~/session"

import AuthService from "~/services/AuthService"

import { Button, Input } from "~/components/ui"

export const meta: MetaFunction = () => [
  {
    title: "Login | Vendas Iboti",
  },
]

const formValidator = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
})

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request)

  if (user) {
    throw redirect("/app")
  }

  return null
}

export const action: ActionFunction = async ({ request }) => {
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
      <div className="max-w-[calc(100vw-1rem)] rounded bg-zinc-200 p-6 shadow-sm">
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
