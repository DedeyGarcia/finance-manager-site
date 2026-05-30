"use client"

import { apiFetch } from "@/lib/api-client"
import { adjustDashboardForIncome } from "@/lib/dashboard-optimistic"
import { queryKeys } from "@/lib/query-keys"
import type { Dashboard } from "@/types/dashboard"
import type { IncomeRead, IncomeUpdate } from "@/types/income"
import { useMutation, useQueryClient } from "@tanstack/react-query"

type UpdateIncomeInput = { id: string; input: IncomeUpdate }

function mergeIncome(old: IncomeRead, input: IncomeUpdate): IncomeRead {
  return {
    ...old,
    category_id: input.category_id ?? old.category_id,
    title: input.title ?? old.title,
    description: input.description !== undefined ? input.description : old.description,
    amount: input.amount != null ? Number(input.amount).toFixed(2) : old.amount,
    income_type: input.income_type ?? old.income_type,
    received_date:
      input.received_date !== undefined ? input.received_date : old.received_date,
    impact_start_date: input.impact_start_date ?? old.impact_start_date,
    impact_end_date:
      input.impact_end_date !== undefined ? input.impact_end_date : old.impact_end_date,
    source_text: input.source_text !== undefined ? input.source_text : old.source_text,
    updated_at: new Date().toISOString(),
  }
}

export function useUpdateIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: UpdateIncomeInput) =>
      apiFetch<IncomeRead>(`/api/incomes/${id}`, {
        method: "PATCH",
        body: input,
      }),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.incomes.list() })

      const previousDashboardQueries = queryClient.getQueriesData<Dashboard>({
        queryKey: queryKeys.dashboard.all,
      })
      const previousList = queryClient.getQueryData<IncomeRead[]>(
        queryKeys.incomes.list()
      )

      const old = previousList?.find((income) => income.id === id)
      if (!old) return { previousDashboardQueries, previousList }

      const updated = mergeIncome(old, input)

      queryClient.setQueryData<IncomeRead[]>(
        queryKeys.incomes.list(),
        (current) =>
          current?.map((income) => (income.id === id ? updated : income))
      )
      queryClient.setQueriesData<Dashboard>(
        { queryKey: queryKeys.dashboard.all },
        (current) =>
          current
            ? adjustDashboardForIncome(
                adjustDashboardForIncome(current, old, -1),
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
        queryClient.setQueryData(queryKeys.incomes.list(), context.previousList)
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all })
    },
  })
}
