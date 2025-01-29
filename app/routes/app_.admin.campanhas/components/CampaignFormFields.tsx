import { useState } from "react"

import { brl, currencyToNumber } from "~/lib/formatters"

import { months } from "~/constants/months"
import { years } from "~/constants/years"

import type { DomainCampaign } from "~/services/CampaignService"

import { BrlInput, Input, Select } from "~/components/ui"
import FormGroup from "~/components/FormGroup"

export type CampaiginFormFieldsProps = {
  campaign?: Partial<DomainCampaign>
}

export function CampaiginFormFields({ campaign }: CampaiginFormFieldsProps) {
  const [goal, setGoal] = useState<number>(campaign?.goal ?? 0)
  const [prize, setPrize] = useState<number>(
    campaign?.prize ? currencyToNumber(campaign.prize) : 0,
  )
  const [individualPrize, setIndividualPrize] = useState<number>(
    campaign?.individualPrize ? currencyToNumber(campaign.individualPrize) : 0,
  )

  return (
    <>
      <FormGroup name="name" label="Nome da campanha">
        {(removeError) => (
          <Input
            defaultValue={campaign?.name}
            onInput={removeError}
            name="name"
            placeholder="Categoria..."
          />
        )}
      </FormGroup>

      <div className="grid grid-cols-2 gap-4">
        <FormGroup name="month" label="Mês de vigência">
          {(removeErrors) => (
            <Select.Root
              defaultValue={
                campaign?.month &&
                months[new Date(campaign.month).getUTCMonth()]
              }
              onValueChange={removeErrors}
              name="month"
            >
              <Select.Trigger>
                <Select.Value placeholder="Selecione" />
              </Select.Trigger>
              <Select.Content>
                {months.map((m) => (
                  <Select.Item value={m} key={m}>
                    {m}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        </FormGroup>

        <FormGroup name="year" label="Ano de vigência">
          {(removeErrors) => (
            <Select.Root
              defaultValue={
                campaign?.month &&
                new Date(campaign.month).getUTCFullYear().toString()
              }
              onValueChange={removeErrors}
              name="year"
            >
              <Select.Trigger>
                <Select.Value placeholder="Selecione" />
              </Select.Trigger>
              <Select.Content>
                {years.map((a) => (
                  <Select.Item value={a.toString()} key={a}>
                    {a}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        </FormGroup>
      </div>

      <FormGroup name="goal" label="Meta principal">
        {(removeError) => (
          <Input
            onInput={(e) => {
              removeError()
              if (!Number.isNaN(e.currentTarget.valueAsNumber)) {
                setGoal(e.currentTarget.valueAsNumber)
              }
            }}
            value={goal}
            name="goal"
            placeholder="Meta..."
            type="number"
            min={0}
          />
        )}
      </FormGroup>

      <div className="grid grid-cols-2 gap-4">
        <FormGroup name="prize" label="Comissão">
          {(removeError) => (
            <BrlInput
              onInput={(e) => {
                removeError()
                setPrize(currencyToNumber(e.currentTarget.value))
              }}
              defaultValue={brl(prize)}
              name="prize"
            />
          )}
        </FormGroup>

        <FormGroup name="individualPrize" label="Comissão individual">
          {(removeError) => (
            <BrlInput
              onInput={(e) => {
                removeError()
                setIndividualPrize(currencyToNumber(e.currentTarget.value))
              }}
              defaultValue={brl(individualPrize)}
              name="individualPrize"
            />
          )}
        </FormGroup>
      </div>

      <CampaignGoalPreview
        goal={goal}
        prize={prize}
        individualPrize={individualPrize}
      />
    </>
  )
}

type CampaignGoalPreviewProps = {
  goal: number
  prize: number
  individualPrize: number
}

function CampaignGoalPreview({
  goal,
  prize,
  individualPrize,
}: CampaignGoalPreviewProps) {
  return (
    <div className="mt-2 grid grid-cols-[repeat(4,_auto)] text-sm">
      <strong className="col-span-full mb-1 text-base">Metas: </strong>

      <span />

      <span>
        {Intl.NumberFormat("pt-br", { style: "percent" }).format(0.5)}
      </span>
      <span>
        {Intl.NumberFormat("pt-br", { style: "percent" }).format(0.75)}
      </span>
      <span>{Intl.NumberFormat("pt-br", { style: "percent" }).format(1)}</span>

      <hr className="-col-end-1 col-start-2 my-0.5 border-zinc-300" />

      <span className="text-zinc-600">Vendas totais</span>
      <span>{Math.round(goal * 0.5)}</span>
      <span>{Math.round(goal * 0.75)}</span>
      <span>{Math.round(goal * 1)}</span>

      <span className="text-zinc-600">Comissão geral</span>
      <span>{brl(prize * 0.5)}</span>
      <span>{brl(prize * 0.75)}</span>
      <span>{brl(prize * 1)}</span>

      <span className="text-zinc-600">Vendas usuário</span>
      <span>{Math.floor(goal * 0.5 * 0.1)}</span>
      <span>{Math.floor(goal * 0.75 * 0.1)}</span>
      <span>{Math.floor(goal * 1 * 0.1)}</span>

      <span className="text-zinc-600">Comissão individual</span>
      <span>{brl(individualPrize * Math.floor(goal * 0.5 * 0.1))}</span>
      <span>{brl(individualPrize * Math.floor(goal * 0.75 * 0.1))}</span>
      <span>{brl(individualPrize * Math.floor(goal * 1 * 0.1))}</span>
    </div>
  )
}
