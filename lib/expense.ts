import type { ExpenseRead } from "@/types/expense"

type MonthlyImpactInput = {
  amount: string | number
  expense_type: ExpenseRead["expense_type"]
  installments_count: number | null
}

/** Impacto mensal: amount/installments para parcelamento; senão o amount cheio. */
export function getMonthlyImpact(expense: MonthlyImpactInput): number {
  const amount =
    typeof expense.amount === "string" ? parseFloat(expense.amount) : expense.amount
  if (
    expense.expense_type === "installment" &&
    expense.installments_count &&
    expense.installments_count > 0
  ) {
    return amount / expense.installments_count
  }
  return amount
}

/**
 * Regra de período do domínio (CLAUDE.md):
 *   start <= periodEnd && (end === null || end >= periodStart)
 * Datas em ISO "yyyy-MM-dd" — comparação lexicográfica é equivalente à cronológica.
 */
export function isActiveInPeriod(
  impactStart: string,
  impactEnd: string | null,
  periodStart: string,
  periodEnd: string
): boolean {
  return (
    impactStart <= periodEnd && (impactEnd === null || impactEnd >= periodStart)
  )
}
