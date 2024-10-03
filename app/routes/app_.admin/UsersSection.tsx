import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react"
import { Edit, EllipsisVertical, Plus, Trash2 } from "lucide-react"
import { useEffect } from "react"

import { toast } from "~/hooks/use-toast"

import { cn, maxWidth } from "~/lib/utils"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import FormGroup from "~/components/FormGroup"

import {
  Input,
  Button,
  DropdownMenu,
  Table,
  Dialog,
  Checkbox,
} from "~/components/ui"

import type { action, loader } from "./route"

export function UsersSection() {
  const { users } = useLoaderData<typeof loader>()

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Usuários</h2>

        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button icon="left" className="text-sm">
              <Plus /> Novo
            </Button>
          </Dialog.Trigger>
          <NewUserModal />
        </Dialog.Root>
      </header>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-0">Id</Table.Head>
            <Table.Head className="w-0">Tipo</Table.Head>
            <Table.Head>Nome</Table.Head>
            <Table.Head>Vendas</Table.Head>
            <Table.Head />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((u) => (
            <Table.Row key={u.id}>
              <Table.Cell className="text-sm text-zinc-600">{u.id}</Table.Cell>
              <Table.Cell>
                <span
                  className={cn("rounded-full px-3 py-1 text-sm", {
                    "bg-primary-100 text-primary-800": u.role === "ADMIN",
                  })}
                >
                  {u.role === "ADMIN" ? "Administrador" : "Vendedor"}
                </span>
              </Table.Cell>
              <Table.Cell className="flex items-center justify-between">
                {u.name}
              </Table.Cell>
              <Table.Cell>{u.totalSales}</Table.Cell>
              <Table.Cell className="w-0">
                <UserDropdown id={u.id} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </section>
  )
}

function UserDropdown({ id }: { id: string }) {
  const fetcher = useFetcher({})

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant={"ghost"} className="p-1">
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
            fetcher.submit({ type: "user", id: id }, { method: "delete" })
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

function NewUserModal() {
  const response = useActionData<typeof action>()

  let errors: ErrorT[] = []
  if (response && !response.ok) {
    errors = response.error
  }

  useEffect(() => {
    if (!response) return
    if (response.ok) {
      toast({ title: "Usuário criado com sucesso!" })
    } else if (response.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível criar o usuário :(",
        variant: "destructive",
      })
    }
  }, [response])

  return (
    <Dialog.Content>
      <Dialog.Title>Novo usuário</Dialog.Title>

      <ErrorProvider initialErrors={errors}>
        <Form method="post" className="flex flex-col gap-4">
          <input type="hidden" name="actionType" value="user" />
          <FormGroup name="name" label="Nome">
            {(removeError) => (
              <Input
                onInput={removeError}
                name="name"
                placeholder="Nome do usuário..."
              />
            )}
          </FormGroup>
          <FormGroup name="password" label="Senha">
            {(removeError) => (
              <Input
                onInput={removeError}
                name="password"
                placeholder="Senha..."
                type="password"
              />
            )}
          </FormGroup>
          <FormGroup
            className="flex items-center gap-4"
            name="role"
            label="É administrador?"
          >
            {(removeError) => (
              <Checkbox id="role" name="role" onInput={removeError} />
            )}
          </FormGroup>

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
