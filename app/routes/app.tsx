import {
  json,
  type MetaFunction,
  type LoaderFunctionArgs,
} from "@remix-run/node"
import { Link, Outlet, useLoaderData } from "@remix-run/react"
import { KeyRound, LogOut, Menu } from "lucide-react"

import { maxWidth } from "~/lib/utils"
import { getUserOrRedirect } from "~/lib/authGuard"

import { DropdownMenu } from "~/components/ui"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json(await getUserOrRedirect(request, "/login"))
}

export const meta: MetaFunction = () => [
  {
    title: "Vendas Iboti",
  },
]

export default function App() {
  const user = useLoaderData<typeof loader>()

  return (
    <div>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-4")}>
        <strong className="font-semibold text-lg text-primary-800">
          Olá, {user.name}
        </strong>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Menu />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item asChild>
              <Link to="/trocasenha">
                <KeyRound className="size-5" /> Trocar senha
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild variant="danger">
              <Link to="/sign-out">
                <LogOut className="size-5" />
                Sair
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </nav>
      <hr className="border-primary-300" />

      <div className={maxWidth("mt-8")}>
        <Outlet />
      </div>
    </div>
  )
}
