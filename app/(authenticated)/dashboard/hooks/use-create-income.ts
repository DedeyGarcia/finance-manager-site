"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { Dashboard } from "@/types/dashboard"
import type { IncomeCreate, IncomeRead } from "@/types/income"

function toMoney(value: string | number) {
  return Number(value)
}

function formatMoney(value: number) {
  return value.toFixed(2)
}

function applyOptimisticIncome(dashboard: Dashboard, income: IncomeCreate) {
  const amount = toMoney(income.amount)

  return {
    ...dashboard,
    total_incomes: formatMoney(Number(dashboard.total_incomes) + amount),
    total_balance: formatMoney(Number(dashboard.total_balance) + amount),
    total_one_time_incomes:
      income.income_type === "one_time"
        ? formatMoney(Number(dashboard.total_one_time_incomes) + amount)
        : dashboard.total_one_time_incomes,
    total_recurring_incomes:
      income.income_type === "recurring"
        ? formatMoney(Number(dashboard.total_recurring_incomes) + amount)
        : dashboard.total_recurring_incomes,
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
      await queryClient.cancelQueries({
        queryKey: queryKeys.dashboard.all,
      })

      const previousDashboardQueries = queryClient.getQueriesData<Dashboard>({
        queryKey: queryKeys.dashboard.all,
      })

      queryClient.setQueriesData<Dashboard>(
        { queryKey: queryKeys.dashboard.all },
        (current) => (current ? applyOptimisticIncome(current, input) : current)
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
