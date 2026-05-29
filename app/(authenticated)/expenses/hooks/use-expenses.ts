"use client"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { ExpenseRead } from "@/types/expense"
import { useQuery } from "@tanstack/react-query"

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses.list(),
    queryFn: () => apiFetch<ExpenseRead[]>("/api/expenses/all"),
  })
}
