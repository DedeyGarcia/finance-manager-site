"use client"

import { apiFetch } from "@/lib/api-client"
import { monthToPeriod } from "@/lib/month-period"
import { queryKeys } from "@/lib/query-keys"
import { useMonthStore } from "@/lib/stores/month-store"
import type { Dashboard } from "@/types/dashboard"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

export function useDashboard() {
  const year = useMonthStore((state) => state.year)
  const month = useMonthStore((state) => state.month)
  const period = monthToPeriod({ year, month })

  return useQuery({
    queryKey: queryKeys.dashboard.summary(period),
    queryFn: () => apiFetch<Dashboard>("/api/dashboard", { query: period }),
    placeholderData: keepPreviousData,
  })
}
