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

export default function Venda() {
  return (
    <>
      <h2 className="font-medium text-2xl">Nova venda</h2>

      <Form>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanati */}
        <label>
          Data da venda
          <Input type="date" />
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>
          Tipo de captação
          <RadioGroup>
            <RadioGroupItem value="ativa" /> Ativa
            <RadioGroupItem value="passiva" /> Passiva
          </RadioGroup>
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>
          Área
          <Select>
            <SelectTrigger>
              <SelectValue />
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
          Cliente
          <Input placeholder="Nome do cliente" />
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>
          Parte adversa
          <Input placeholder="Parte adversa" />
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label className="flex items-center gap-4">
          Recompra
          <Checkbox />
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>
          Valor estimado
          <Input placeholder="R$ 1.000,00" />
        </label>

        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>
          Observações
          <Textarea placeholder="Outras informações relevantes..." />
        </label>
      </Form>
    </>
  )
}
