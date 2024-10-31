import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maxWidth(...inputs: ClassValue[]) {
  return cn("mx-auto w-[min(calc(100%-2rem),64rem)]", ...inputs)
}

export function glass(...inputs: ClassValue[]) {
  return cn("bg-zinc-50/50 backdrop-blur-2xl ", ...inputs)
}
