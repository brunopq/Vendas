import { Form, json, useLoaderData } from "@remix-run/react"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { useState, type ChangeEvent } from "react"
import Papa from "papaparse"

import { maxWidth } from "~/lib/utils"

import AuthService from "~/services/AuthService"

import { Button, Dialog, Input, Select, Table } from "~/components/ui"
import FormGroup from "~/components/FormGroup"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const users = await AuthService.index()

  return json(users)
}

export default function List() {
  const [headers, setHeaders] = useState<string[]>()
  const [data, setData] = useState<string[][]>([])
  const [totalSize, setTotalSize] = useState<number>()

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0)
    if (file) {
      Papa.parse(file, {
        // header: true,
        skipEmptyLines: true,
        complete(results, file) {
          console.log(results)
          setHeaders(results.data[0] as string[])
          setData(results.data.slice(1, 16) as string[][])
          setTotalSize(results.data.length - 1)
        },
        error(error, file) {
          console.log(error)
        },
      })
    }
  }

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Carregar lista</h2>
      </header>
      <Input onChange={handleChange} className="" type="file" accept=".csv" />

      <div className="mt-16 mb-8 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-lg text-primary-800">
            Amostra dos dados carregados:
          </h3>
          <span className="">
            Mostrando {data.length} registros de {totalSize || 0}
          </span>
        </div>

        {headers && totalSize && (
          <CreateLeadsModal count={totalSize} headers={headers}>
            <Button>Criar vendas</Button>
          </CreateLeadsModal>
        )}
      </div>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            {headers?.map((h, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <Table.Head key={i}>{h}</Table.Head>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.map((d, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <Table.Row key={i}>
              {d.map((c, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <Table.Cell key={i}>{c}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </section>
  )
}

type CreateLeadsModalProps = {
  children: JSX.Element
  count: number
  headers: string[]
}

function CreateLeadsModal({ children, count, headers }: CreateLeadsModalProps) {
  const users = useLoaderData<typeof loader>()

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:40rem]">
        <Dialog.Header>
          <Dialog.Title>Criar {count} vendas</Dialog.Title>
          <Dialog.Description>
            Selecione o vendedor para os atendimentos e como os campos devem ser
            mapeados da planilha para o sistema. As colunas não selecionadas
            serão criadas como campos extra.
          </Dialog.Description>
        </Dialog.Header>

        <Form className="grid grid-cols-2 gap-4">
          <FormGroup name="asignee" label="Vendedor">
            <Select.Root>
              <Select.Trigger>
                <Select.Value placeholder="Escolha o vendedor..." />
              </Select.Trigger>
              <Select.Content>
                {users.map((u) => (
                  <Select.Item value={u.id} key={u.id}>
                    {u.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </FormGroup>

          <FormGroup name="date" label="Data">
            <Select.Root>
              <Select.Trigger>
                <Select.Value placeholder="" />
              </Select.Trigger>
              <Select.Content>
                {headers.map((h) => (
                  <Select.Item value={h || "no_value"} key={h}>
                    {h}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </FormGroup>

          <FormGroup name="origin" label="Origem do lead">
            <Select.Root>
              <Select.Trigger>
                <Select.Value placeholder="" />
              </Select.Trigger>
              <Select.Content>
                {headers.map((h) => (
                  <Select.Item value={h || "no_value"} key={h}>
                    {h}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </FormGroup>

          <FormGroup name="name" label="Cliente">
            <Select.Root>
              <Select.Trigger>
                <Select.Value placeholder="" />
              </Select.Trigger>
              <Select.Content>
                {headers.map((h) => (
                  <Select.Item value={h || "no_value"} key={h}>
                    {h}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </FormGroup>

          <FormGroup name="area" label="Área">
            <Select.Root>
              <Select.Trigger>
                <Select.Value placeholder="" />
              </Select.Trigger>
              <Select.Content>
                {headers.map((h) => (
                  <Select.Item value={h || "no_value"} key={h}>
                    {h}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </FormGroup>

          <FormGroup name="cpf" label="CPF">
            <Select.Root>
              <Select.Trigger>
                <Select.Value placeholder="" />
              </Select.Trigger>
              <Select.Content>
                {headers.map((h) => (
                  <Select.Item value={h || "no_value"} key={h}>
                    {h}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </FormGroup>

          <FormGroup name="phoneNumbers" label="Números de telefone">
            <Select.Root>
              <Select.Trigger>
                <Select.Value placeholder="" />
              </Select.Trigger>
              <Select.Content>
                {headers.map((h) => (
                  <Select.Item value={h || "no_value"} key={h}>
                    {h}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </FormGroup>

          <Dialog.Footer className="col-span-full mt-4">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit">Criar</Button>
          </Dialog.Footer>
        </Form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
