"use client"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { ExpenseRead } from "@/types/expense"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/expenses/${id}`, { method: "DELETE" }),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.list() })
      const previous = queryClient.getQueryData<ExpenseRead[]>(
        queryKeys.expenses.list()
      )
      queryClient.setQueryData<ExpenseRead[]>(
        queryKeys.expenses.list(),
        (current) => current?.filter((expense) => expense.id !== id)
      )
      return { previous }
    },

    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.expenses.list(), context.previous)
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
