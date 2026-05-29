import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import type { ExpenseListResponse } from "@/types/expense"

export async function GET() {
  return forward(async () => {
    const res = await apiFetch<ExpenseListResponse>("/expenses/all")
    return res.data
  })
}
