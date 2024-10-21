import type {
  ActionFunctionArgs,
  MetaFunction,
  TypedResponse,
} from "@remix-run/node"
import { Form, Link, useActionData } from "@remix-run/react"
import { ArrowLeft } from "lucide-react"
import { useEffect } from "react"
import { z } from "zod"

import { captationTypeSchema, saleAreaSchema } from "~/db/schema"
import SalesService, { type DomainSale } from "~/services/SalesService"

import { type Result, typedOk, typedError } from "~/lib/result"
import { currencyToNumeric } from "~/lib/formatters"
import { getUserOrRedirect } from "~/lib/authGuard"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import { toast } from "~/hooks/use-toast"

import { Button } from "~/components/ui"

import SaleFormFields from "~/components/SaleFormFields"

export const meta: MetaFunction = () => [
  {
    title: "Nova venda",
  },
]

const formSchema = z.object({
  date: z
    .string({ required_error: "Insira uma data" })
    .date("Data mal formatada"),
  seller: z.string({ message: "Seller is required" }),
  campaign: z.string({ required_error: "Selecione a campanha da venda" }),
  saleArea: saleAreaSchema({
    required_error: "Selecione a área da venda",
    invalid_type_error: "Área de venda inválido",
  }),
  captationType: captationTypeSchema({
    required_error: "Escolha um tipo de captação",
    invalid_type_error: "Tipo de captação inválido",
  }),
  client: z
    .string({ required_error: "Insira o nome do cliente" })
    .min(1, "Insira o nome do cliente"),
  adverseParty: z
    .string({ required_error: "Insira a parte adversa" })
    .min(1, "Insira a parte adversa"),
  isRepurchase: z.coerce.boolean().default(false),
  estimatedValue: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valor estimado deve estar no formato correto")
    .optional(),
  comments: z.string().optional(),
  indication: z.string().optional(),
})

type ActionResponse = Result<DomainSale, ErrorT[]>
export const action = async ({
  request,
}: ActionFunctionArgs): Promise<TypedResponse<ActionResponse>> => {
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

    const parsed = formSchema.safeParse(data)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      return typedError(errors)
    }

    return typedOk(await SalesService.create(parsed.data))
  } catch (e) {
    return typedError([{ type: "backend", message: "unknown backend error" }])
  }
}

export default function Venda() {
  const response = useActionData<typeof action>()

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
