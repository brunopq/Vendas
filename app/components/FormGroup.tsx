import { cn } from "~/lib/utils"

import { useError } from "~/context/ErrorsContext"

type FormGroupProps = {
  children: React.ReactNode | ((removeErrors: () => void) => React.ReactNode)
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
  const errorContext = useError({ validateProvider: false })

  const error = errorContext?.errors.find((error) => error.type.includes(name))
  const hasError = error?.type.includes(name)

  const removeErrors = () =>
    errorContext?.setErrors((p) => p.filter((e) => e.type.includes(name)))

  return (
    <div className={cn(className)}>
      <label className="col-span-full block text-sm" htmlFor={name}>
        {label}
      </label>

      {typeof children === "function" ? children(removeErrors) : children}

      {hasError && (
        <label htmlFor={name} className="col-span-full text-red-600">
          {/* biome-ignore lint/style/noNonNullAssertion: error is checked by hasError var */}
          {error!.message}
        </label>
      )}
    </div>
  )
}
