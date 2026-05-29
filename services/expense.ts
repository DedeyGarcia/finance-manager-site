import "server-only"

import { apiFetch } from "@/lib/api-client"
import type { ExpenseListResponse, ExpenseRead } from "@/types/expense"

export const ExpenseService = {
  getAllExpenses: async (): Promise<ExpenseRead[]> => {
    const res = await apiFetch<ExpenseListResponse>("/expenses/")
    return res.data
  },
}
