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
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog"
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "~/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Checkbox } from "~/components/ui/checkbox"

import type { action, loader } from "./route"

export function UsersSection() {
  const { users } = useLoaderData<typeof loader>()

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Usuários</h2>

        <Dialog>
          <DialogTrigger asChild>
            <Button icon="left" className="text-sm">
              <Plus /> Novo
            </Button>
          </DialogTrigger>
          <NewUserModal />
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
              <TableCell className="flex items-center justify-between">
                {u.name}
                <UserDropdown id={u.id} />
              </TableCell>
              <TableCell>{u.totalSales}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function UserDropdown({ id }: { id: string }) {
  const fetcher = useFetcher({})

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"ghost"} className="p-1">
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Edit className="size-5" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => fetcher.submit({ id: id }, { method: "delete" })}
          variant="danger"
        >
          <Trash2 className="size-5" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
    <DialogContent>
      <DialogTitle>Novo usuário</DialogTitle>

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
  )
}
