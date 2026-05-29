import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import type { IncomeCreate, IncomeListResponse, IncomeRead } from "@/types/income"
import { NextRequest } from "next/server"

export async function GET() {
  return forward(async () => {
    const res = await apiFetch<IncomeListResponse>("/incomes/")
    return res.data
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as IncomeCreate

  return forward(
    () =>
      apiFetch<IncomeRead>("/incomes/", {
        method: "POST",
        body,
      }),
    201
  )
}
