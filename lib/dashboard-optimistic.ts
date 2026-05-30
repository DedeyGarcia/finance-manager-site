import { getMonthlyImpact, type MonthlyImpactInput } from "@/lib/expense"
import type { Dashboard } from "@/types/dashboard"
import type { ExpenseRead } from "@/types/expense"
import type { IncomeRead } from "@/types/income"

type Sign = 1 | -1

function formatMoney(value: number) {
  return value.toFixed(2)
}

/**
 * Ajusta os totais do dashboard pelo impacto de um gasto.
 * `sign = +1` adiciona (criação), `sign = -1` reverte (remoção/edição).
 * Para editar: reverte o gasto antigo (-1) e aplica o novo (+1).
 */
export function adjustDashboardForExpense(
  dashboard: Dashboard,
  expense: MonthlyImpactInput,
  sign: Sign
): Dashboard {
  const impact = getMonthlyImpact(expense) * sign

  const bucketKeyByType: Record<
    ExpenseRead["expense_type"],
    keyof Dashboard
  > = {
    one_time: "total_one_time_expenses",
    fixed: "total_fixed_expenses",
    automatic_debit: "total_automatic_expenses",
    installment: "total_installment_expenses",
  }
  const bucketKey = bucketKeyByType[expense.expense_type]

  return {
    ...dashboard,
    total_expenses: formatMoney(Number(dashboard.total_expenses) + impact),
    total_balance: formatMoney(Number(dashboard.total_balance) - impact),
    [bucketKey]: formatMoney(Number(dashboard[bucketKey]) + impact),
  }
}

type IncomeImpactInput = {
  amount: string | number
  income_type: IncomeRead["income_type"]
}

/**
 * Ajusta os totais do dashboard pelo impacto de uma receita.
 * `sign = +1` adiciona (criação), `sign = -1` reverte (remoção/edição).
 */
export function adjustDashboardForIncome(
  dashboard: Dashboard,
  income: IncomeImpactInput,
  sign: Sign
): Dashboard {
  const amount = Number(income.amount) * sign

  const bucketKey: keyof Dashboard =
    income.income_type === "recurring"
      ? "total_recurring_incomes"
      : "total_one_time_incomes"

  return {
    ...dashboard,
    total_incomes: formatMoney(Number(dashboard.total_incomes) + amount),
    total_balance: formatMoney(Number(dashboard.total_balance) + amount),
    [bucketKey]: formatMoney(Number(dashboard[bucketKey]) + amount),
  }
}
