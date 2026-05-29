"use client"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { Dashboard, DashboardQueryParams } from "@/types/dashboard"
import { useSuspenseQuery } from "@tanstack/react-query"

export function useDashboard(params?: DashboardQueryParams) {
  return useSuspenseQuery({
    queryKey: queryKeys.dashboard.summary(params),
    queryFn: () => apiFetch<Dashboard>("/api/dashboard", { query: params }),
  })
}
