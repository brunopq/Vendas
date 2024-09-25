import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "~/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "size-4 rounded-full border border-primary-900 p-0.5 text-primary-900 outline-none ring-primary-400 ring-offset-4 ring-offset-zinc-200 transition-colors hover:bg-primary-100 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator>
        <div className="size-full rounded-full bg-primary-700" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
