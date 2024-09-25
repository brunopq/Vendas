import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"

import { getSession } from "~/session"

import { maxWidth } from "~/lib/utils"

import { Button } from "~/components/ui/button"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"))

  if (!session.get("user")) {
    return redirect("/login")
  }

  return json(session.data.user)
}

export default function App() {
  const user = useLoaderData<typeof loader>()

  return (
    <div>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-4")}>
        <h1>Olá, {user.name}</h1>

        <Button asChild variant="destructive" size="sm">
          <Link to="/sign-out">sair</Link>
        </Button>
      </nav>
      <hr className="border-primary-300" />
    </div>
  )
}
