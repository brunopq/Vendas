import type { ActionFunctionArgs } from "@remix-run/node"
import { Form, json, Link, useActionData } from "@remix-run/react"
import { ArrowLeft } from "lucide-react"
import { z } from "zod"

import { getUser } from "~/session"

import { areaSchema, sellTypeSchema } from "~/db/schema"
import SalesService from "~/services/SalesService"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Checkbox } from "~/components/ui/checkbox"
import { Button } from "~/components/ui/button"

import FormGroup from "~/components/FormGroup"

const formSchema = z.object({
  date: z
    .string({ required_error: "Insira uma data" })
    .date("Data mal formatada"),
  seller: z.string({ message: "Seller is required" }),
  area: areaSchema({
    required_error: "Área da venda deve ser preenchida",
    invalid_type_error: "Área inválida",
  }),
  sellType: sellTypeSchema({
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
    .string({ required_error: "Insira um valor estimado" })
    .regex(/^\d+(\.\d{1,2})?$/, "Valor estimado deve estar no formato correto"),
  comments: z.string().optional(),
})

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const user = await getUser(request)

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

    const parsed = formSchema.safeParse(data)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      return json({
        formErrors: errors,
      })
    }

    return json(SalesService.create(parsed.data))
  } catch (e) {
    return json({
      errors: e,
    })
  }
}

export default function Venda() {
  const response = useActionData<typeof action>()

  let errors: ErrorT[] = []
  if (response && "formErrors" in response) {
    errors = response.formErrors
  }

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
            name="sellType"
            label="Tipo de captação"
          >
            {(removeErrors) => (
              <RadioGroup
                onChange={removeErrors}
                name="sellType"
                className="flex flex-1 gap-4"
              >
                {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="ATIVO" /> Ativa
                </label>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="PASSIVO" /> Passiva
                </label>
              </RadioGroup>
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

        <FormGroup name="area" label="Área">
          {(removeErrors) => (
            <Select onValueChange={removeErrors} name="area">
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRABALHISTA">Trabalhista</SelectItem>
                <SelectItem value="CÍVEL">Cível</SelectItem>
                <SelectItem value="PREVIDENCIÁRIO">Previdenciário</SelectItem>
                <SelectItem value="TRIBUTÁRIO">Tributário</SelectItem>
                <SelectItem value="PENAL">Penal</SelectItem>
              </SelectContent>
            </Select>
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
            <Input
              onInput={removeErrors}
              name="estimatedValue"
              id="estimatedValue"
              placeholder="R$ 1.000,00"
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
