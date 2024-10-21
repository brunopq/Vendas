import type { LoaderFunctionArgs } from "@remix-run/node"
import { Form, json, Link, redirect, useLoaderData } from "@remix-run/react"
import { ArrowLeft } from "lucide-react"

import { getUserOrRedirect } from "~/lib/authGuard"

import { ErrorProvider } from "~/context/ErrorsContext"

import { Button } from "~/components/ui"

import SaleFormFields from "~/components/SaleFormFields"
import SalesService from "~/services/SalesService"

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUserOrRedirect(request)

  const saleId = params.id

  if (!saleId) {
    throw new Error("sale id not provided (??????????)")
  }

  const sale = await SalesService.getById(saleId)

  if (!sale) {
    throw redirect("/app")
  }

  return json(sale)
}

export default function Venda() {
  const sale = useLoaderData<typeof loader>()

  const errors = undefined

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
