import type { Route } from "./+types/app.venda_.$id"
import { useEffect } from "react"
import { Form, Link, redirect } from "react-router"
import { ArrowLeft } from "lucide-react"
import { ZodError } from "zod"

import { getUserOrRedirect } from "~/lib/authGuard"
import { currencyToNumeric } from "~/lib/formatters"
import { error, ok } from "~/lib/result"

import SalesService from "~/services/SalesService"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import { toast } from "~/hooks/use-toast"

import { Button } from "~/components/ui"

import SaleFormFields, { saleFormSchema } from "~/components/SaleFormFields"

export async function loader({ request, params }: Route.LoaderArgs) {
  await getUserOrRedirect(request)

  const saleId = params.id

  const sale = await SalesService.getById(saleId)

  if (!sale) {
    throw redirect("/app")
  }

  return sale
}

const editSaleFormSchema = saleFormSchema.omit({ seller: true })

export async function action({ request, params }: Route.ActionArgs) {
  await getUserOrRedirect(request)

  const saleId = params.id

  const formData = await request.formData()

  const data: Record<string, unknown> = {}

  for (const [field, value] of formData) {
    if (value) {
      data[field] = String(value)
    }
  }

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

  try {
    const parsed = editSaleFormSchema.parse(data)

    const updated = await SalesService.update(saleId, parsed)

    return ok(updated)
  } catch (e) {
    if (e instanceof ZodError) {
      const errors = e.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      return error(errors)
    }

    return error([{ type: "backend", message: "unknown backend error" }])
  }
}

export default function Venda({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const sale = loaderData
  const response = actionData

  let errors: ErrorT[] = []
  if (response && !response.ok) {
    errors = response.error
  }

  useEffect(() => {
    if (!response) return
    if (response.ok) {
      toast({ title: "Venda editada com sucesso!" })
    } else if (response.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível editar a venda :(",
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

        <h2 className="font-medium text-2xl">Editar venda</h2>
      </header>

      <Form method="post" className="mt-8 grid gap-x-4 gap-y-6 sm:grid-cols-4">
        <SaleFormFields defaults={sale} />

        <footer className="col-span-full mt-2">
          <Button size="lg">Confirmar edições</Button>
        </footer>
      </Form>
    </ErrorProvider>
  )
}
