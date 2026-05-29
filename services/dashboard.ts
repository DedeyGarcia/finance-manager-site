import "server-only"

import { apiFetch } from "@/lib/api-client"
import type { Dashboard, DashboardQueryParams } from "@/types/dashboard"

export const DashboardService = {
  getDashboard: (params?: DashboardQueryParams) => apiFetch<Dashboard>("/dashboard", { query: params }),
}
