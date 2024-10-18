import { format } from "date-fns"

import { saleAreaSchema } from "~/db/schema"

import type { DomainCampaign } from "~/services/CampaignService"

import { Input, Select, Checkbox, RadioGroup, BrlInput, Textarea } from "./ui"

import FormGroup from "./FormGroup"

const saleAreas = saleAreaSchema().options

export type SaleFormFieldsProps = {
  campaigns: DomainCampaign[]
  date: Date
  onDateChange: (date: Date | null) => void
}

/**
 * All the form fields needed to create a new sale, syled assuming a grid layout by default.
 *
 * Campaigns and date should be provided, as well as a function to fetch new
 * campaigns whenever the date field is changed.
 */
export default function SaleFormFields({
  campaigns,
  date,
  onDateChange,
}: SaleFormFieldsProps) {
  return (
    <>
      <FormGroup className="col-span-2" name="client" label="Cliente">
        {(removeErrors) => (
          <Input
            name="client"
            id="client"
            placeholder="Nome do cliente"
            onInput={removeErrors}
          />
        )}
      </FormGroup>

      <FormGroup
        className="col-span-2"
        name="adverseParty"
        label="Parte adversa"
      >
        {(removeErrors) => (
          <Input
            onInput={removeErrors}
            name="adverseParty"
            id="adverseParty"
            placeholder="Parte adversa"
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

      <FormGroup name="saleArea" label="Área">
        {(removeErrors) => (
          <Select.Root onValueChange={removeErrors} name="saleArea">
            <Select.Trigger>
              <Select.Value placeholder="Selecione..." />
            </Select.Trigger>
            <Select.Content>
              {saleAreas.map((area) => (
                <Select.Item key={area} value={area}>
                  {area}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        )}
      </FormGroup>

      <FormGroup
        className="flex flex-col"
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
        className="flex flex-col"
        name="isRepurchase"
        label="É recompra"
      >
        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label className="flex flex-1 items-center gap-2">
          Sim
          <Checkbox name="isRepurchase" id="isRepurchase" className="block" />
        </label>
      </FormGroup>

      <FormGroup
        className="col-span-2"
        name="estimatedValue"
        label="Valor estimado"
      >
        {(removeErrors) => (
          <BrlInput
            onInput={removeErrors}
            name="estimatedValue"
            id="estimatedValue"
            // placeholder="R$ 1.000,00"
          />
        )}
      </FormGroup>

      <FormGroup name="date" label="Data da venda">
        {(removeErrors) => (
          <Input
            value={format(date, "yyyy-MM-dd")}
            onChange={(e) => {
              removeErrors()
              onDateChange(e.target.valueAsDate)
            }}
            name="date"
            id="date"
            type="date"
          />
        )}
      </FormGroup>

      <FormGroup name="indication" label="Indicado por:">
        <Input placeholder="Nome" />
      </FormGroup>

      <FormGroup className="col-span-full" name="comments" label="Observações">
        <Textarea
          id="comments"
          name="comments"
          placeholder="Outras informações relevantes..."
        />
      </FormGroup>
    </>
  )
}
