"use client"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { IncomeRead } from "@/types/income"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useDeleteIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/incomes/${id}`, { method: "DELETE" }),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.incomes.list() })
      const previous = queryClient.getQueryData<IncomeRead[]>(
        queryKeys.incomes.list()
      )
      queryClient.setQueryData<IncomeRead[]>(
        queryKeys.incomes.list(),
        (current) => current?.filter((income) => income.id !== id)
      )
      return { previous }
    },

    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.incomes.list(), context.previous)
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
