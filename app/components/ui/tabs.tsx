import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "~/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex w-full items-center justify-center border-primary-200 border-b p-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

type TabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
> & {
  size?: "sm" | "md" | "lg"
}
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, size = "md", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap transition-colors hover:bg-primary-50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-primary-900 dark:ring-offset-zinc-950 dark:data-[state=active]:bg-zinc-950 dark:data-[state=active]:text-zinc-50 dark:focus-visible:ring-zinc-300",
      size === "sm" && "rounded-sm px-3 py-1 font-medium text-sm",
      size === "md" && "rounded-sm px-3 py-1.5 font-medium",
      size === "lg" && "rounded-md px-5 py-2 font-medium text-lg",
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 p-6 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
