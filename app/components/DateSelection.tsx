import { Form } from "@remix-run/react"
import { useEffect, useState } from "react"

import { months } from "~/constants/months"

import { Select } from "./ui"

type DateSelectionProps = {
  month: number
  year: number
  onChange: (date: { month: number; year: number }) => void
}

export function DateSelection({ month, year, onChange }: DateSelectionProps) {
  const [date, setDate] = useState({ month, year })

  const setMonth = (month: number) => {
    onChange({ month, year })
    setDate((p) => ({ ...p, month }))
  }

  const setYear = (year: number) => {
    onChange({ month, year })
    setDate((p) => ({ ...p, year }))
  }

  return (
    <Form className="flex gap-1">
      <Select.Root
        onValueChange={(v) => setMonth(Number(v))}
        name="mes"
        defaultValue={`${month}`}
      >
        <Select.Trigger showIcon={false} className="w-fit py-1.5 text-sm">
          <Select.Value placeholder="Trocar mês" />
        </Select.Trigger>
        <Select.Content className="max-h-64">
          {months.map((m, i) => (
            <Select.Item key={m} value={`${i + 1}`}>
              {m}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root
        onValueChange={(v) => setYear(Number(v))}
        name="ano"
        defaultValue={`${year}`}
      >
        <Select.Trigger showIcon={false} className="w-fit py-1.5 text-sm">
          <Select.Value placeholder="Trocar ano" />
        </Select.Trigger>
        <Select.Content className="max-h-64">
          {[2023, 2024, 2025].map((a) => (
            <Select.Item key={a} value={`${a}`}>
              {a}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Form>
  )
}
