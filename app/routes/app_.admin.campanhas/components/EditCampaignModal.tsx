import { useFetcher } from "@remix-run/react"
import React, { useEffect } from "react"

import type { DomainCampaign } from "~/services/CampaignService"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import { toast } from "~/hooks/use-toast"

import { Button, Dialog } from "~/components/ui"

import { CampaiginFormFields } from "./CampaignFormFields"
import { type action, getResult } from "../route"

type EditCampaignModalProps = {
  children: JSX.Element
  campaign: DomainCampaign
}

export function EditCampaignModal({
  children,
  campaign,
}: EditCampaignModalProps) {
  const fetcher = useFetcher<typeof action>({ key: React.useId() })
  const actionResponse = fetcher.data

  const putCampaignResponse = getResult(actionResponse, "PUT", "campaign")

  let errors: ErrorT[] = []
  if (putCampaignResponse && !putCampaignResponse.ok) {
    errors = putCampaignResponse.error
  }

  useEffect(() => {
    if (!putCampaignResponse) return
    if (putCampaignResponse.ok) {
      toast({ title: "Campanha editada!" })
      console.log(putCampaignResponse.value)
    } else if (putCampaignResponse.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível editar a campanha :(",
        variant: "destructive",
      })
    }
  }, [putCampaignResponse])

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Title>
          Editar campanha{" "}
          <strong className="font-semibold text-primary-600">
            {campaign.name}
          </strong>
        </Dialog.Title>

        <fetcher.Form method="PUT" className="flex flex-col gap-4">
          <ErrorProvider initialErrors={errors}>
            <input type="hidden" name="actionType" value="campaign" />
            <input type="hidden" name="id" value={campaign.id} />
            <CampaiginFormFields campaign={campaign} />

            <Dialog.Footer className="mt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit">Salvar alterações</Button>
            </Dialog.Footer>
          </ErrorProvider>
        </fetcher.Form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
