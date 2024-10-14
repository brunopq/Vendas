import { useEffect } from "react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import {
  Form,
  json,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react"
import { z, ZodError } from "zod"

import { destroySession, getSession } from "~/session"
import { getUserOrRedirect } from "~/lib/authGuard"
import { typedError } from "~/lib/result"

import AuthService from "~/services/AuthService"

import { ErrorProvider } from "~/context/ErrorsContext"

import { toast } from "~/hooks/use-toast"

import { Button, Input } from "~/components/ui"
import FormGroup from "~/components/FormGroup"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUserOrRedirect(request)

  return user
}

const formSchema = z.object({
  oldPassword: z.string({ required_error: "Insira a senha antiga" }),
  newPassword: z.string({ required_error: "Insira a senha nova" }),
})

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request)
  const user = await getUserOrRedirect(request)

  try {
    const formData = await request.formData()

    const data: Record<string, unknown> = {}

    for (const [field, value] of formData) {
      if (value) {
        data[field] = String(value)
      }
    }

    const parsedForm = formSchema.parse(data)

    const passwordMatches = await AuthService.passwordMatches(
      user.id,
      parsedForm.oldPassword,
    )

    if (!passwordMatches) {
      return typedError([
        { type: "oldPassword", message: "Senha antiga incorreta" },
      ])
    }

    await AuthService.changePassword(user.id, parsedForm.newPassword)

    // TODO: extend Result module to accept headers and other request props
    // return typedOk(
    // { redirectTo: "/login" },
    // { headers: { "Set-Cookie": await destroySession(session) } },
    // )
    return json(
      { ok: true as true, redirectTo: "/login" },
      { headers: { "Set-Cookie": await destroySession(session) } },
    )
  } catch (e) {
    if (e instanceof ZodError) {
      const errors = e.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      return typedError(errors)
    }
  }
}

export default function TrocaSenha() {
  const user = useLoaderData<typeof loader>()
  const response = useActionData<typeof action>()
  const navigation = useNavigation()

  const hasError = !response?.ok
  const errors = (hasError && response?.error) || []
  const isSubmitting = navigation.state === "submitting"

  useEffect(() => {
    if (response?.ok) {
      toast({
        title: "Senha alterada com sucesso!",
        description: "Você terá que entrar novamente no aplicativo",
      })
    }
  }, [response])

  return (
    <div className="grid h-screen place-items-center bg-zinc-300">
      <div className="max-w-[calc(100vw-1rem)] rounded bg-zinc-200 p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-center font-semibold text-primary-800 text-xl">
            Trocar senha
          </h2>
          <span className="text-sm text-zinc-600">
            Usuário atual:{" "}
            <strong className="font-medium text-primary-600 ">
              {user.name}
            </strong>
          </span>
        </header>

        <ErrorProvider initialErrors={errors}>
          <Form method="post" className="flex flex-col gap-2">
            <FormGroup name="oldPassword" label="Senha atual">
              <Input name="oldPassword" type="password" />
            </FormGroup>
            <FormGroup name="newPassword" label="Senha nova">
              <Input name="newPassword" type="password" />
            </FormGroup>

            <Button disabled={isSubmitting} className="mt-2">
              Trocar senha
            </Button>
          </Form>
        </ErrorProvider>
      </div>
    </div>
  )
}
