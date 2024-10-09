import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  TypedResponse,
} from "@remix-run/node"
import {
  Form,
  json,
  Link,
  useActionData,
  useLoaderData,
} from "@remix-run/react"
import { ArrowLeft } from "lucide-react"
import { useEffect } from "react"
import { z } from "zod"

import { captationTypeSchema } from "~/db/schema"
import SalesService, { type DomainSale } from "~/services/SalesService"
import CampaignService from "~/services/CampaignService"

import { type Result, typedOk, typedError } from "~/lib/result"
import { currencyToNumeric } from "~/lib/formatters"
import { getUserOrRedirect } from "~/lib/authGuard"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import { toast } from "~/hooks/use-toast"

import {
  Button,
  Checkbox,
  Select,
  Input,
  BrlInput,
  Textarea,
  RadioGroup,
} from "~/components/ui"

import FormGroup from "~/components/FormGroup"

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
  captationType: captationTypeSchema({
    required_error: "Escolha um tipo de venda",
    invalid_type_error: "Tipo de venda inválido",
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
})

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getUserOrRedirect(request)

  const campaigns = await CampaignService.index()

  return json(campaigns)
}

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
  const campaigns = useLoaderData<typeof loader>()
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

      <Form method="post" className="grid gap-4 sm:grid-cols-2">
        <FormGroup name="date" label="Data da venda">
          <Input name="date" id="date" type="date" />
        </FormGroup>

        <div className="flex flex-wrap gap-4">
          <FormGroup
            className="flex flex-1 flex-col"
            name="captationType"
            label="Tipo de captação"
          >
            {(removeErrors) => (
              <RadioGroup.Root
                onChange={removeErrors}
                name="captationType"
                className="flex flex-1 gap-4"
              >
                {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="flex items-center gap-2">
                  <RadioGroup.Item value="ATIVO" /> Ativa
                </label>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="flex items-center gap-2">
                  <RadioGroup.Item value="PASSIVO" /> Passiva
                </label>
              </RadioGroup.Root>
            )}
          </FormGroup>

          <FormGroup
            className="flex flex-1 flex-col"
            name="isRepurchase"
            label="É recompra"
          >
            {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
            <label className="flex flex-1 items-center gap-2">
              Sim
              <Checkbox
                name="isRepurchase"
                id="isRepurchase"
                className="block"
              />
            </label>
          </FormGroup>
        </div>

        <FormGroup name="client" label="Cliente">
          {(removeErrors) => (
            <Input
              name="client"
              id="client"
              placeholder="Nome do cliente"
              onInput={removeErrors}
            />
          )}
        </FormGroup>

        <FormGroup name="campaign" label="Campanha">
          {(removeErrors) => (
            <Select.Root onValueChange={removeErrors} name="campaign">
              <Select.Trigger>
                <Select.Value placeholder="Selecione..." />
              </Select.Trigger>
              <Select.Content>
                {campaigns.map((c) => (
                  <Select.Item key={c.id} value={c.id}>
                    {c.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        </FormGroup>

        <FormGroup name="adverseParty" label="Parte adversa">
          {(removeErrors) => (
            <Input
              onInput={removeErrors}
              name="adverseParty"
              id="adverseParty"
              placeholder="Parte adversa"
            />
          )}
        </FormGroup>

        <FormGroup name="estimatedValue" label="Valor estimado">
          {(removeErrors) => (
            <BrlInput
              onInput={removeErrors}
              name="estimatedValue"
              id="estimatedValue"
              // placeholder="R$ 1.000,00"
            />
          )}
        </FormGroup>

        <FormGroup
          className="col-span-full"
          name="comments"
          label="Observações"
        >
          <Textarea
            id="comments"
            name="comments"
            placeholder="Outras informações relevantes..."
          />
        </FormGroup>

        <Button className="col-span-full mt-2 mr-auto w-fit">
          Criar venda
        </Button>
      </Form>
    </ErrorProvider>
  )
}
