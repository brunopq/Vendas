import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { Link, Outlet, useLoaderData } from "@remix-run/react"

import { maxWidth } from "~/lib/utils"
import { getUserOrRedirect } from "~/lib/authGuard"

import { Button } from "~/components/ui"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json(await getUserOrRedirect(request, "/login"))
}

export default function App() {
  const user = useLoaderData<typeof loader>()

  return (
    <div>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-4")}>
        <strong className="font-semibold text-lg text-primary-800">
          Olá, {user.name}
        </strong>

        <Button asChild variant="destructive" size="sm">
          <Link to="/sign-out">sair</Link>
        </Button>
      </nav>
      <hr className="border-primary-300" />

      <div className={maxWidth("mt-8")}>
        <Outlet />
      </div>
    </div>
  )
}
