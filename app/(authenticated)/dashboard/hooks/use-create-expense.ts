"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"
import { getMonthlyImpact } from "@/lib/expense"
import { queryKeys } from "@/lib/query-keys"
import type { Dashboard } from "@/types/dashboard"
import type { ExpenseCreate, ExpenseRead } from "@/types/expense"

function formatMoney(value: number) {
  return value.toFixed(2)
}

function applyOptimisticExpense(dashboard: Dashboard, expense: ExpenseCreate) {
  const impact = getMonthlyImpact(expense)

  return {
    ...dashboard,
    total_expenses: formatMoney(Number(dashboard.total_expenses) + impact),
    total_balance: formatMoney(Number(dashboard.total_balance) - impact),
    total_one_time_expenses:
      expense.expense_type === "one_time"
        ? formatMoney(Number(dashboard.total_one_time_expenses) + impact)
        : dashboard.total_one_time_expenses,
    total_fixed_expenses:
      expense.expense_type === "fixed"
        ? formatMoney(Number(dashboard.total_fixed_expenses) + impact)
        : dashboard.total_fixed_expenses,
    total_automatic_expenses:
      expense.expense_type === "automatic_debit"
        ? formatMoney(Number(dashboard.total_automatic_expenses) + impact)
        : dashboard.total_automatic_expenses,
    total_installment_expenses:
      expense.expense_type === "installment"
        ? formatMoney(Number(dashboard.total_installment_expenses) + impact)
        : dashboard.total_installment_expenses,
  }
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ExpenseCreate) =>
      apiFetch<ExpenseRead>("/api/expenses", {
        method: "POST",
        body: input,
      }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.dashboard.all,
      })

      const previousDashboardQueries = queryClient.getQueriesData<Dashboard>({
        queryKey: queryKeys.dashboard.all,
      })

      queryClient.setQueriesData<Dashboard>(
        { queryKey: queryKeys.dashboard.all },
        (current) =>
          current ? applyOptimisticExpense(current, input) : current
      )

      return { previousDashboardQueries }
    },

    onError: (_error, _input, context) => {
      for (const [queryKey, data] of context?.previousDashboardQueries ?? []) {
        queryClient.setQueryData(queryKey, data)
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      })
    },
  })
}
