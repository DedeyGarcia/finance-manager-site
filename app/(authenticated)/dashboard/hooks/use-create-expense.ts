"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"
import { adjustDashboardForExpense } from "@/lib/dashboard-optimistic"
import { queryKeys } from "@/lib/query-keys"
import type { Dashboard } from "@/types/dashboard"
import type { ExpenseCreate, ExpenseRead } from "@/types/expense"

function toOptimisticExpense(input: ExpenseCreate): ExpenseRead {
  const now = new Date().toISOString()

  return {
    id: `optimistic-${crypto.randomUUID()}`,
    user_id: "optimistic",
    category_id: input.category_id ?? null,
    title: input.title,
    description: input.description ?? null,
    amount: Number(input.amount).toFixed(2),
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
          current ? adjustDashboardForExpense(current, input, 1) : current
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
