import type { Route } from "./+types/trocasenha"
import { useEffect } from "react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { Form, data, useNavigation } from "react-router"
import { z, ZodError } from "zod"

import { destroySession, getSession } from "~/session"
import { getUserOrRedirect } from "~/lib/authGuard"
import { error, ok } from "~/lib/result"

import AuthService from "~/services/AuthService"

import { ErrorProvider } from "~/context/ErrorsContext"

import { toast } from "~/hooks/use-toast"

import { Button, Input } from "~/components/ui"
import FormGroup from "~/components/FormGroup"

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request)

  return user
}

const formSchema = z.object({
  oldPassword: z.string({ required_error: "Insira a senha antiga" }),
  newPassword: z.string({ required_error: "Insira a senha nova" }),
})

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request)
  const user = await getUserOrRedirect(request)

  try {
    const formData = await request.formData()

    const payload: Record<string, unknown> = {}

    for (const [field, value] of formData) {
      if (value) {
        payload[field] = String(value)
      }
    }

    const parsedForm = formSchema.parse(payload)

    const passwordMatches = await AuthService.passwordMatches(
      user.id,
      parsedForm.oldPassword,
    )

    if (!passwordMatches) {
      return error([{ type: "oldPassword", message: "Senha antiga incorreta" }])
    }

    await AuthService.changePassword(user.id, parsedForm.newPassword)

    return data(ok({ redirectTo: "/login" }), {
      headers: { "Set-Cookie": await destroySession(session) },
    })
  } catch (e) {
    if (e instanceof ZodError) {
      const errors = e.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      return error(errors)
    }
  }
}

export function headers({ actionHeaders, loaderHeaders }: Route.HeadersArgs) {
  return actionHeaders ? actionHeaders : loaderHeaders
}

export default function TrocaSenha({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const user = loaderData
  const response = actionData
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
