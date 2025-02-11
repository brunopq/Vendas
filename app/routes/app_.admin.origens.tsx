import OriginService from "~/services/OriginService"
import type { Route } from "./+types/app_.admin.origens"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { maxWidth } from "~/lib/utils"
import { Button, Dialog, DropdownMenu, Input, Table } from "~/components/ui"
import { EditIcon, EllipsisVertical, Plus, Trash2 } from "lucide-react"
import { Form, useActionData, useFetcher } from "react-router"
import { useEffect, useId } from "react"
import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"
import { toast } from "~/hooks/use-toast"
import FormGroup from "~/components/FormGroup"
import { error, ok, type Result } from "~/lib/result"
import { z, ZodError } from "zod"

export async function loader({ request }: Route.LoaderArgs) {
  await getAdminOrRedirect(request)

  const origins = await OriginService.getOrigins()

  return origins
}

async function handle<const M, Res>(method: M, fn: () => Promise<Res>) {
  let result: Result<Res, ErrorT[]>

  try {
    result = ok(await fn())
  } catch (e) {
    if (e instanceof ZodError) {
      const errors = e.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      result = error(errors)
    } else {
      result = error([{ type: "backend", message: "unknown backend error" }])
      console.log(e)
    }
  }

  return { method, result }
}

const originSchema = z.object({
  name: z.string({ required_error: "Insira o nome da origem" }),
})
const updateOriginSchema = originSchema.partial().extend({ id: z.string() })

async function handleNewOrigin(data: Record<string, unknown>) {
  const parsed = originSchema.parse(data)

  return await OriginService.createOrigin(parsed)
}

async function handleUpdateOrigin(data: Record<string, unknown>) {
  const parsed = updateOriginSchema.parse(data)

  return await OriginService.updateOrigin(parsed.id, parsed)
}

async function handleDeleteOrigin(data: Record<string, unknown>) {
  const { id } = data
  if (!id) return

  await OriginService.deleteOrigin(String(id))
}

export async function action({ request }: Route.ActionArgs) {
  await getAdminOrRedirect(request)

  const formData = await request.formData()

  const data: Record<string, unknown> = {}

  for (const [field, value] of formData) {
    if (value) {
      data[field] = String(value)
    }
  }

  if (request.method === "DELETE") {
    return handle("DELETE", () => handleDeleteOrigin(data))
  }
  if (request.method === "POST") {
    return handle("POST", () => handleNewOrigin(data))
  }
  if (request.method === "PUT") {
    return handle("PUT", () => handleUpdateOrigin(data))
  }

  console.log("method not implemented")

  return {
    method: request.method,
    result: error([
      {
        type: "not implemented",
        message: `method: ${request.method} is not implemented`,
      },
    ]),
  }
}

export default function Origins({ loaderData }: Route.ComponentProps) {
  const origins = loaderData
  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Origens</h2>

        <fieldset className="mb-4 flex items-end justify-start gap-6">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button icon="left" className="text-sm">
                <Plus className="size-5" /> Novo
              </Button>
            </Dialog.Trigger>
            <NewOriginModal />
          </Dialog.Root>
        </fieldset>
      </header>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Nome</Table.Head>
            <Table.Head />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {origins.map((o) => (
            <Table.Row key={o.id}>
              <Table.Cell className="flex items-center justify-between">
                {o.name}
              </Table.Cell>
              <Table.Cell className="w-0">
                <OriginDropdown id={o.id} name={o.name} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </section>
  )
}

type OriginDropdownProps = {
  id: string
  name: string
}

function OriginDropdown({ id, name }: OriginDropdownProps) {
  const fetcher = useFetcher({})

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant={"ghost"} className="p-1">
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <EditOriginModal {...{ id, name }}>
          <DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
            <EditIcon className="size-5" />
            Editar
          </DropdownMenu.Item>
        </EditOriginModal>

        <DropdownMenu.Item
          onClick={() => fetcher.submit({ id: id }, { method: "DELETE" })}
          variant="danger"
        >
          <Trash2 className="size-5" />
          Excluir
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}

type EditOriginModalProps = {
  id: string
  name: string
  children: React.ReactNode
}

function EditOriginModal({ id, name, children }: EditOriginModalProps) {
  const fetcher = useFetcher<typeof action>({ key: useId() })
  const response = fetcher.data

  let putOriginAction: typeof response = undefined

  if (response?.method === "PUT") {
    putOriginAction = response
  }

  let errors: ErrorT[] = []
  if (putOriginAction && !putOriginAction.result.ok) {
    errors = putOriginAction.result.error
  }

  useEffect(() => {
    if (!putOriginAction) return
    if (putOriginAction.result.ok) {
      toast({ title: "Origem editada!" })
      console.log(putOriginAction.result.value)
    } else if (putOriginAction.result.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível editar a origem :(",
        variant: "destructive",
      })
    }
  }, [putOriginAction])

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content>
        <Dialog.Title>
          Editar{" "}
          <strong className="font-semibold text-primary-600">{name}</strong>
        </Dialog.Title>

        <fetcher.Form method="PUT" className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />

          <BasicOriginFormFields origin={{ name }} />

          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit">Salvar alterações</Button>
          </Dialog.Footer>
        </fetcher.Form>
      </Dialog.Content>
    </Dialog.Root>
  )
}

type BasicOriginFormFieldsProps = {
  origin?: Partial<{
    name: string
  }>
}

function BasicOriginFormFields({ origin }: BasicOriginFormFieldsProps) {
  return (
    <>
      <FormGroup name="name" label="Nome">
        {(removeError) => (
          <Input
            defaultValue={origin?.name}
            onInput={removeError}
            name="name"
            placeholder="Nome da origem..."
          />
        )}
      </FormGroup>
    </>
  )
}

function NewOriginModal() {
  const response = useActionData<typeof action>()

  let postUserAction: typeof response = undefined

  if (response?.method === "POST") {
    postUserAction = response
  }

  let errors: ErrorT[] = []
  if (postUserAction && !postUserAction.result.ok) {
    errors = postUserAction.result.error
  }

  useEffect(() => {
    if (!postUserAction) return
    if (postUserAction.result.ok) {
      toast({ title: "Usuário criado com sucesso!" })
      console.log(postUserAction.result.value)
    } else if (postUserAction.result.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível criar o usuário :(",
        variant: "destructive",
      })
    }
  }, [postUserAction])

  return (
    <Dialog.Content>
      <Dialog.Title>Nova origem</Dialog.Title>

      <ErrorProvider initialErrors={errors}>
        <Form method="POST" className="flex flex-col gap-4">
          <BasicOriginFormFields />

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
  )
}
