import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node"
import { Plus } from "lucide-react"

import AuthService from "~/services/AuthService"
import { getUser } from "~/session"

import { maxWidth } from "~/lib/utils"

import { Button } from "~/components/ui/button"
import { useLoaderData } from "@remix-run/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"

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

          <Button icon="left" className="text-sm">
            <Plus /> Novo
          </Button>
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
