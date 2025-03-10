import type { Route } from "./+types/app_.admin.usuarios"
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useSearchParams,
} from "react-router"
import {
  Edit,
  EllipsisVertical,
  Plus,
  ShieldOffIcon,
  Trash2,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react"
import { useEffect, useId } from "react"
import { z, ZodError } from "zod"

import { toast } from "~/hooks/use-toast"

import { cn, maxWidth } from "~/lib/utils"
import { getAdminOrRedirect } from "~/lib/authGuard"
import { error, ok, type Result } from "~/lib/result"
import { brl } from "~/lib/formatters"
import { extractDateFromRequest } from "~/lib/extractDateFromRequest"

import { userRoleSchmea } from "~/db/schema"

import AuthService from "~/services/AuthService"
import UserService from "~/services/UserService"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import FormGroup from "~/components/FormGroup"
import { DateSelection } from "~/components/DateSelection"
import {
  Input,
  Button,
  DropdownMenu,
  Table,
  Dialog,
  Checkbox,
} from "~/components/ui"
import SalesService from "~/services/SalesService"

export async function loader({ request }: Route.LoaderArgs) {
  await getAdminOrRedirect(request)

  const { year, month } = extractDateFromRequest(request)

  const users = await UserService.listWithComissions(month, year)
  const totalEstimatedValue = await SalesService.getTotalEstimatedValueByMonth(
    month,
    year,
  )

  users.sort((a, b) => b.totalSales - a.totalSales)

  return { users, month, year, totalEstimatedValue }
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

const userSchema = z.object({
  name: z.string({ required_error: "Insira o nome do usuário" }),
  fullName: z.string().nullable(),
  password: z.string({ required_error: "Insira uma senha para o usuário" }),
  role: userRoleSchmea({ invalid_type_error: "Tipo de usuário inválido" }),
})
const updateUserSchema = userSchema.partial().extend({
  id: z.string(),
})

async function handleNewUser(data: Record<string, unknown>) {
  if (data.role === "on") {
    data.role = "ADMIN"
  } else {
    data.role = "SELLER"
  }

  const parsed = userSchema.parse(data)

  return await AuthService.create({ ...parsed, accountActive: true })
}

async function handleUpdateUser(data: Record<string, unknown>) {
  if (data.role === "on") {
    data.role = "ADMIN"
  } else {
    data.role = "SELLER"
  }

  const parsed = updateUserSchema.parse(data)

  if (parsed.password) {
    await AuthService.changePassword(parsed.id, parsed.password)
  }

  return await AuthService.updateUser(parsed.id, parsed)
}

async function handleDeleteUser(data: Record<string, unknown>) {
  const { id } = data
  if (!id) return

  await AuthService.delete(String(id))
}

const handleChangeAccountActiveSchema = z.object({
  id: z.string(),
  accountActive: z.enum(["true", "false"]).transform((v) => v === "true"),
})
async function handleChangeAccountActive(data: Record<string, unknown>) {
  const { id, accountActive } = handleChangeAccountActiveSchema.parse(data)

  await AuthService.updateUser(id, { accountActive: accountActive })
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
    return handle("DELETE", () => handleDeleteUser(data))
  }
  if (request.method === "POST") {
    return handle("POST", () => handleNewUser(data))
  }
  if (request.method === "PUT") {
    return handle("PUT", () => handleUpdateUser(data))
  }
  if (request.method === "PATCH") {
    return handle("PATCH", () => handleChangeAccountActive(data))
  }
  console.log("method not implemented")

  return {
    method: request.method,
    type: data.actionType,
    result: error([
      {
        type: "not implemented",
        message: `method: ${request.method}, type: ${data.actionType} is not implemented`,
      },
    ]),
  }
}

export default function Users({ loaderData }: Route.ComponentProps) {
  const { users, month, year } = loaderData

  const [_, setSearchParams] = useSearchParams()

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Usuários</h2>
      </header>
      <fieldset className="mb-4 flex items-end justify-start gap-6">
        <span className="min-w-max text-sm text-zinc-800">
          Período das vendas:
          <DateSelection
            month={month}
            year={year}
            onChange={({ month, year }) =>
              setSearchParams({ mes: String(month), ano: String(year) })
            }
          />
        </span>

        <Button asChild variant="outline" className="py-[7px] text-sm">
          <Link
            reloadDocument
            to={{
              pathname: "/app/admin/relatorio",
              search: new URLSearchParams({
                mes: month.toString(),
                ano: year.toString(),
              }).toString(),
            }}
          >
            Gerar relatório de metas
          </Link>
        </Button>

        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button icon="left" className="text-sm">
              <Plus className="size-5" /> Novo
            </Button>
          </Dialog.Trigger>
          <NewUserModal />
        </Dialog.Root>

        <span className="w-full text-end">
          Valor total estimado: <br />
          <strong className="font-semibold text-primary-700">
            {brl(loaderData.totalEstimatedValue || 0)}
          </strong>
        </span>
      </fieldset>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Nome</Table.Head>
            <Table.Head className="w-0">Tipo</Table.Head>
            <Table.Head>Nome completo</Table.Head>
            <Table.Head>Vendas</Table.Head>
            <Table.Head>Comissão individual</Table.Head>
            <Table.Head>Comissão total</Table.Head>
            <Table.Head />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((u) => (
            <Table.Row
              className={u.accountActive ? "opacity-100" : "opacity-75"}
              key={u.id}
            >
              <Table.Cell className="flex items-center justify-between">
                {u.name}
              </Table.Cell>
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
                {u.fullName}
              </Table.Cell>
              <Table.Cell>{u.totalSales}</Table.Cell>
              <Table.Cell>{brl(u.comission.totalUserComission)}</Table.Cell>
              <Table.Cell>{brl(u.comission.totalComission)}</Table.Cell>
              <Table.Cell className="w-0">
                <UserDropdown
                  id={u.id}
                  name={u.name}
                  fullName={u.fullName}
                  isAdmin={u.role === "ADMIN"}
                  accountActive={u.accountActive}
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
  fullName: string | null
  isAdmin: boolean
  accountActive: boolean
}

function UserDropdown({
  id,
  name,
  fullName,
  isAdmin,
  accountActive,
}: UserDropdownProps) {
  const fetcher = useFetcher({})

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant={"ghost"} className="p-1">
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <EditUserModal {...{ id, name, fullName, isAdmin }}>
          <DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
            <Edit className="size-5" />
            Editar
          </DropdownMenu.Item>
        </EditUserModal>

        <DropdownMenu.Item
          onClick={() =>
            fetcher.submit(
              {
                actionType: "setAccountActive",
                id: id,
                accountActive: !accountActive,
              },
              { method: "PATCH" },
            )
          }
          variant={accountActive ? "danger" : "normal"}
        >
          {accountActive ? (
            <>
              <UserXIcon className="size-5" />
              Desativar
            </>
          ) : (
            <>
              <UserCheckIcon className="size-5" />
              Ativar
            </>
          )}
        </DropdownMenu.Item>

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
    fullName: string | null
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

      <FormGroup name="fullName" label="Nome completo">
        {(removeError) => (
          <Input
            defaultValue={user?.fullName || undefined}
            onInput={removeError}
            name="fullName"
            placeholder="Nome completo..."
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
  fullName: string | null
  isAdmin: boolean
}

function EditUserModal({
  children,
  id,
  name,
  fullName,
  isAdmin,
}: EditUserModalProps) {
  const fetcher = useFetcher<typeof action>({ key: useId() })
  const response = fetcher.data

  let putUserAction: typeof response = undefined

  if (response?.method === "PUT") {
    putUserAction = response
  }

  let errors: ErrorT[] = []
  if (putUserAction && !putUserAction.result.ok) {
    errors = putUserAction.result.error
  }

  useEffect(() => {
    if (!putUserAction) return
    if (putUserAction.result.ok) {
      toast({ title: "Usuário editado!" })
      console.log(putUserAction.result.value)
    } else if (putUserAction.result.error.find((e) => e.type === "backend")) {
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

          <BasicUserFormFields user={{ name, fullName, isAdmin }} />

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
