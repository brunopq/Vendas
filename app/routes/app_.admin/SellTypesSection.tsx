import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"

import { toast } from "~/hooks/use-toast"

import { brl, currencyToNumber } from "~/lib/formatters"
import { maxWidth } from "~/lib/utils"

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
import { Button } from "~/components/ui/button"
import { BrlInput, Input } from "~/components/ui/input"

import type { action, loader } from "./route"

export function SellTypesSection() {
  const { sellTypes } = useLoaderData<typeof loader>()

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Categorias e metas</h2>

        <Dialog>
          <DialogTrigger asChild>
            <Button icon="left" className="text-sm">
              <Plus /> Novo
            </Button>
          </DialogTrigger>

          <DialogContent>
            <NewSellTypeModal />
          </DialogContent>
        </Dialog>
      </header>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-0">Id</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Meta de vendas</TableHead>
            <TableHead>Comissão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sellTypes.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="text-sm text-zinc-600">{s.id}</TableCell>
              <TableCell>{s.name}</TableCell>
              <TableCell>{s.goal}</TableCell>
              <TableCell>{brl(s.prize)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function NewSellTypeModal() {
  const response = useActionData<typeof action>()

  let errors: ErrorT[] = []
  if (response && !response.ok) {
    errors = response.error
  }

  const [goal, setGoal] = useState<number>(0)
  const [prize, setPrize] = useState<number>(0)

  useEffect(() => {
    if (!response) return
    if (response.ok) {
      toast({ title: "Categoria registrada com sucesso!" })
    } else if (response.error.find((e) => e.type === "backend")) {
      toast({
        title: "Erro desconhecido",
        description: "Não foi possível registrar nova categoria :(",
        variant: "destructive",
      })
    }
  }, [response])

  return (
    <>
      <DialogTitle>Nova categoria</DialogTitle>

      <ErrorProvider initialErrors={errors}>
        <Form method="post" className="flex flex-col gap-4">
          <input type="hidden" name="actionType" value="sellType" />
          <FormGroup name="category" label="Nome da categoria">
            {(removeError) => (
              <Input
                onInput={removeError}
                name="category"
                placeholder="Categoria..."
              />
            )}
          </FormGroup>
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
    </>
  )
}
