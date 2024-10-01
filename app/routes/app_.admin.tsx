import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { Plus } from "lucide-react"
import { z } from "zod"

import { userRoleSchmea } from "~/db/schema"

import AuthService from "~/services/AuthService"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { typedError, typedOk } from "~/lib/result"
import { cn, maxWidth } from "~/lib/utils"

import { ErrorProvider, type ErrorT } from "~/context/ErrorsContext"

import { Button } from "~/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"

import FormGroup from "~/components/FormGroup"
import { Checkbox } from "~/components/ui/checkbox"

const formSchema = z.object({
  name: z.string({ required_error: "Insira o nome do usuário" }),
  password: z.string({ required_error: "Insira uma senha para o usuário" }),
  role: userRoleSchmea({ invalid_type_error: "Tipo de usuário inválido" }),
})

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    await getAdminOrRedirect(request)

    const formData = await request.formData()

    const data: Record<string, unknown> = {}

    for (const [field, value] of formData) {
      if (value) {
        data[field] = String(value)
      }
    }

    if (data.role === "on") {
      data.role = "ADMIN"
    } else {
      data.role = "SELLER"
    }

    const parsed = formSchema.safeParse(data)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        type: i.path.join("/"),
        message: i.message,
      }))

      return typedError(errors)
    }

    return typedOk(await AuthService.create(parsed.data))
  } catch (e) {
    return typedError([{ type: "backend", message: "unknown backend error" }])
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminOrRedirect(request)

  const users = await AuthService.index()

  return json(users)
}

export default function Admin() {
  const users = useLoaderData<typeof loader>()

  const response = useActionData<typeof action>()

  let errors: ErrorT[] = []
  if (response && !response.ok) {
    errors = response.error
  }

  return (
    <>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-4")}>
        <strong className="font-semibold text-lg">Admin</strong>
      </nav>
      <hr className="border-primary-300" />

      <section className={maxWidth("mt-8")}>
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-medium text-2xl">Usuários</h2>

          <Dialog>
            <DialogTrigger asChild>
              <Button icon="left" className="text-sm">
                <Plus /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Novo usuário</DialogTitle>

              <ErrorProvider initialErrors={errors}>
                <Form method="post" className="flex flex-col gap-4">
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

                  <DialogFooter className="mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="ghost">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit">Criar</Button>
                  </DialogFooter>
                </Form>
              </ErrorProvider>
            </DialogContent>
          </Dialog>
        </header>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0">Id</TableHead>
              <TableHead className="w-0">Tipo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Vendas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-sm text-zinc-600">{u.id}</TableCell>
                <TableCell>
                  <span
                    className={cn("rounded-full px-3 py-1 text-sm", {
                      "bg-primary-100 text-primary-800": u.role === "ADMIN",
                    })}
                  >
                    {u.role === "ADMIN" ? "Administrador" : "Vendedor"}
                  </span>
                </TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.totalSales}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  )
}
