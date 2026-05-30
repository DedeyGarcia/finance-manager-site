"use client"

import { apiFetch } from "@/lib/api-client"
import { adjustDashboardForExpense } from "@/lib/dashboard-optimistic"
import { queryKeys } from "@/lib/query-keys"
import type { Dashboard } from "@/types/dashboard"
import type { ExpenseRead, ExpenseUpdate } from "@/types/expense"
import { useMutation, useQueryClient } from "@tanstack/react-query"

type UpdateExpenseInput = { id: string; input: ExpenseUpdate }

function mergeExpense(old: ExpenseRead, input: ExpenseUpdate): ExpenseRead {
  return {
    ...old,
    category_id: input.category_id ?? old.category_id,
    title: input.title ?? old.title,
    description: input.description !== undefined ? input.description : old.description,
    amount: input.amount != null ? Number(input.amount).toFixed(2) : old.amount,
    expense_type: input.expense_type ?? old.expense_type,
    purchase_date:
      input.purchase_date !== undefined ? input.purchase_date : old.purchase_date,
    impact_start_date: input.impact_start_date ?? old.impact_start_date,
    impact_end_date:
      input.impact_end_date !== undefined ? input.impact_end_date : old.impact_end_date,
    installments_count:
      input.installments_count != null
        ? Number(input.installments_count)
        : old.installments_count,
    source_text: input.source_text !== undefined ? input.source_text : old.source_text,
    updated_at: new Date().toISOString(),
  }
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: UpdateExpenseInput) =>
      apiFetch<ExpenseRead>(`/api/expenses/${id}`, {
        method: "PATCH",
        body: input,
      }),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.list() })

      const previousDashboardQueries = queryClient.getQueriesData<Dashboard>({
        queryKey: queryKeys.dashboard.all,
      })
      const previousList = queryClient.getQueryData<ExpenseRead[]>(
        queryKeys.expenses.list()
      )

      const old = previousList?.find((expense) => expense.id === id)
      if (!old) return { previousDashboardQueries, previousList }

      const updated = mergeExpense(old, input)

      queryClient.setQueryData<ExpenseRead[]>(
        queryKeys.expenses.list(),
        (current) =>
          current?.map((expense) => (expense.id === id ? updated : expense))
      )
      queryClient.setQueriesData<Dashboard>(
        { queryKey: queryKeys.dashboard.all },
        (current) =>
          current
            ? adjustDashboardForExpense(
                adjustDashboardForExpense(current, old, -1),
                updated,
                1
              )
            : current
      )

      return { previousDashboardQueries, previousList }
    },

    onError: (_error, _vars, context) => {
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
