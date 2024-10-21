import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react"
import { Edit, EllipsisVertical, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { ptBR } from "date-fns/locale"
import { format, parse } from "date-fns"
import { utc } from "@date-fns/utc"

import { months } from "~/constants/months"

import { brl, currencyToNumber } from "~/lib/formatters"
import { maxWidth } from "~/lib/utils"

import { toast } from "~/hooks/use-toast"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import type { loader as campaignLoader } from "~/routes/app.campaigns"

import FormGroup from "~/components/FormGroup"

import {
  BrlInput,
  Input,
  Button,
  DropdownMenu,
  Table,
  Dialog,
  Select,
} from "~/components/ui"

import { type action, type loader, getResult } from "./route"

export function CampaignsSection() {
  const { campaigns } = useLoaderData<typeof loader>()

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Campanhas e metas</h2>

        <div className="flex items-center justify-between gap-2">
          <CopyCampaignsModal>
            <Button variant="ghost">Copiar campanhas</Button>
          </CopyCampaignsModal>
          <NewCampaignModal>
            <Button icon="left" className="text-sm">
              <Plus /> Novo
            </Button>
          </NewCampaignModal>
        </div>
      </header>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-0">Id</Table.Head>
            <Table.Head>Nome</Table.Head>
            <Table.Head>Mês</Table.Head>
            <Table.Head>Meta de vendas</Table.Head>
            <Table.Head>Comissão</Table.Head>
            <Table.Head className="w-0">{/*dropdown*/}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {campaigns.map((c) => (
            <Table.Row key={c.id}>
              <Table.Cell className="text-sm text-zinc-600">{c.id}</Table.Cell>
              <Table.Cell>{c.name}</Table.Cell>
              <Table.Cell>
                {format(
                  parse(c.month, "yyyy-MM-dd", new Date()),
                  "MMMM, yyyy",
                  { locale: ptBR },
                )}
              </Table.Cell>
              <Table.Cell>{c.goal}</Table.Cell>
              <Table.Cell>{brl(c.prize)}</Table.Cell>
              <Table.Cell className="w-0">
                <CampaignDropdown id={c.id} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </section>
  )
}

function CampaignDropdown({ id }: { id: string }) {
  const fetcher = useFetcher({})

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" className="p-1">
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>
          <Edit className="size-5" />
          Editar
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onClick={() =>
            fetcher.submit(
              { actionType: "campaign", id: id },
              { method: "delete" },
            )
          }
          variant="danger"
        >
          <Trash2 className="size-5" />
          Excluir
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}

type MonthAndYear = {
  month: (typeof months)[number] | null
  year: number | null
}
function CopyCampaignsModal({ children }: { children: JSX.Element }) {
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

      <Dialog.Content className="[--dialog-content-max-width:_32rem]">
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
                      {[2024].map((y) => (
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
                      {[2024].map((y) => (
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

function NewCampaignModal({ children }: { children: JSX.Element }) {
  const response = useActionData<typeof action>()

  const newCampaignAction = getResult(response, "POST", "campaign")

  let errors: ErrorT[] = []
  if (newCampaignAction && !newCampaignAction.ok) {
    errors = newCampaignAction.error
  }

  const [goal, setGoal] = useState<number>(0)
  const [prize, setPrize] = useState<number>(0)

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

      <Dialog.Content>
        <Dialog.Title>Nova campanha</Dialog.Title>

        <ErrorProvider initialErrors={errors}>
          <Form method="post" className="flex flex-col gap-4">
            <input type="hidden" name="actionType" value="campaign" />
            <FormGroup name="name" label="Nome da campanha">
              {(removeError) => (
                <Input
                  onInput={removeError}
                  name="name"
                  placeholder="Categoria..."
                />
              )}
            </FormGroup>

            <div className="grid grid-cols-2 gap-4">
              <FormGroup name="month" label="Mês de vigência">
                {(removeErrors) => (
                  <Select.Root onValueChange={removeErrors} name="month">
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
                  <Select.Root onValueChange={removeErrors} name="year">
                    <Select.Trigger>
                      <Select.Value placeholder="Selecione" />
                    </Select.Trigger>
                    <Select.Content>
                      {[2024].map((a) => (
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
            <FormGroup name="prize" label="Comissão">
              {(removeError) => (
                <BrlInput
                  onInput={(e) => {
                    removeError()
                    setPrize(currencyToNumber(e.currentTarget.value))
                  }}
                  name="prize"
                />
              )}
            </FormGroup>

            <div className="mt-2 grid grid-cols-3 text-sm">
              <strong className="col-span-3 mb-1 text-base">Metas: </strong>

              <span className="text-zinc-600">Meta</span>
              <span className="text-zinc-600">N. de vendas</span>
              <span className="text-zinc-600">Comissão</span>

              <span>50%</span>
              <span>{Math.round(goal * 0.5)}</span>
              <span>{brl(prize * 0.5)}</span>

              <span>75%</span>
              <span>{Math.round(goal * 0.75)}</span>
              <span>{brl(prize * 0.75)}</span>

              <span>100%</span>
              <span>{Math.round(goal * 1)}</span>
              <span>{brl(prize * 1)}</span>

              <span>110%</span>
              <span>{Math.round(goal * 1.1)}</span>
              <span>{brl(prize * 1.1)}</span>
            </div>

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
