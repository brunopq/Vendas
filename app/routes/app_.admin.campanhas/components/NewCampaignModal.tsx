import { Form, useActionData } from "react-router";
import { useEffect } from "react"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import { toast } from "~/hooks/use-toast"

import { Button, Dialog } from "~/components/ui"

import { CampaiginFormFields } from "./CampaignFormFields"
import { type action, getResult } from "../route"

export function NewCampaignModal({ children }: { children: JSX.Element }) {
  const response = useActionData<typeof action>()

  const newCampaignAction = getResult(response, "POST", "campaign")

  let errors: ErrorT[] = []
  if (newCampaignAction && !newCampaignAction.ok) {
    errors = newCampaignAction.error
  }

  useEffect(() => {
    if (!newCampaignAction) return
    if (newCampaignAction.ok) {
      toast({ title: "Campanha registrada com sucesso!" })
    } else if (newCampaignAction.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível registrar nova campanha :(",
        variant: "destructive",
      })
    }
  }, [newCampaignAction])

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Title>Nova campanha</Dialog.Title>

        <ErrorProvider initialErrors={errors}>
          <Form method="post" className="flex flex-col gap-4">
            <input type="hidden" name="actionType" value="campaign" />

            <CampaiginFormFields />

            <Dialog.Footer className="mt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit">Criar</Button>
            </Dialog.Footer>
          </Form>
        </ErrorProvider>
      </Dialog.Content>
    </Dialog.Root>
  )
}
