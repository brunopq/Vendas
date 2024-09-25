import { cn } from "~/lib/utils"

type FormGroupProps = {
  children: React.ReactNode
  name: string
  label: string
  className?: string
}

export default function FormGroup({
  children,
  label,
  name,
  className,
}: FormGroupProps) {
  return (
    <div className={cn(className)}>
      <label className="block text-sm" htmlFor={name}>
        {label}
      </label>

      {children}
    </div>
  )
}
