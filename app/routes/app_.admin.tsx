import type { MetaFunction } from "react-router"
import { Link, Outlet, useLocation } from "react-router"

import { cn, maxWidth } from "~/lib/utils"

export const meta: MetaFunction = () => [
  {
    title: "Admin | Vendas Iboti",
  },
]

export default function Admin() {
  const location = useLocation()

  const isLinkActive = (path: string) => location.pathname.includes(path)

  return (
    <>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-4")}>
        <strong className="font-semibold text-lg">Admin</strong>

        <ul className="flex items-center justify-between gap-2">
          <li>
            <Link
              className={cn(
                "underline-offset-2 transition-colors hover:text-primary-600",
                isLinkActive("usuarios") && "underline",
              )}
              to="usuarios"
            >
              usuários
            </Link>
          </li>

          <li>
            <Link
              className={cn(
                "underline-offset-2 transition-colors hover:text-primary-600",
                isLinkActive("campanhas") && "underline",
              )}
              to="campanhas"
            >
              campanhas
            </Link>
          </li>

          <li>
            <Link
              className={cn(
                "underline-offset-2 transition-colors hover:text-primary-600",
                isLinkActive("origens") && "underline",
              )}
              to="origens"
            >
              origens
            </Link>
          </li>
        </ul>
      </nav>
      <hr className="border-primary-300" />

      <Outlet />

      <footer className="mt-16 py-16" />
    </>
  )
}
