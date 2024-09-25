import { Form } from "@remix-run/react"

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

export default function Venda() {
  return (
    <>
      <h2 className="mb-4 font-medium text-2xl">Nova venda</h2>

      <Form className="grid gap-4 sm:grid-cols-2">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanati */}
        <label>
          Data da venda
          <Input type="date" />
        </label>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-1 flex-col">
            <span>Tipo de captação</span>
            <RadioGroup className="flex flex-1 gap-4">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
              <label className="flex items-center gap-2">
                <RadioGroupItem value="ativa" /> Ativa
              </label>
              {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
              <label className="flex items-center gap-2">
                <RadioGroupItem value="passiva" /> Passiva
              </label>
            </RadioGroup>
          </div>

          {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
          <label className="flex flex-1 flex-col">
            <span className="whitespace-nowrap">É recompra?</span>
            <span className="flex flex-1 items-center gap-2">
              Sim <Checkbox className="block" />
            </span>
          </label>
        </div>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>
          Cliente
          <Input placeholder="Nome do cliente" />
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>
          Área
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trabalhista">Trabalhista</SelectItem>
              <SelectItem value="civel">Cível</SelectItem>
              <SelectItem value="previdenciario">Previdenciário</SelectItem>
              <SelectItem value="tributario">Tributário</SelectItem>
              <SelectItem value="penal">Penal</SelectItem>
            </SelectContent>
          </Select>
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>
          Parte adversa
          <Input placeholder="Parte adversa" />
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>
          Valor estimado
          <Input placeholder="R$ 1.000,00" />
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label className="col-span-full">
          Observações
          <Textarea placeholder="Outras informações relevantes..." />
        </label>

        <Button className="col-span-full mt-2 mr-auto w-fit">
          Criar venda
        </Button>
      </Form>
    </>
  )
}
