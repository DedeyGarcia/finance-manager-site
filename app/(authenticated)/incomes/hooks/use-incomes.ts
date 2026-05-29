"use client"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { IncomeRead } from "@/types/income"
import { useQuery } from "@tanstack/react-query"

export function useIncomes() {
  return useQuery({
    queryKey: queryKeys.incomes.list(),
    queryFn: () => apiFetch<IncomeRead[]>("/api/incomes/all"),
  })
}
