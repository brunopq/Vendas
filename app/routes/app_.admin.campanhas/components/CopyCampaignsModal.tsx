import { Form, useActionData, useFetcher } from "@remix-run/react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { utc } from "@date-fns/utc"

import { months } from "~/constants/months"
import { years } from "~/constants/years"

import { toast } from "~/hooks/use-toast"

import { Button, Dialog, Select } from "~/components/ui"
import FormGroup from "~/components/FormGroup"

import type { loader as campaignLoader } from "~/routes/app.campaigns"

import { type action, getResult } from "../route"

type MonthAndYear = {
  month: (typeof months)[number] | null
  year: number | null
}
export function CopyCampaignsModal({ children }: { children: JSX.Element }) {
  const actionData = useActionData<typeof action>()
  const copyResopnse = getResult(actionData, "POST", "copy_campaigns")

  const originCampaignsFetcher = useFetcher<typeof campaignLoader>()
  const destinationCampaignsFetcher = useFetcher<typeof campaignLoader>()
  const [origin, setOrigin] = useState<MonthAndYear>({
    month: null,
    year: null,
  })
  const [destination, setDestination] = useState<MonthAndYear>({
    month: null,
    year: null,
  })

  let originCampaignsCount = 0
  let destinationCampaignsCount = 0

  if (originCampaignsFetcher.data) {
    originCampaignsCount = originCampaignsFetcher.data.campaigns.length
  }

  if (destinationCampaignsFetcher.data) {
    destinationCampaignsCount =
      destinationCampaignsFetcher.data.campaigns.length
  }

  const handleSetOrigin = (newOrigin: MonthAndYear) => {
    setOrigin(newOrigin)

    if (newOrigin.month && newOrigin.year) {
      originCampaignsFetcher.submit(
        {
          date: format(
            new Date(
              newOrigin.year,
              months.findIndex((m) => m === newOrigin.month),
            ),
            "yyyy-MM-dd",
            { in: utc },
          ),
        },
        { method: "GET", action: "/app/campaigns" },
      )
    }
  }

  useEffect(() => {
    if (!copyResopnse) return

    if (copyResopnse.ok) {
      toast({
        title: "Categorias copiadas!",
        // TODO: add from month and to month
      })
    } else if (copyResopnse.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível copiar as campanhas",
        variant: "destructive",
      })
    }
  }, [copyResopnse])

  const handleSetDestination = (newDestination: MonthAndYear) => {
    setDestination(newDestination)

    if (newDestination.month && newDestination.year) {
      destinationCampaignsFetcher.submit(
        {
          date: format(
            new Date(
              newDestination.year,
              months.findIndex((m) => m === newDestination.month),
            ),
            "yyyy-MM-dd",
            { in: utc },
          ),
        },
        { method: "GET", action: "/app/campaigns" },
      )
    }
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Header>
          <Dialog.Title>Copiar campanhas</Dialog.Title>
          <Dialog.Description>
            Copie todas as campanhas de um mês para o outro, sem precisar
            criá-las manualmente
          </Dialog.Description>
        </Dialog.Header>

        <Form method="POST">
          <input type="hidden" name="actionType" value="copy_campaigns" />
          <div className="grid gap-x-2 gap-y-4 sm:grid-cols-[1fr_1fr_auto]">
            <div className="col-span-full grid grid-cols-subgrid items-end gap-y-1">
              <span className="col-span-full">Origem:</span>
              <FormGroup name="originMonth" label="Mês">
                {(removeErrors) => (
                  <Select.Root
                    name="originMonth"
                    onValueChange={(m) => {
                      removeErrors()
                      handleSetOrigin({
                        month: months[Number(m)],
                        year: origin.year,
                      })
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione..." />
                    </Select.Trigger>
                    <Select.Content>
                      {months.map((m, i) => (
                        <Select.Item value={i.toString()} key={m}>
                          {m}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              </FormGroup>

              <FormGroup name="originYear" label="Ano">
                {(removeErrors) => (
                  <Select.Root
                    name="originYear"
                    onValueChange={(y) => {
                      removeErrors()
                      handleSetOrigin({ month: origin.month, year: Number(y) })
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione..." />
                    </Select.Trigger>

                    <Select.Content>
                      {years.map((y) => (
                        <Select.Item value={y.toString()} key={y}>
                          {y}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              </FormGroup>

              <span>{originCampaignsCount} campanhas</span>
            </div>

            <div className="col-span-full grid grid-cols-subgrid items-end gap-y-1">
              <span className="col-span-full">Destino:</span>
              <FormGroup name="destinationMonth" label="Mês">
                {(removeErrors) => (
                  <Select.Root
                    name="destinationMonth"
                    onValueChange={(m) => {
                      removeErrors()
                      handleSetDestination({
                        month: months[Number(m)],
                        year: destination.year,
                      })
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione..." />
                    </Select.Trigger>
                    <Select.Content>
                      {months.map((m, i) => (
                        <Select.Item value={i.toString()} key={m}>
                          {m}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              </FormGroup>

              <FormGroup name="destinationYear" label="Ano">
                {(removeErrors) => (
                  <Select.Root
                    name="destinationYear"
                    onValueChange={(y) => {
                      removeErrors()
                      handleSetDestination({
                        month: destination.month,
                        year: Number(y),
                      })
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione..." />
                    </Select.Trigger>

                    <Select.Content>
                      {years.map((y) => (
                        <Select.Item value={y.toString()} key={y}>
                          {y}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              </FormGroup>

              <span>{destinationCampaignsCount} campanhas</span>
            </div>
          </div>

          <Dialog.Footer className="mt-8">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit">Copiar</Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
