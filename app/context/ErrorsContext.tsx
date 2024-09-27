import { createContext, useContext, useEffect, useState } from "react"

// not to be conflicted with Error class
export type ErrorT = {
  type: string
  message: string
}

type ErrorContext = {
  errors: ErrorT[]
  setErrors: (errors: ErrorT[] | ((errors: ErrorT[]) => ErrorT[])) => void
}

const errorContext = createContext<ErrorContext | null>(null)

type ErrorProviderProps = {
  children: React.ReactNode
  initialErrors?: ErrorT[]
}

export function ErrorProvider({ children, initialErrors }: ErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorT[]>(initialErrors ?? [])

  useEffect(() => {
    setErrors(initialErrors ?? [])
  }, [initialErrors])

  return (
    <errorContext.Provider value={{ errors, setErrors }}>
      {children}
    </errorContext.Provider>
  )
}

export function useError({ validateProvider } = { validateProvider: true }) {
  const context = useContext(errorContext)
  if (validateProvider && !context) {
    throw new Error("useError must be used within a ErrorProvider")
  }
  return context
}
