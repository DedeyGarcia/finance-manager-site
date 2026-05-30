import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trunca um valor monetário nos centavos, em direção ao zero (não arredonda),
 * para bater com o extrato do banco. O epsilon evita truncar um centavo a menos
 * por imprecisão de ponto flutuante (ex: 95.55 * 100 = 9554.9999…). O `|| 0`
 * normaliza o -0 que surgiria de valores negativos muito pequenos.
 */
export function truncateToCents(value: number): number {
  return (Math.sign(value) * Math.floor(Math.abs(value) * 100 + 1e-6)) / 100 || 0
}

export function formatCurrency(value?: string | number) {
  if (!value) return "R$ 0,00"

  const num = typeof value === "string" ? parseFloat(value) : value

  // Os totais do dashboard chegam do backend com a precisão cheia do Decimal
  // (ex: "385.0233333…"); truncamos aqui para nunca arredondar centavos pra cima.
  return truncateToCents(num).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}
