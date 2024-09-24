import { Form } from "@remix-run/react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"

export default function Login() {
  return (
    <div className="h-screen bg-zinc-300 grid place-items-center">
      <div className="p-8 max-w-[calc(100vw-2rem)] bg-zinc-200 rounded shadow-sm ">
        <h2 className="text-xl mb-4 font-semibold text-primary-800">Login</h2>

        <Form className="flex flex-col gap-2">
          <Input placeholder="Usuário" />
          <Input type="password" placeholder="Senha" />
          <Button className="mt-2">Login</Button>
        </Form>
      </div>
    </div>
  )
}
