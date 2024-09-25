import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { getUser } from "~/session"

import SalesService from "~/services/SalesService"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Link, useLoaderData } from "@remix-run/react"
import { Button } from "~/components/ui/button"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = getUser(request)

  const data = await SalesService.index()

  return json(data)
}

export default function App() {
  const data = useLoaderData<typeof loader>()
  return (
    <div>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Vendas recentes</h2>

        <Button variant="link" asChild>
          <Link to="venda">Nova venda</Link>
        </Button>
      </header>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>id</TableHead>
            <TableHead>seller</TableHead>
            <TableHead>area</TableHead>
            <TableHead>adverse party</TableHead>
            <TableHead>estimated value</TableHead>
            <TableHead>is repurchase</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.id}</TableCell>
              <TableCell>{d.seller}</TableCell>
              <TableCell>{d.area}</TableCell>
              <TableCell>{d.adverseParty}</TableCell>
              <TableCell>{d.estimatedValue}</TableCell>
              <TableCell>{d.isRepurchase}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
