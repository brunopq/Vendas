import { redirect } from "react-router"

export function loader() {
  throw redirect("/app/admin/usuarios")
}
