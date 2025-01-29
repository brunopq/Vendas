import type { Route } from "./+types/app.venda"
import type { MetaFunction } from "react-router"
import { Form, Link } from "react-router"
import { ArrowLeft } from "lucide-react"
import { useEffect } from "react"

import SalesService, { type DomainSale } from "~/services/SalesService"

import { type Result, ok, error } from "~/lib/result"
import { currencyToNumeric } from "~/lib/formatters"
import { getUserOrRedirect } from "~/lib/authGuard"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import { toast } from "~/hooks/use-toast"

import { Button } from "~/components/ui"

import SaleFormFields, { saleFormSchema } from "~/components/SaleFormFields"

export const meta: MetaFunction = () => [
  {
    title: "Nova venda",
  },
]

type ActionResponse = Result<DomainSale, ErrorT[]>
export async function action({
  request,
}: Route.ActionArgs): Promise<ActionResponse> {
  try {
    const user = await getUserOrRedirect(request)

    const formData = await request.formData()

    const data: Record<string, unknown> = {}

    for (const [field, value] of formData) {
      if (value) {
        data[field] = String(value)
      }
    }

    data.seller = user.id

    if (data.isRepurchase === "on") {
      data.isRepurchase = true
    } else {
      data.isRepurchase = false
    }

    if (data.estimatedValue) {
      data.estimatedValue = currencyToNumeric(
        typeof data.estimatedValue === "string" ? data.estimatedValue : "",
      )
    }

    const parsed = saleFormSchema.safeParse(data)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      return error(errors)
    }

    return ok(await SalesService.create(parsed.data))
  } catch (e) {
    return error([{ type: "backend", message: "unknown backend error" }])
  }
}

export default function Venda({ actionData }: Route.ComponentProps) {
  const response = actionData

  let errors: ErrorT[] = []
  if (response && !response.ok) {
    errors = response.error
  }

  useEffect(() => {
    if (!response) return
    if (response.ok) {
      toast({ title: "Venda registrada com sucesso!" })
    } else if (response.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível registrar a venda :(",
        variant: "destructive",
      })
    }
  }, [response])

  return (
    <ErrorProvider initialErrors={errors}>
      <header className="mb-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/app">
            <ArrowLeft />
          </Link>
        </Button>

        <h2 className="font-medium text-2xl">Nova venda</h2>
      </header>

      <Form method="post" className="mt-8 grid gap-x-4 gap-y-6 sm:grid-cols-4">
        <SaleFormFields />

        <Button size="lg" className="mt-2 h-fit w-fit">
          Criar venda
        </Button>
      </Form>
    </ErrorProvider>
  )
}
