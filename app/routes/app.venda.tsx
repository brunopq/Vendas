import { Form, Link } from "@remix-run/react"
import { ArrowLeft } from "lucide-react"

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

      <Form className="grid gap-4 sm:grid-cols-2">
        <FormGroup name="data" label="Data da venda">
          <Input id="data" type="date" />
        </FormGroup>

        <div className="flex flex-wrap gap-4">
          <FormGroup
            className="flex flex-1 flex-col"
            name="type"
            label="Tipo de captação"
          >
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
          </FormGroup>

          <FormGroup
            className="flex flex-1 flex-col"
            name="isRepurchase"
            label="É recompra"
          >
            {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
            <label className="flex flex-1 items-center gap-2">
              Sim <Checkbox id="isRepurchase" className="block" />
            </label>
          </FormGroup>
        </div>

        <FormGroup name="client" label="Cliente">
          <Input placeholder="Nome do cliente" />
        </FormGroup>

        <FormGroup name="area" label="Área">
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
        </FormGroup>

        <FormGroup name="adverseParty" label="Parte adversa">
          <Input placeholder="Parte adversa" />
        </FormGroup>

        <FormGroup name="estimatedValue" label="Valor estimado">
          <Input placeholder="R$ 1.000,00" />
        </FormGroup>

        <FormGroup
          className="col-span-full"
          name="comments"
          label="Observações"
        >
          <Textarea placeholder="Outras informações relevantes..." />
        </FormGroup>

        <Button className="col-span-full mt-2 mr-auto w-fit">
          Criar venda
        </Button>
      </Form>
    </>
  )
}
