import { useFetcher } from "@remix-run/react"
import { useEffect } from "react"
import { format } from "date-fns"
import { utc } from "@date-fns/utc"

import { saleAreaSchema } from "~/db/schema"

import type { DomainCampaign } from "~/services/CampaignService"

import type { loader as campaignLoader } from "~/routes/app.campaigns"

import { Input, Select, Checkbox, RadioGroup, BrlInput, Textarea } from "./ui"
import FormGroup from "./FormGroup"

const saleAreas = saleAreaSchema().options

export default function SaleFormFields() {
  const campaignsFetcher = useFetcher<typeof campaignLoader>()

  const campaignData = campaignsFetcher.data

  let campaigns: DomainCampaign[] = []
  let date = new Date()

  if (campaignData) {
    campaigns = campaignData.campaigns
    date = new Date(campaignData.date)
  }

  useEffect(() => {
    campaignsFetcher.load("/app/campaigns")
  }, [campaignsFetcher.load])

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
          <Select.Root
            disabled={campaignsFetcher.state === "loading"}
            onValueChange={removeErrors}
            name="campaign"
          >
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
            disabled={campaignsFetcher.state === "loading"}
            value={format(date, "yyyy-MM-dd")}
            onChange={(e) => {
              removeErrors()
              const newDate = e.target.valueAsDate

              if (!newDate) return
              campaignsFetcher.load(
                `/app/campaigns?date=${format(newDate, "yyyy-MM-dd", { in: utc })}`,
              )
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
