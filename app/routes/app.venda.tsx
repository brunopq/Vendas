import type { ActionFunctionArgs } from "@remix-run/node"
import { Form, json, Link } from "@remix-run/react"
import { ArrowLeft } from "lucide-react"

import { getUser } from "~/session"

import SalesService, { newSaleSchema } from "~/services/SalesService"

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

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request)

  const formData = await request.formData()

  const data = [...formData.entries()].reduce(
    (acc, [k, v]) => {
      acc[k] = String(v)
      return acc
    },
    {} as Record<string, unknown>,
  )
  data.seller = user.id

  if (data.isRepurchase === "on") {
    data.isRepurchase = true
  } else {
    data.isRepurchase = false
  }

  const res = newSaleSchema.safeParse(data)
  if (res.success) {
    return json(await SalesService.create(res.data))
  }

  throw res.error
}

export default function Venda() {
  return (
    <>
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
            <RadioGroup name="sellType" className="flex flex-1 gap-4">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
              <label className="flex items-center gap-2">
                <RadioGroupItem value="ATIVO" /> Ativa
              </label>
              {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
              <label className="flex items-center gap-2">
                <RadioGroupItem value="PASSIVO" /> Passiva
              </label>
            </RadioGroup>
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
          <Input name="client" id="client" placeholder="Nome do cliente" />
        </FormGroup>

        <FormGroup name="area" label="Área">
          <Select name="area">
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
        </FormGroup>

        <FormGroup name="adverseParty" label="Parte adversa">
          <Input
            name="adverseParty"
            id="adverseParty"
            placeholder="Parte adversa"
          />
        </FormGroup>

        <FormGroup name="estimatedValue" label="Valor estimado">
          <Input
            name="estimatedValue"
            id="estimatedValue"
            placeholder="R$ 1.000,00"
          />
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
    </>
  )
}
