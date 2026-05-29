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

function toOptimisticExpense(input: ExpenseCreate): ExpenseRead {
  const now = new Date().toISOString()

  return {
    id: `optimistic-${crypto.randomUUID()}`,
    user_id: "optimistic",
    category_id: input.category_id ?? null,
    title: input.title,
    description: input.description ?? null,
    amount: String(input.amount),
    expense_type: input.expense_type,
    purchase_date: input.purchase_date ?? null,
    impact_start_date: input.impact_start_date,
    impact_end_date: input.impact_end_date ?? null,
    installments_count: Number(input.installments_count),
    source_text: input.source_text ?? null,
    created_at: now,
    updated_at: now,
  }
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
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.list() })

      const previousDashboardQueries = queryClient.getQueriesData<Dashboard>({
        queryKey: queryKeys.dashboard.all,
      })
      const previousList = queryClient.getQueryData<ExpenseRead[]>(
        queryKeys.expenses.list()
      )

      queryClient.setQueriesData<Dashboard>(
        { queryKey: queryKeys.dashboard.all },
        (current) =>
          current ? applyOptimisticExpense(current, input) : current
      )
      queryClient.setQueryData<ExpenseRead[]>(
        queryKeys.expenses.list(),
        (current) =>
          current ? [toOptimisticExpense(input), ...current] : current
      )

      return { previousDashboardQueries, previousList }
    },

    onError: (_error, _input, context) => {
      for (const [queryKey, data] of context?.previousDashboardQueries ?? []) {
        queryClient.setQueryData(queryKey, data)
      }
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.expenses.list(), context.previousList)
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
    },
  })
}
