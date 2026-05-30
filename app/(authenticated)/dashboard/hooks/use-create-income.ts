"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"
import { adjustDashboardForIncome } from "@/lib/dashboard-optimistic"
import { queryKeys } from "@/lib/query-keys"
import type { Dashboard } from "@/types/dashboard"
import type { IncomeCreate, IncomeRead } from "@/types/income"

function toOptimisticIncome(input: IncomeCreate): IncomeRead {
  const now = new Date().toISOString()

  return {
    id: `optimistic-${crypto.randomUUID()}`,
    user_id: "optimistic",
    category_id: input.category_id ?? null,
    title: input.title,
    description: input.description ?? null,
    amount: Number(input.amount).toFixed(2),
    income_type: input.income_type,
    received_date: input.received_date ?? null,
    impact_start_date: input.impact_start_date,
    impact_end_date: input.impact_end_date ?? null,
    source_text: input.source_text ?? null,
    created_at: now,
    updated_at: now,
  }
}

export function useCreateIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: IncomeCreate) =>
      apiFetch<IncomeRead>("/api/incomes", {
        method: "POST",
        body: input,
      }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.incomes.list() })

      const previousDashboardQueries = queryClient.getQueriesData<Dashboard>({
        queryKey: queryKeys.dashboard.all,
      })
      const previousList = queryClient.getQueryData<IncomeRead[]>(
        queryKeys.incomes.list()
      )

      queryClient.setQueriesData<Dashboard>(
        { queryKey: queryKeys.dashboard.all },
        (current) => (current ? adjustDashboardForIncome(current, input, 1) : current)
      )
      queryClient.setQueryData<IncomeRead[]>(
        queryKeys.incomes.list(),
        (current) =>
          current ? [toOptimisticIncome(input), ...current] : current
      )

      return { previousDashboardQueries, previousList }
    },

    onError: (_error, _input, context) => {
      for (const [queryKey, data] of context?.previousDashboardQueries ?? []) {
        queryClient.setQueryData(queryKey, data)
      }
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.incomes.list(), context.previousList)
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all })
    },
  })
}
