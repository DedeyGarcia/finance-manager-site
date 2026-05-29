import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value?: string | number) {
  if (!value) return "R$ 0,00"

  const num = typeof value === "string" ? parseFloat(value) : value
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}
