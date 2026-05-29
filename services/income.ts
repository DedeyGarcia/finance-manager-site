import "server-only"

import { apiFetch } from "@/lib/api-client"
import type { IncomeListResponse, IncomeRead } from "@/types/income"

export const IncomeService = {
  getAllIncomes: async (): Promise<IncomeRead[]> => {
    const res = await apiFetch<IncomeListResponse>("/incomes/")
    return res.data
  },
}
