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

  const error = errorContext?.errors.find((error) => error.type === name)
  const hasError = error?.type === name

  const removeErrors = () =>
    errorContext?.setErrors((p) => p.filter((e) => e.type !== name))

  return (
    <div className={cn(className)}>
      <label className="block text-sm" htmlFor={name}>
        {label}
      </label>

      {typeof children === "function" ? children(removeErrors) : children}

      {hasError && (
        <label htmlFor={name} className="text-red-600">
          {error.message}
        </label>
      )}
    </div>
  )
}
