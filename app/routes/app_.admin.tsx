import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { Form, useLoaderData } from "@remix-run/react"
import { Plus } from "lucide-react"

import AuthService from "~/services/AuthService"
import { getUser } from "~/session"

import { maxWidth } from "~/lib/utils"

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request)

  // if (user.role !== "admin") {
  //   return redirect("/app", { status: 403 })
  // }

  const users = await AuthService.index()

  return json(users)
}

export default function Admin() {
  const users = useLoaderData<typeof loader>()

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

              <Form className="flex flex-col gap-4">
                <FormGroup name="name" label="Nome">
                  <Input name="name" placeholder="Nome do usuário..." />
                </FormGroup>
                <FormGroup name="password" label="Senha">
                  <Input
                    name="password"
                    placeholder="Senha..."
                    type="password"
                  />
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
            </DialogContent>
          </Dialog>
        </header>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Id</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Vendas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-sm text-zinc-600">{u.id}</TableCell>
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
