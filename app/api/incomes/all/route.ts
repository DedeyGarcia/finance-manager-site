import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import type { IncomeListResponse } from "@/types/income"

export async function GET() {
  return forward(async () => {
    const res = await apiFetch<IncomeListResponse>("/incomes/all")
    return res.data
  })
}
