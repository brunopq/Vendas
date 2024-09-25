import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maxWidth(...inputs: ClassValue[]) {
  return cn("mx-auto w-[min(calc(100%-2rem),80rem)]", ...inputs)
}
