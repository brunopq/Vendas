import type { MetaFunction } from "@remix-run/node"
import { Link, Outlet } from "@remix-run/react"

import { maxWidth } from "~/lib/utils"

export const meta: MetaFunction = () => [
  {
    title: "Admin | Vendas Iboti",
  },
]

export default function Admin() {
  return (
    <>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-4")}>
        <strong className="font-semibold text-lg">Admin</strong>
      </nav>
      <hr className="border-primary-300" />
      <Link className="ml-4" to="leads">
        leads
      </Link>
      <Link className="ml-4" to="usuarios">
        usuários
      </Link>
      <Link className="ml-4" to="campanhas">
        campanhas
      </Link>

      <Outlet />

      <footer className="mt-16 py-16" />
    </>
  )
}
