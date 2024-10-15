import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react"
import { Edit, EllipsisVertical, Plus, Trash2 } from "lucide-react"
import React from "react"
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

import { getResult, type action, type loader } from "./route"

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
                <UserDropdown
                  id={u.id}
                  name={u.name}
                  isAdmin={u.role === "ADMIN"}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </section>
  )
}

type UserDropdownProps = {
  id: string
  name: string
  isAdmin: boolean
}

function UserDropdown({ id, name, isAdmin }: UserDropdownProps) {
  const fetcher = useFetcher({})

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant={"ghost"} className="p-1">
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <EditUserModal {...{ id, name, isAdmin }}>
          <DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
            <Edit className="size-5" />
            Editar
          </DropdownMenu.Item>
        </EditUserModal>
        <DropdownMenu.Item
          onClick={() =>
            fetcher.submit({ actionType: "user", id: id }, { method: "DELETE" })
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

type BasicUserFormFieldsProps = {
  user?: Partial<{
    name: string
    isAdmin: boolean
  }>
}

function BasicUserFormFields({ user }: BasicUserFormFieldsProps) {
  return (
    <>
      <FormGroup name="name" label="Nome">
        {(removeError) => (
          <Input
            defaultValue={user?.name}
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
          <Checkbox
            defaultChecked={user?.isAdmin}
            id="role"
            name="role"
            onInput={removeError}
          />
        )}
      </FormGroup>
    </>
  )
}

function NewUserModal() {
  const response = useActionData<typeof action>()

  const postUserAction = getResult(response, "POST", "user")

  let errors: ErrorT[] = []
  if (postUserAction && !postUserAction.ok) {
    errors = postUserAction.error
  }

  useEffect(() => {
    if (!postUserAction) return
    if (postUserAction.ok) {
      toast({ title: "Usuário criado com sucesso!" })
      console.log(postUserAction.value)
    } else if (postUserAction.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível criar o usuário :(",
        variant: "destructive",
      })
    }
  }, [postUserAction])

  return (
    <Dialog.Content>
      <Dialog.Title>Novo usuário</Dialog.Title>

      <ErrorProvider initialErrors={errors}>
        <Form method="POST" className="flex flex-col gap-4">
          <input type="hidden" name="actionType" value="user" />

          <BasicUserFormFields />

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

type EditUserModalProps = {
  children: React.ReactElement
  id: string
  name: string
  isAdmin: boolean
}

function EditUserModal({ children, id, name, isAdmin }: EditUserModalProps) {
  const fetcher = useFetcher<typeof action>({ key: React.useId() })
  const response = fetcher.data

  const putUserAction = getResult(response, "PUT", "user")

  let errors: ErrorT[] = []
  if (putUserAction && !putUserAction.ok) {
    errors = putUserAction.error
  }

  useEffect(() => {
    if (!putUserAction) return
    if (putUserAction.ok) {
      toast({ title: "Usuário editado!" })
      console.log(putUserAction.value)
    } else if (putUserAction.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível editar o usuário :(",
        variant: "destructive",
      })
    }
  }, [putUserAction])

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content>
        <Dialog.Title>
          Editar{" "}
          <strong className="font-semibold text-primary-600">{name}</strong>
        </Dialog.Title>

        <fetcher.Form method="PUT" className="flex flex-col gap-4">
          <input type="hidden" name="actionType" value="user" />
          <input type="hidden" name="id" value={id} />

          <BasicUserFormFields user={{ name, isAdmin }} />

          <small className="mt-4 text-end text-zinc-600">
            Se não fornecida, a senha não será alterada
          </small>
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
